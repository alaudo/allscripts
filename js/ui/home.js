import { getManifest, getScript, getWordPool, getPhrases } from '../data.js';
import { getSettings, summary } from '../storage.js';
import { el, escapeHtml } from './dom.js';
import { t, transcriptionLabel, inputSystemLabel, localized } from '../i18n.js';

// Order: flashcards (letters → syllables → words → phrases) first, then the
// multiple-choice "Choose" drills in the same progression, then read & spell.
const PRACTICE_MODES = [
  { id: 'flashcards',        titleKey: 'mode.flashcards.title',        blurbKey: 'mode.flashcards.blurb',        icon: '🃏' },
  { id: 'flashcards-syllables', titleKey: 'mode.flashcards-syllables.title', blurbKey: 'mode.flashcards-syllables.blurb', icon: '🃏' },
  { id: 'flashcards-words',  titleKey: 'mode.flashcards-words.title',  blurbKey: 'mode.flashcards-words.blurb',  icon: '🃏' },
  { id: 'phrases',           titleKey: 'mode.phrases.title',           blurbKey: 'mode.phrases.blurb',           icon: '🃏' },
  { id: 'choose-letters',    titleKey: 'mode.choose-letters.title',    blurbKey: 'mode.choose-letters.blurb',    icon: '🎯' },
  { id: 'choose-syllables',  titleKey: 'mode.choose-syllables.title',  blurbKey: 'mode.choose-syllables.blurb',  icon: '🎯' },
  { id: 'choose-words',      titleKey: 'mode.choose-words.title',      blurbKey: 'mode.choose-words.blurb',      icon: '🎯' },
  { id: 'choose-phrases',    titleKey: 'mode.choose-phrases.title',    blurbKey: 'mode.choose-phrases.blurb',    icon: '🎯' },
  { id: 'read',              titleKey: 'mode.read.title',              blurbKey: 'mode.read.blurb',              icon: '👁️' },
  { id: 'spell',             titleKey: 'mode.spell.title',             blurbKey: 'mode.spell.blurb',             icon: '✍️' }
];

const REVIEW_MODES = [
  { id: 'preview-letters',   titleKey: 'mode.preview-letters.title',   blurbKey: 'mode.preview-letters.blurb',   icon: '🔤' },
  { id: 'preview-syllables', titleKey: 'mode.preview-syllables.title', blurbKey: 'mode.preview-syllables.blurb', icon: '🔡' },
  { id: 'preview-words',     titleKey: 'mode.preview-words.title',     blurbKey: 'mode.preview-words.blurb',     icon: '💬' },
  { id: 'preview-phrases',   titleKey: 'mode.preview-phrases.title',   blurbKey: 'mode.preview-phrases.blurb',   icon: '🗒️' }
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
         <span class="script-name">${escapeHtml(localized(s.name))}</span>
         <span class="script-stats">
           <span class="stat" title="${escapeHtml(t('home.stat.letters'))}">🔤 ${stats.lettersKnown}/${totalsFor.totalLetters}</span>
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

  // Active script info card (history + flags), rendered after the tools below.
  const current = manifest.scripts.find(s => s.id === settings.activeScript) || manifest.scripts[0];
  const infoText = localized(current.info);
  const compositionText = localized(current.composition);
  const conventionsText = localized(current.writingConventions);
  let aboutCard = null;
  if (infoText || compositionText || conventionsText || (current.countries && current.countries.length)) {
    const countryNames = (current.countries || []).map(c => localized(c.name)).filter(Boolean).join(', ');
    const flags = current.flagsSvg
      ? `<img class="flag-strip" src="${escapeHtml(`data/${current.folder}/${current.flagsSvg}`)}" alt="${escapeHtml(countryNames || localized(current.name))}" title="${escapeHtml(countryNames)}" />`
      : (current.countries || [])
        .map(c => {
          const cname = localized(c.name);
          return `<span class="flag" title="${escapeHtml(cname)}">${escapeHtml(c.flag || '')}</span>`;
        })
        .join('');
    aboutCard = el(
      `<div class="card script-about">
         <div class="about-header">
           <h2>${escapeHtml(t('home.about'))} <span class="muted">${escapeHtml(localized(current.name))}</span></h2>
           <div class="flags" aria-label="${escapeHtml(t('home.about_aria', { name: localized(current.name) }))}">${flags}</div>
         </div>
         ${infoText ? `<p class="about-text">${escapeHtml(infoText)}</p>` : ''}
         ${compositionText ? `<h3 class="about-subheading">${escapeHtml(t('home.composition'))}</h3>
         <p class="about-text">${escapeHtml(compositionText)}</p>` : ''}
         ${conventionsText ? `<h3 class="about-subheading">${escapeHtml(t('home.writing_conventions'))}</h3>
         <p class="about-text">${escapeHtml(conventionsText)}</p>` : ''}
       </div>`
    );
  }

  // Mode picker (practise)
  const config = [
    `${escapeHtml(t('home.config.transcription'))}: ${escapeHtml(transcriptionLabel(settings.transcription))}`,
    `${escapeHtml(t('home.config.input'))}: ${escapeHtml(inputSystemLabel(settings.inputSystem))}`,
    settings.vocalised ? escapeHtml(t('home.config.vocalised')) : null,
    settings.fuzzy ? escapeHtml(t('home.config.fuzzy')) : null,
    `<a href="#/settings">${escapeHtml(t('home.config.change'))}</a>`
  ].filter(Boolean).join(' · ');

  const modeCard = el(
    `<div class="card">
       <h2>${escapeHtml(t('home.section.practise'))} <span class="muted">${escapeHtml(localized(current.name))}</span></h2>
       <p class="muted small">${config}</p>
       <div class="mode-grid"></div>
     </div>`
  );
  const modeGrid = modeCard.querySelector('.mode-grid');
  for (const m of PRACTICE_MODES) {
    const a = el(
      `<a class="mode-card" href="#/${m.id}">
         <span class="mode-card-icon" aria-hidden="true">${m.icon}</span>
         <div class="mode-card-text">
           <h3>${escapeHtml(t(m.titleKey))}</h3>
           <p>${escapeHtml(t(m.blurbKey))}</p>
         </div>
       </a>`
    );
    modeGrid.appendChild(a);
  }
  root.appendChild(modeCard);

  // Review (no exercises)
  const reviewCard = el(
    `<div class="card review-card">
       <h2>${escapeHtml(t('home.section.review'))} <span class="muted">${escapeHtml(localized(current.name))}</span></h2>
       <p class="muted small">${escapeHtml(t('home.section.review.hint'))}</p>
       <div class="mode-grid review-grid"></div>
     </div>`
  );
  const reviewGrid = reviewCard.querySelector('.mode-grid');
  for (const m of REVIEW_MODES) {
    const a = el(
      `<a class="mode-card mode-card--review" href="#/${m.id}">
         <span class="mode-card-icon" aria-hidden="true">${m.icon}</span>
         <div class="mode-card-text">
           <h3>${escapeHtml(t(m.titleKey))}</h3>
           <p>${escapeHtml(t(m.blurbKey))}</p>
         </div>
       </a>`
    );
    reviewGrid.appendChild(a);
  }
  root.appendChild(reviewCard);
  if (aboutCard) root.appendChild(aboutCard);

  mount.appendChild(root);
}
