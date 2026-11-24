import { ExtensionConfig } from "../config";

const STORAGE_KEY = "paletteOptions";

interface OptionsPaletteState {
  storage: boolean;
  formal: boolean;
  simple: boolean;
}

type OptionKey = keyof OptionsPaletteState;

const OPTION_CHECKBOX_IDS: Record<OptionKey, string> = {
  storage: 'optStorage',
  formal:  'optFormal',
  simple:  'optSimple',
};

const DEFAULT_STATE: OptionsPaletteState = {
  storage: true,
  formal:  true,
  simple:  true,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function readFromStorage(): Promise<OptionsPaletteState> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      let raw = result[STORAGE_KEY];

      if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch { raw = null; }
      }

      if (raw && typeof raw === 'object') {
        resolve({ ...DEFAULT_STATE, ...raw } as OptionsPaletteState);
      } else {
        resolve({ ...DEFAULT_STATE });
      }
    });
  });
}

function writeToStorage(state: OptionsPaletteState): void {
  chrome.storage.local.set({ [STORAGE_KEY]: state }, () => {
    if (chrome.runtime.lastError) {
      ExtensionConfig.logError('Failed to persist palette options:', chrome.runtime.lastError.message);
    }
  });
}

// ── UI ───────────────────────────────────────────────────────────────────────

function applyStateToUI(state: OptionsPaletteState): void {
  for (const key of Object.keys(OPTION_CHECKBOX_IDS) as OptionKey[]) {
    const el = document.getElementById(OPTION_CHECKBOX_IDS[key]) as HTMLInputElement | null;
    if (el) el.checked = state[key];
  }
}

function attachToggleListeners(currentState: OptionsPaletteState): void {
  for (const key of Object.keys(OPTION_CHECKBOX_IDS) as OptionKey[]) {
    const el = document.getElementById(OPTION_CHECKBOX_IDS[key]) as HTMLInputElement | null;
    if (!el) continue;

    el.addEventListener('change', () => {
      currentState[key] = el.checked;
      writeToStorage(currentState);
      ExtensionConfig.log(`Palette option "${key}" toggled to ${el.checked}`);
    });
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const appContent = document.getElementById('appContent');
  if (appContent) appContent.style.display = '';

  const versionEl = document.getElementById('versionDisplay');
  if (versionEl) versionEl.textContent = `v${ExtensionConfig.version}`;

  const state = await readFromStorage();

  if (!chrome.runtime.lastError) {
    writeToStorage(state);
  }

  applyStateToUI(state);
  attachToggleListeners(state);
});

