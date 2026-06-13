import { getSettings, updateSettings } from './storage.js';

const THEME_ORDER = ['auto', 'light', 'dark'];

const THEME_META = {
  auto:  { icon: '🌓', label: 'Theme: match system (click to switch to Light)' },
  light: { icon: '☀️', label: 'Theme: light (click to switch to Dark)' },
  dark:  { icon: '🌙', label: 'Theme: dark (click to switch to Auto)' }
};

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
  const meta = THEME_META[theme] || THEME_META.auto;
  btn.textContent = meta.icon;
  btn.title = meta.label;
  btn.setAttribute('aria-label', meta.label);
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

