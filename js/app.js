import { startRouter, registerRoute, setFallback } from './router.js';
import { renderHome } from './ui/home.js';
import { renderSettings } from './ui/settings.js';
import { renderFlashcards } from './modes/flashcards.js';
import { renderRead } from './modes/read.js';
import { renderSpell } from './modes/spell.js';

registerRoute('home', renderHome);
registerRoute('settings', renderSettings);
registerRoute('flashcards', renderFlashcards);
registerRoute('read', renderRead);
registerRoute('spell', renderSpell);

setFallback(async (_, mount) => {
  mount.innerHTML =
    `<section class="card">
       <h2>Not found</h2>
       <p>That route doesn't exist. <a href="#/home">Back home</a>.</p>
     </section>`;
});

const mount = document.getElementById('view');
startRouter(mount).catch(err => {
  console.error(err);
  mount.innerHTML =
    `<section class="card error">
       <h2>Could not start the app</h2>
       <p>${err.message}</p>
       <p>If you opened <code>index.html</code> directly, serve the folder over HTTP instead:</p>
       <pre>python -m http.server 8000</pre>
     </section>`;
});
