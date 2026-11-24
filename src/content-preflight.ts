/// <reference types="chrome" />

// ── Types ─────────────────────────────────────────────────────────────────────

interface SimplifyRequest {
  action: 'SIMPLIFY_WORD';
  word: string;
}

// ── Selection Tooltip Implementation ──────────────────────────────────────────

const TOOLTIP_ID = 'hardword-simplify-tooltip';

function getOrCreateTooltip(): HTMLElement {
  let tooltip = document.getElementById(TOOLTIP_ID);
  if (tooltip) return tooltip;

  tooltip = document.createElement('div');
  tooltip.id = TOOLTIP_ID;

  // Use inline styling with explicit reset to prevent host page CSS interference
  Object.assign(tooltip.style, {
    position:        'fixed',
    zIndex:          '2147483647',
    display:         'none',
    alignItems:      'center',
    gap:             '0',
    background:      '#18181b',
    border:          '1px solid rgba(255,255,255,0.15)',
    borderRadius:    '8px',
    padding:         '0',
    boxShadow:       '0 6px 20px rgba(0,0,0,0.6)',
    overflow:        'hidden',
    fontFamily:      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    userSelect:      'none',
    pointerEvents:   'auto',
    lineHeight:      'normal',
    color:           '#ffffff',
  });

  const btn = document.createElement('button');
  btn.id = `${TOOLTIP_ID}-btn`;

  Object.assign(btn.style, {
    display:         'flex',
    alignItems:      'center',
    gap:             '6px',
    padding:         '7px 14px',
    background:      'transparent',
    border:          'none',
    color:           '#10b981',
    fontSize:        '13px',
    fontWeight:      '600',
    fontFamily:      'inherit',
    cursor:          'pointer',
    letterSpacing:   '0.02em',
    whiteSpace:      'nowrap',
    transition:      'background 0.15s, transform 0.1s',
    outline:         'none',
    margin:          '0',
  });

  // Sparkle / simplify icon
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
    <span>Simplify</span>
  `;

  btn.addEventListener('mouseenter', () => {
    btn.style.background = 'rgba(16,185,129,0.15)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = 'transparent';
  });

  btn.addEventListener('mousedown', (e) => {
    // Prevent clearing the selection when clicking the button
    e.preventDefault();
    e.stopPropagation();
  });

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const word = getSelectedText();
    if (!word) return;

    hideTooltip();
    sendToBackground(word);
  });

  tooltip.appendChild(btn);
  document.body.appendChild(tooltip);
  return tooltip;
}

function showTooltipAtRect(rect: DOMRect): void {
  const tooltip = getOrCreateTooltip();
  tooltip.style.display = 'flex';

  const OFFSET = 8;
  const tw = tooltip.offsetWidth || 115;
  const th = tooltip.offsetHeight || 36;

  // Center above selection
  let left = rect.left + rect.width / 2 - tw / 2;
  let top = rect.top - th - OFFSET;

  // If too close to top of viewport, display underneath selection
  if (top < 8) {
    top = rect.bottom + OFFSET;
  }

  // Clamp within viewport
  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
  top = Math.max(8, Math.min(top, window.innerHeight - th - 8));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTooltip(): void {
  const tooltip = document.getElementById(TOOLTIP_ID);
  if (tooltip && tooltip.style.display !== 'none') {
    tooltip.style.display = 'none';
  }
}

function getSelectedText(): string {
  return window.getSelection()?.toString().trim() ?? '';
}

function sendToBackground(word: string): void {
  const msg: SimplifyRequest = { action: 'SIMPLIFY_WORD', word };
  try {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Hardword] sendMessage error:', chrome.runtime.lastError.message);
        return;
      }
      console.log('[Hardword] Background response:', response);
    });
  } catch (err) {
    console.error('[Hardword] Runtime error sending message:', err);
  }
}

function handleSelectionChange(): void {
  const sel = window.getSelection();
  const text = sel?.toString().trim();

  if (!text || !sel || sel.rangeCount === 0) {
    hideTooltip();
    return;
  }

  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // If rect has zero dimensions (collapsed/hidden), don't show
  if (rect.width === 0 && rect.height === 0) {
    hideTooltip();
    return;
  }

  showTooltipAtRect(rect);
}

// ── Initialize Listeners ──────────────────────────────────────────────────────

function initSelectionListener(): void {
  // mouseup & dblclick catch mouse selections
  const onSelectionEnd = () => {
    setTimeout(handleSelectionChange, 10);
  };

  document.addEventListener('mouseup', onSelectionEnd);
  document.addEventListener('dblclick', onSelectionEnd);
  document.addEventListener('keyup', (e: KeyboardEvent) => {
    // Also catch Shift + Arrow key selections
    if (e.shiftKey || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      setTimeout(handleSelectionChange, 10);
    }
  });

  // Hide when clicking outside tooltip or initiating new selection
  document.addEventListener('mousedown', (e: MouseEvent) => {
    const tooltip = document.getElementById(TOOLTIP_ID);
    if (tooltip && !tooltip.contains(e.target as Node)) {
      hideTooltip();
    }
  });

  window.addEventListener('scroll', hideTooltip, { passive: true, capture: true });
  window.addEventListener('resize', hideTooltip, { passive: true });
}

// ── Content Script Main ────────────────────────────────────────────────────────

(function main() {
  console.log('[Hardword] Content script initialized');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSelectionListener);
  } else {
    initSelectionListener();
  }
})();

export {};
