/// <reference types="chrome" />

declare const ExtensionConfig: any;

// ── Main execution ──────────────────────────────────────────────────────────
(async function () {
  'use strict';

  // log wrapper around configured log callback
  const log = (...args: any[]) => {
    if (typeof ExtensionConfig !== 'undefined' && ExtensionConfig.log) {
      ExtensionConfig.log(...args);
    } else {
      console.error('[Preflight Error]', ...args);
    }
  };

  // error wrapper around configured error callback
  const logError = (...args: any[]) => {
    if (typeof ExtensionConfig !== 'undefined' && ExtensionConfig.logError) {
      ExtensionConfig.logError(...args);
    } else {
      console.error('[Preflight Error]', ...args);
    }
  };

  log('Content script loaded');
  log(`The config is: ${JSON.stringify(ExtensionConfig, null, 2)}`)

  // Check for the site enablement and invoke the engine
  // try {
  //   const currentUrl = location.href;
  //   log('Checking enablement for:', currentUrl);

  //   // 1. Check site enablement with retry logic for initial connection
  //   const checkSiteEnablement = async (retries = 3): Promise<{ matched: boolean; enabled: boolean; status?: string }> => {
  //     try {
  //       return await new Promise((resolve, reject) => {
  //         chrome.runtime.sendMessage({ action: 'IS_SITE_ENABLED', url: currentUrl }, (r: any) => {
  //           if (chrome.runtime.lastError) {
  //             reject(new Error(chrome.runtime.lastError.message));
  //           } else {
  //             resolve(r || { matched: false, enabled: false });
  //           }
  //         });
  //       });
  //     } catch (err: any) {
  //       if (retries > 0) {
  //         log('Retrying enablement check...', retries);
  //         await new Promise(r => setTimeout(r, 500));
  //         return checkSiteEnablement(retries - 1);
  //       }
  //       throw err;
  //     }
  //   };

  //   const siteEnablementResult = await checkSiteEnablement().catch(err => {
  //     logError('Failed to check site enablement:', err);
  //     return { matched: false, enabled: false, status: 'error' };
  //   });

  //   isCheckingEnablement = false;
  //   if (_earlyRemovalCleanup) {
  //     _earlyRemovalCleanup();
  //     _earlyRemovalCleanup = null;
  //   }
    
  //   if(!siteEnablementResult.enabled){
  //     log('Site not enabled, skip script initialization');
  //     return;
  //   }
    
  //   log('Enablement result:', JSON.stringify(siteEnablementResult));
    
  //   // 2. Handle site visit (inititialize model and reset the offscreen document timer)
  //   const success: boolean = await new Promise((resolve) => {
  //     chrome.runtime.sendMessage({ action: 'HANDLE_SITE_VISIT' }, (resp) => {
  //       resolve(resp?.success || false);
  //     });
  //   });

  //   if (!success) {
  //     SilentGuardConfig.logError('Failed to initialize offscreen model for site visit');
  //     return;
  //   }
    
  //   // 3. Load delight fonts
  //   loadDelightFonts();
  // } catch (e: any) {
  //   isCheckingEnablement = false;
  //   if (_earlyRemovalCleanup) {
  //     _earlyRemovalCleanup();
  //     _earlyRemovalCleanup = null;
  //   }
  //   logError('Preflight initialization error:', e);
  //   return;
  // }


  // async function readFilesAsBase64(files: File[]): Promise<FileInfo[]> {
  //   return Promise.all(
  //     files.map(async (file) => {
  //       const buffer = await file.arrayBuffer();
  //       const uint8 = new Uint8Array(buffer);

  //       let binary = '';
  //       const chunkSize = 8192;
  //       for (let i = 0; i < uint8.length; i += chunkSize) {
  //         binary += String.fromCharCode(...Array.from(uint8.subarray(i, i + chunkSize)));
  //       }

  //       return {
  //         name: file.name,
  //         type: file.type || 'application/octet-stream',
  //         size: file.size,
  //         text: btoa(binary)
  //       };
  //     })
  //   );
  // }

  log('Initialization complete');
})();

export {};