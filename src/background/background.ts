// // SilentGuard Shield — Background Service Worker
/// <reference types="chrome" />

import ExtensionConfig from "../config";

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update') {
        ExtensionConfig.log('Extension updated, setting default palette options');  
        chrome.storage.local.set({ 
            [ExtensionConfig.storage.local.paletteOptionsKey as string]: { ...ExtensionConfig.defaults.paletteOptions } 
        });
        ExtensionConfig.log('setting palette options successful from background script');
    }
})

// // ── onInstalled ───────────────────────────────────────────────────────────────
// chrome.runtime.onInstalled.addListener((details) => {
//   SilentGuardConfig.log('SilentGuard Shield onInstalled triggered', JSON.stringify(details, null, 2));

//   // Set default settings from config in chrome's sync storage
//   chrome.storage.sync.set({
//     [SilentGuardConfig.storage.sync.settings]: SilentGuardConfig.defaults.settings,
//   }, () => {
//     SilentGuardConfig.log('Default sync settings initialized');
//   });

//   // Register the idle alarm that survives SW sleep (replaces setTimeout)
//   ensureIdleAlarm();

//   if (details.reason === 'install') {
//     SilentGuardConfig.log('Extension reason is "install", proceeding to open auth page');

//     chrome.storage.local.get(SilentGuardConfig.storage.local.apiBase, (store) => {
//       const apiBase      = (store as StorageResult)[SilentGuardConfig.storage.local.apiBase] as string | undefined;
//       const dashboardUrl = SilentGuardConfig.dashboard.getBaseUrl(apiBase);
//       const authUrl      = `${dashboardUrl}${SilentGuardConfig.dashboard.paths.extensionAuth}`;

//       SilentGuardConfig.log('Auth page redirection details:', { apiBase, dashboardUrl, authUrl });

//       // Open auth page in new tab
//       chrome.tabs.create({ url: authUrl }, (tab) => {
//         if (chrome.runtime.lastError) {
//           SilentGuardConfig.logError('Failed to create auth tab:', chrome.runtime.lastError);
//         } else {
//           SilentGuardConfig.log('Auth tab created successfully', { tabId: tab?.id });
//         }
//       });
//     });

//     SilentGuardConfig.log('[BG] First install — triggering model download via offscreen doc');
//     ensureOffscreenDocument().catch((err) => {
//       SilentGuardConfig.logError('[BG] First-install offscreen failed:', err);
//     });

//   } else {
//     SilentGuardConfig.log(`Extension onInstalled reason: ${details.reason} (not "install")`);
//   }
// });

// // ── onStartup ─────────────────────────────────────────────────────────────────
// chrome.runtime.onStartup.addListener(() => {
//   SilentGuardConfig.log('[BG] onStartup — re-registering idle alarm and ensuring offscreen doc');

//   // Re-register alarm in case it was lost after a browser restart
//   ensureIdleAlarm();

//   // Re-create the offscreen document
//   ensureOffscreenDocument().catch((err) => {
//     SilentGuardConfig.logError('[BG] onStartup offscreen failed:', err);
//   });
// });

// // ── Alarm handler (idle watchdog) ─────────────────────────────────────────────
// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name !== IDLE_ALARM_NAME) return;
//   SilentGuardConfig.log('[BG] Idle watchdog alarm fired');
  
//   // Send heartbeat to backend
//   sendHeartbeat().catch((err) => {
//     SilentGuardConfig.logError('[BG] sendHeartbeat error:', err);
//   });
  
//   checkIdleAndOffload().catch((err) => {
//     SilentGuardConfig.logError('[BG] checkIdleAndOffload error:', err);
//   });
// });

// // ── Message handling ──────────────────────────────────────────────────────────
// chrome.runtime.onMessage.addListener(handleMessage);
// chrome.runtime.onMessageExternal.addListener(handleMessage);

// // ── Tab lifecycle ─────────────────────────────────────────────────────────────
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   // Check if the tab is fully loaded
//   if (changeInfo.status !== 'complete' || !tab.url) return;


//   (async () => {
//     const res = await getUrlEnablement(tab.url!);
//     SilentGuardConfig.log(`[Tab OnUpdate Event Handler] Tab ID: ${tabId} URL: ${tab.url} enablement result: ${JSON.stringify(res, null, 2)}`);

//     if (!res.matched) {
//       stopPulsatingIcon(tabId);
//       return;
//     }

//     if (res.enabled) {
//       SilentGuardConfig.log(`[Tab OnUpdate Event Handler] URL: ${tab.url} is enabled, starting pulsating icon and handling site visit`);
//       startPulsatingIcon(tabId);
//       handleSupportedSiteVisit('background-script');
//     } else {
//       SilentGuardConfig.log(`[Tab OnUpdate Event Handler] URL: ${tab.url} is disabled, stopping pulsating icon`);
//       stopPulsatingIcon(tabId);

//       if (res.status === 'ignore') return;

//       try {
//         let hostname = '';
//         try {
//           hostname = new URL(tab.url!).hostname;
//         } catch {
//           const m = tab.url!.match(/https?:\/\/([^/]+)/);
//           if (m) hostname = m[1];
//         }

//         const platformMetadata: PlatformMetadata = {
//           chatUrl: tab.url!,
//           platform: hostname,
//           platformUrl: `https://${hostname}`,
//           allowedPlatform: false
//         };        
//         await logShadowSiteVisit(platformMetadata);

//         let disabledUrl = chrome.runtime.getURL('disabled.html');
//         if (hostname) disabledUrl += `?domain=${encodeURIComponent(hostname)}`;
//         chrome.tabs.update(tabId, { url: disabledUrl });
//       } catch { /* skip */ }
//     }
//   })();
// });

// chrome.tabs.onRemoved.addListener((tabId) => {
//   stopPulsatingIcon(tabId);
// });

// // ── SW start (every wake) ─────────────────────────────────────────────────────
// SilentGuardConfig.log('[BG] Service worker started — ensuring offscreen document');
// ensureOffscreenDocument().catch((err) => {
//   SilentGuardConfig.logError('[BG] Failed to ensure offscreen on SW start:', err);
// });