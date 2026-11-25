/// <reference types="chrome" />

import ExtensionConfig from "./config";
import { readStorage, writeStorage } from "./storage";



// ── Simplify word ─────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== 'SIMPLIFY') return false;

  const word: string = message.word ?? '';
  ExtensionConfig.log('[BG] received word:', word);

  // TODO: forward to local finetuned SLM
  sendResponse({ success: true, word });

  return true;
});

// ── onInstalled ───────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async (details) => {

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
