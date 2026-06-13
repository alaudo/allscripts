// Theme controller. The actual CSS lives in styles.css under
// :root[data-theme="..."] — we just toggle the attribute and keep the topbar
// icon/tooltip in sync.

import { getSettings, updateSettings } from './storage.js';
import { t } from './i18n.js';

const THEME_ORDER = ['auto', 'light', 'dark'];

export function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'light' || theme === 'dark') {
    html.setAttribute('data-theme', theme);
  } else {
    html.setAttribute('data-theme', 'auto');
  }
  updateThemeToggle(theme);
}

export function nextTheme(current) {
  const i = THEME_ORDER.indexOf(current);
  return THEME_ORDER[(i + 1) % THEME_ORDER.length];
}

function updateThemeToggle(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const key = THEME_ORDER.includes(theme) ? theme : 'auto';
  btn.textContent = t(`theme.${key}.icon`);
  const tip = t(`theme.${key}.tooltip`);
  btn.title = tip;
  btn.setAttribute('aria-label', t('theme.aria'));
}

export function initTheme() {
  const current = getSettings().theme;
  applyTheme(current);
  const btn = document.getElementById('theme-toggle');
  if (btn && !btn.dataset.bound) {
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const next = nextTheme(getSettings().theme);
      updateSettings({ theme: next });
      applyTheme(next);
    });
  }
}


