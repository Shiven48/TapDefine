import { OptionKey, OptionsPaletteState, readStorage, writeStorage } from "../storage";
import { ExtensionConfig } from "../config";

interface BackgroundStatusKeys {
  dot: string;
  text: string;
  badge: string;
}
type BackgroundKey = keyof BackgroundStatusKeys;

const OPTION_CHECKBOX_IDS: Record<OptionKey, string> = {
  storage: 'optStorage',
  formal: 'optFormal',
  simple: 'optSimple',
};

const SW_STATUS_IDS: Record<BackgroundKey, string> = {
  dot: 'swStatusDot',
  text: 'swStatusText',
  badge: 'swStatusBadge',
};

// ── UI ───────────────────────────────────────────────────────────────────────

function applyStateToUI(state: OptionsPaletteState): void {
  for (const key of Object.keys(OPTION_CHECKBOX_IDS) as OptionKey[]) {
    const el = document.getElementById(OPTION_CHECKBOX_IDS[key]) as HTMLInputElement | null;
    if (el) el.checked = state[key];
  }
}

function attachToggleListeners(options: OptionsPaletteState): void {
  for (const key of Object.keys(OPTION_CHECKBOX_IDS) as OptionKey[]) {
    const el = document.getElementById(OPTION_CHECKBOX_IDS[key]) as HTMLInputElement | null;
    if (!el) continue;

    el.addEventListener('change', async () => {
      // Update the in-memory options and write it to chrome storage
      options[key] = el.checked;
      await writeStorage('paletteOptionsKey', options);
      ExtensionConfig.log(`Palette option "${key}" toggled to ${el.checked}`);
    });
  }
}

function updateSWStatusBadge(alive: boolean): void {
  const dot = document.getElementById(SW_STATUS_IDS.dot) as HTMLDivElement | null;
  const text = document.getElementById(SW_STATUS_IDS.text) as HTMLSpanElement | null;
  const badge = document.getElementById(SW_STATUS_IDS.badge) as HTMLDivElement | null;

  if (!dot || !text || !badge) return;

  // 1. Remove both states first
  dot.classList.remove('status-green', 'status-amber');
  badge.classList.remove('is-active', 'is-inactive');

  // 2. Apply the correct state
  if (alive) {
    dot.classList.add('status-green');
    badge.classList.add('is-active');
    text.textContent = 'Active';
    text.style.color = '#22c55e'; // or var(--primary)
  } else {
    dot.classList.add('status-amber');
    badge.classList.add('is-inactive');
    text.textContent = 'Inactive';
    text.style.color = '#f59e0b';
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
const _pollSW = async ():Promise<void> => {
  try {
    const response:{ alive:boolean } = await chrome.runtime.sendMessage({ target: 'SW', type: 'PING' });
    updateSWStatusBadge(response?.alive ?? false);
  } catch (e) {
    updateSWStatusBadge(false)
  }
  
  setTimeout(_pollSW, 2000);
};
// NOTE: This `popup.html` DOM is loaded after the background script
document.addEventListener('DOMContentLoaded', async () => {

  // step 1: Display the UI (as it has none)
  const appContent = document.getElementById('appContent');
  if (appContent) appContent.style.display = '';

  // step 2: Update the version
  const versionEl = document.getElementById('versionDisplay');
  if (versionEl) versionEl.textContent = `v${ExtensionConfig.version}`;

  // step 3: Read for the settings from chrome.storage.local
  const options:OptionsPaletteState = await readStorage('paletteOptionsKey');
  applyStateToUI(options);

  // step 4: Apply the Toggle Listeners
  attachToggleListeners(options);

  // step 5: Poll service worker
  await _pollSW();
});



