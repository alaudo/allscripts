import { getManifest, getScript, getWordPool, getPhrases } from '../data.js';
import { getSettings, summary } from '../storage.js';
import { el, escapeHtml } from './dom.js';
import { t, transcriptionLabel, inputSystemLabel } from '../i18n.js';

const MODES = [
  { id: 'flashcards',      titleKey: 'mode.flashcards.title',      blurbKey: 'mode.flashcards.blurb' },
  { id: 'read',            titleKey: 'mode.read.title',            blurbKey: 'mode.read.blurb' },
  { id: 'spell',           titleKey: 'mode.spell.title',           blurbKey: 'mode.spell.blurb' },
  { id: 'phrases',         titleKey: 'mode.phrases.title',         blurbKey: 'mode.phrases.blurb' },
  { id: 'preview-letters', titleKey: 'mode.preview-letters.title', blurbKey: 'mode.preview-letters.blurb' },
  { id: 'preview-words',   titleKey: 'mode.preview-words.title',   blurbKey: 'mode.preview-words.blurb' }
];

export async function renderHome(_, mount) {
  const settings = getSettings();
  const manifest = await getManifest();

  mount.innerHTML = '';
  const root = el('<section class="home"></section>');

  // Active-script picker
  const picker = el(`<div class="card"><h2>${escapeHtml(t('home.pick_script'))}</h2><div class="script-grid"></div></div>`);
  const grid = picker.querySelector('.script-grid');

  // Pre-load all scripts + pools + phrase counts in parallel so each tile knows its totals.
  const totals = await Promise.all(manifest.scripts.map(async s => {
    const [script, pool, phrases] = await Promise.all([getScript(s.id), getWordPool(s.id), getPhrases(s.id)]);
    return { id: s.id, totalLetters: script.letters.length, totalWords: pool.length, totalPhrases: phrases.length };
  }));
  const totalsById = Object.fromEntries(totals.map(x => [x.id, x]));

  for (const s of manifest.scripts) {
    const stats = summary(s.id);
    const totalsFor = totalsById[s.id];
    const active = s.id === settings.activeScript;
    const card = el(
      `<button class="script-card ${active ? 'active' : ''}" data-script="${escapeHtml(s.id)}">
         <span class="script-native" dir="${s.direction}">${escapeHtml(s.nativeName)}</span>
         <span class="script-name">${escapeHtml(s.name)}</span>
         <span class="script-stats">
           <span class="stat" title="${escapeHtml(t('home.stat.letters'))}">📝 ${stats.lettersKnown}/${totalsFor.totalLetters}</span>
           <span class="stat-sep">·</span>
           <span class="stat" title="${escapeHtml(t('home.stat.words'))}">💬 ${stats.wordsLearned}/${totalsFor.totalWords}</span>
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
           <h2>${escapeHtml(t('home.about'))} <span class="muted">${escapeHtml(current.name)}</span></h2>
           <div class="flags" aria-label="${escapeHtml(t('home.about_aria', { name: current.name }))}">${flags}</div>
         </div>
         ${current.info ? `<p class="about-text">${escapeHtml(current.info)}</p>` : ''}
       </div>`
    );
    root.appendChild(aboutCard);
  }

  // Mode picker
  const config = [
    `${escapeHtml(t('home.config.transcription'))}: ${escapeHtml(transcriptionLabel(settings.transcription))}`,
    `${escapeHtml(t('home.config.input'))}: ${escapeHtml(inputSystemLabel(settings.inputSystem))}`,
    settings.vocalised ? escapeHtml(t('home.config.vocalised')) : null,
    settings.fuzzy ? escapeHtml(t('home.config.fuzzy')) : null,
    `<a href="#/settings">${escapeHtml(t('home.config.change'))}</a>`
  ].filter(Boolean).join(' · ');

  const modeCard = el(
    `<div class="card">
       <h2>${escapeHtml(t('home.practise'))} <span class="muted">${escapeHtml(current.name)}</span></h2>
       <p class="muted small">${config}</p>
       <div class="mode-grid"></div>
     </div>`
  );
  const modeGrid = modeCard.querySelector('.mode-grid');
  for (const m of MODES) {
    const a = el(
      `<a class="mode-card" href="#/${m.id}">
         <h3>${escapeHtml(t(m.titleKey))}</h3>
         <p>${escapeHtml(t(m.blurbKey))}</p>
       </a>`
    );
    modeGrid.appendChild(a);
  }
  root.appendChild(modeCard);

  mount.appendChild(root);
}
