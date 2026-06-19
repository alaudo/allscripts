import { startRouter, registerRoute, setFallback, redispatch } from './router.js';
import { initTheme, applyTheme } from './theme.js';
import { applyChromeStrings, t, setLang, currentLang, LANGUAGES } from './i18n.js';
import { getSettings, updateSettings } from './storage.js';
import { registerServiceWorker } from './pwa.js';
import { renderHome } from './ui/home.js';
import { renderSettings } from './ui/settings.js';
import { renderFlashcards } from './modes/flashcards.js';
import { renderFlashcardsSyllables } from './modes/flashcards-syllables.js';
import { renderFlashcardsWords } from './modes/flashcards-words.js';
import { renderRead } from './modes/read.js';
import { renderSpell } from './modes/spell.js';
import { renderPhrases } from './modes/phrases.js';
import { renderPreviewLetters } from './modes/preview-letters.js';
import { renderPreviewSyllables } from './modes/preview-syllables.js';
import { renderPreviewWords } from './modes/preview-words.js';
import { renderPreviewPhrases } from './modes/preview-phrases.js';
import { renderChooseLetters, renderChooseSyllables, renderChooseWords, renderChoosePhrases } from './modes/choose.js';

applyChromeStrings();
initTheme();
initLangToggle();
registerServiceWorker();

registerRoute('home', renderHome);
registerRoute('settings', renderSettings);
registerRoute('flashcards', renderFlashcards);
registerRoute('flashcards-syllables', renderFlashcardsSyllables);
registerRoute('flashcards-words', renderFlashcardsWords);
registerRoute('read', renderRead);
registerRoute('spell', renderSpell);
registerRoute('phrases', renderPhrases);
registerRoute('preview-letters', renderPreviewLetters);
registerRoute('preview-syllables', renderPreviewSyllables);
registerRoute('preview-words', renderPreviewWords);
registerRoute('preview-phrases', renderPreviewPhrases);
registerRoute('choose-letters', renderChooseLetters);
registerRoute('choose-syllables', renderChooseSyllables);
registerRoute('choose-words', renderChooseWords);
registerRoute('choose-phrases', renderChoosePhrases);

setFallback(async (_, mount) => {
  mount.innerHTML =
    `<section class="card">
       <h2>${escapeHtml(t('app.not_found'))}</h2>
       <p><a href="#/home">${escapeHtml(t('app.go_home'))}</a></p>
     </section>`;
});

const mount = document.getElementById('view');
startRouter(mount).catch(err => {
  console.error(err);
  mount.innerHTML =
    `<section class="card error">
       <h2>Could not start the app</h2>
       <p>${escapeHtml(err.message)}</p>
       <p>If you opened <code>index.html</code> directly, serve the folder over HTTP instead:</p>
       <pre>python -m http.server 8000</pre>
     </section>`;
});

// Wire up the header language toggle: cycles through the available UI
// languages, updates settings, re-applies chrome strings, refreshes any
// label that depends on language (theme tooltip), and re-renders the
// current route so its in-page strings update too.
function initLangToggle() {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;
  refreshLangToggle();
  btn.addEventListener('click', () => {
    const order = LANGUAGES.map(l => l.code);
    const cur = currentLang();
    const next = order[(order.indexOf(cur) + 1) % order.length];
    updateSettings({ uiLanguage: next });
    setLang(next);
    applyChromeStrings();
    applyTheme(getSettings().theme);
    refreshLangToggle();
    redispatch();
  });
}

function refreshLangToggle() {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;
  const code = currentLang();
  const lang = LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
  btn.textContent = code.toUpperCase();
  btn.title = t('lang.tooltip', { name: lang.name });
  btn.setAttribute('aria-label', t('lang.aria'));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
