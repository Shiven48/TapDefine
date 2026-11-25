/// <reference types="chrome" />

import ExtensionConfig from "./config";
import { readStorage, writeStorage } from "./storage";

const IDLE_ALARM_NAME = 'bgHeartbeatAlarm'
export const ALARM_PERIOD_MIN = 1;

// ── Message Handler ─────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== 'SW') return false;

  switch (message.type) {

    case 'SIMPLIFY':
      const word: string = message.word ?? '';
        ExtensionConfig.log('received word:', word);
        // [TODO]: forward to local finetuned SLM
        sendResponse({ success: true, word });
        return true;

    case 'PING':
      sendResponse({ alive: true });
      return false;

    default:
      return false;
    }  
});

// ── onInstalled ───────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async (details) => {

  _ensureIdleAlarm()

  // Force install the defaults on `installation` event
  if(details.reason === 'install') {
    ExtensionConfig.log('Extension installed, setting default palette options');
    const paletteOptionsKey = 'paletteOptionsKey';
    writeStorage(paletteOptionsKey, ExtensionConfig.defaults['paletteOptions']);
    ExtensionConfig.log(`Installation complete, defaults set for key: ${paletteOptionsKey}`);
  }

  // If i update and there is already data in the localstorage then don't reset anything just safely read and return
  if (details.reason === 'update') {
    ExtensionConfig.log('Extension updated, reading for stored data');
    const paletteOptionsKey = 'paletteOptionsKey';

    // 1. Check if there is already data in storage if no then write defaults
    const paletteOptions = await readStorage(paletteOptionsKey);
    if (paletteOptions) {
      ExtensionConfig.log(`There is already data in the storage for key: ${paletteOptionsKey}`);
      return;
    }
    
    // 2. There is nothing in the storage write defaults
    ExtensionConfig.log(`There is nothing to read in the storage, writing defaults...`)
    writeStorage(paletteOptionsKey, ExtensionConfig.defaults['paletteOptions'])
    ExtensionConfig.log(`Default palette options set successfully with storedKey: ${paletteOptionsKey}`);
  }
});

// ── onStartup ───────────────────────────────────────────────────────────────
chrome.runtime.onStartup.addListener(() => {
  ExtensionConfig.log('[BG] onStartup — re-registering idle alarm');
  _ensureIdleAlarm();
  // [TODO] Create offscreen document when the model is available
});

// Register an alarm when SW wakes up that triggers every 60s
chrome.alarms.create(IDLE_ALARM_NAME, { periodInMinutes: ALARM_PERIOD_MIN });

export function _ensureIdleAlarm(): void {
  chrome.alarms.get(IDLE_ALARM_NAME, (existing) => {
    if (!existing) {
      chrome.alarms.create(IDLE_ALARM_NAME, { periodInMinutes: ALARM_PERIOD_MIN });
      ExtensionConfig.log(`Idle alarm created (period: ${ALARM_PERIOD_MIN} min)`);
    }
  });
}

// Do some side effects when the alarm is fired every 60s
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== IDLE_ALARM_NAME) return;
  ExtensionConfig.log(`${IDLE_ALARM_NAME} alarm fired`);
});