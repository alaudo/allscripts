import { getManifest, getScript, getWordPool } from '../data.js';
import { getSettings, summary } from '../storage.js';
import { el, escapeHtml, transcriptionLabel, inputSystemLabel } from './dom.js';

const MODES = [
  { id: 'flashcards', title: 'Flashcards',      blurb: 'Letter on the front, transcription and an example word on the back.' },
  { id: 'read',       title: 'Read & transcribe', blurb: 'A word in the script — type its Latin, Cyrillic or IPA transcription.' },
  { id: 'spell',      title: 'Spell in script',   blurb: 'A word in Latin/Cyrillic/IPA — type it in the target script.' }
];

export async function renderHome(_, mount) {
  const settings = getSettings();
  const manifest = await getManifest();

  mount.innerHTML = '';
  const root = el('<section class="home"></section>');

  // Active-script picker
  const picker = el('<div class="card"><h2>Pick a script</h2><div class="script-grid"></div></div>');
  const grid = picker.querySelector('.script-grid');

  // Pre-load all scripts + pools in parallel so each tile knows its totals.
  const totals = await Promise.all(manifest.scripts.map(async s => {
    const [script, pool] = await Promise.all([getScript(s.id), getWordPool(s.id)]);
    return { id: s.id, totalLetters: script.letters.length, totalWords: pool.length };
  }));
  const totalsById = Object.fromEntries(totals.map(t => [t.id, t]));

  for (const s of manifest.scripts) {
    const stats = summary(s.id);
    const totalsFor = totalsById[s.id];
    const active = s.id === settings.activeScript;
    const card = el(
      `<button class="script-card ${active ? 'active' : ''}" data-script="${escapeHtml(s.id)}">
         <span class="script-native" dir="${s.direction}">${escapeHtml(s.nativeName)}</span>
         <span class="script-name">${escapeHtml(s.name)}</span>
         <span class="script-stats" title="letters learned · words practised">
           <span class="stat" title="letters learned">🔤 ${stats.lettersKnown}/${totalsFor.totalLetters}</span>
           <span class="stat-sep">·</span>
           <span class="stat" title="words practised">💬 ${stats.wordsLearned}/${totalsFor.totalWords}</span>
         </span>
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

  // Active script info card (history + flags)
  const current = manifest.scripts.find(s => s.id === settings.activeScript) || manifest.scripts[0];
  if (current.info || (current.countries && current.countries.length)) {
    const flags = (current.countries || [])
      .map(c => `<span class="flag" title="${escapeHtml(c.name)}">${c.flag}</span>`)
      .join('');
    const aboutCard = el(
      `<div class="card script-about">
         <div class="about-header">
           <h2>About <span class="muted">${escapeHtml(current.name)}</span></h2>
           <div class="flags" aria-label="Where ${escapeHtml(current.name)} is used">${flags}</div>
         </div>
         ${current.info ? `<p class="about-text">${escapeHtml(current.info)}</p>` : ''}
       </div>`
    );
    root.appendChild(aboutCard);
  }

  // Mode picker
  const modeCard = el(
    `<div class="card">
       <h2>Practise <span class="muted">${escapeHtml(current.name)}</span></h2>
       <p class="muted small">Transcription: ${escapeHtml(transcriptionLabel(settings.transcription))} · Word input: ${escapeHtml(inputSystemLabel(settings.inputSystem))}${settings.vocalised ? ' · vocalised' : ''}${settings.fuzzy ? ' · fuzzy match' : ''} · <a href="#/settings">change</a></p>
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
