/// <reference types="chrome" />
const VERSION = '0.0.1';

enum Environment {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
}

const IS_PRODUCTION = (() => {
  try {
    if (typeof chrome === 'undefined') return false;
    if (typeof chrome.runtime?.getManifest !== 'function') return false;
    const manifest = chrome.runtime.getManifest();
    return !!manifest?.update_url;
  } catch {
    return false;
  }
})();

export const ExtensionConfig = {
  version: VERSION,
  env: IS_PRODUCTION ? Environment.PRODUCTION : Environment.DEVELOPMENT,

  log: (...args: any[]) => {
    if (!IS_PRODUCTION) console.log('[HARDWORD_LOG]', ...args);
  },

  logError: (...args: any[]) => {
    const sanitized = args.map(arg => {
      if (typeof arg === 'string') {
        return arg.replace(/Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi, 'Bearer [REDACTED]');
      }
      return arg;
    });
    console.error('[HARDWORD_ERROR]', ...sanitized);
  },

  logWarn: (...args: any[]) => {
    if (!IS_PRODUCTION) console.warn('[HARDWORD_WARN]', ...args);
  },

  defaults: {
    paletteOptions: {
      storage: true,
      formal: true,
      simple: true,
    },
  },

  storage: {
    local: {
      paletteOptionsKey: "paletteOptionsKey"
    }
  }

} as const;

export type ConfigKeys = keyof typeof ExtensionConfig;
export type LocalKey = keyof typeof ExtensionConfig.storage.local;

export default ExtensionConfig;