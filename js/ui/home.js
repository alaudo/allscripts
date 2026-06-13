import { getManifest } from '../data.js';
import { getSettings, summary } from '../storage.js';
import { el, escapeHtml, transcriptionLabel } from './dom.js';

const MODES = [
  { id: 'flashcards', title: 'Flashcards',      blurb: 'Letter on the front, transcription and an example word on the back.' },
  { id: 'read',       title: 'Read & transcribe', blurb: 'A word in the script — type its Latin or Cyrillic transcription.' },
  { id: 'spell',      title: 'Spell in script',   blurb: 'A word in Latin/Cyrillic — type it in the target script.' }
];

export async function renderHome(_, mount) {
  const settings = getSettings();
  const manifest = await getManifest();

  mount.innerHTML = '';
  const root = el('<section class="home"></section>');

  // Active-script picker
  const picker = el('<div class="card"><h2>Pick a script</h2><div class="script-grid"></div></div>');
  const grid = picker.querySelector('.script-grid');
  for (const s of manifest.scripts) {
    const stats = summary(s.id);
    const active = s.id === settings.activeScript;
    const card = el(
      `<button class="script-card ${active ? 'active' : ''}" data-script="${escapeHtml(s.id)}">
         <span class="script-native" dir="${s.direction}">${escapeHtml(s.nativeName)}</span>
         <span class="script-name">${escapeHtml(s.name)}</span>
         <span class="script-stats">${stats.lettersKnown} letters · ${stats.wordsCorrect}/${stats.wordsCorrect + stats.wordsWrong} words</span>
       </button>`
    );
    card.addEventListener('click', async () => {
      const { updateSettings } = await import('../storage.js');
      updateSettings({ activeScript: s.id });
      renderHome(_, mount);
    });
    grid.appendChild(card);
  }
  root.appendChild(picker);

  // Mode picker
  const current = manifest.scripts.find(s => s.id === settings.activeScript) || manifest.scripts[0];
  const modeCard = el(
    `<div class="card">
       <h2>Practise <span class="muted">${escapeHtml(current.name)}</span></h2>
       <p class="muted small">Transcription: ${escapeHtml(transcriptionLabel(settings.transcription))} · Word input: ${escapeHtml(settings.inputSystem)} · <a href="#/settings">change</a></p>
       <div class="mode-grid"></div>
     </div>`
  );
  const modeGrid = modeCard.querySelector('.mode-grid');
  for (const m of MODES) {
    const a = el(
      `<a class="mode-card" href="#/${m.id}">
         <h3>${escapeHtml(m.title)}</h3>
         <p>${escapeHtml(m.blurb)}</p>
       </a>`
    );
    modeGrid.appendChild(a);
  }
  root.appendChild(modeCard);

  mount.appendChild(root);
}
