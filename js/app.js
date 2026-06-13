import { startRouter, registerRoute, setFallback } from './router.js';
import { initTheme } from './theme.js';
import { applyChromeStrings, t } from './i18n.js';
import { renderHome } from './ui/home.js';
import { renderSettings } from './ui/settings.js';
import { renderFlashcards } from './modes/flashcards.js';
import { renderRead } from './modes/read.js';
import { renderSpell } from './modes/spell.js';
import { renderPhrases } from './modes/phrases.js';
import { renderPreviewLetters } from './modes/preview-letters.js';
import { renderPreviewWords } from './modes/preview-words.js';

applyChromeStrings();
initTheme();

registerRoute('home', renderHome);
registerRoute('settings', renderSettings);
registerRoute('flashcards', renderFlashcards);
registerRoute('read', renderRead);
registerRoute('spell', renderSpell);
registerRoute('phrases', renderPhrases);
registerRoute('preview-letters', renderPreviewLetters);
registerRoute('preview-words', renderPreviewWords);

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

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
