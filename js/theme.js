import { getSettings } from './storage.js';

export function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'light' || theme === 'dark') {
    html.setAttribute('data-theme', theme);
  } else {
    html.setAttribute('data-theme', 'auto');
  }
}

export function initTheme() {
  applyTheme(getSettings().theme);
}
