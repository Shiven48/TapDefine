/// <reference types="chrome" />

import ExtensionConfig from "./config";

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
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'update' || details.reason === 'install') {
    ExtensionConfig.log('Extension installed/updated, setting default palette options');
    chrome.storage.local.set({
      paletteOptions: { formal: true, simple: true, storage: true }
    });
    ExtensionConfig.log('Default palette options set successfully');
  }
});
