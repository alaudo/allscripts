import { getManifest, getScript, getSyllables, getWordPool, getPhrases } from '../data.js';
import { bindEscToHome, el, escapeHtml, fieldFor } from './dom.js';
import { currentLang, localized, t } from '../i18n.js';

const DECK_TYPES = [
  { id: 'letters', labelKey: 'decks.type.letters' },
  { id: 'syllables', labelKey: 'decks.type.syllables' },
  { id: 'words', labelKey: 'decks.type.words' },
  { id: 'phrases', labelKey: 'decks.type.phrases' },
  { id: 'combined', labelKey: 'decks.type.combined' }
];

let stopEscToHome = null;

export async function renderDecks(_, mount) {
  stopEscToHome?.();
  stopEscToHome = bindEscToHome();
  const manifest = await getManifest();
  const summaries = await Promise.all(manifest.scripts.map(scriptDeckSummary));
  const allCount = summaries.reduce((sum, s) => sum + s.counts.combined, 0);

  mount.innerHTML = '';
  const root = el(`
    <section class="decks">
      <header class="mode-header">
        <a href="#/home" class="back">${escapeHtml(t('nav.back_home'))}</a>
        <h2>${escapeHtml(t('decks.title'))}</h2>
        <span class="muted small">${escapeHtml(t('nav.esc_home'))}</span>
      </header>

      <div class="card">
        <p class="muted">${escapeHtml(t('decks.intro'))}</p>
        <p class="muted small">${escapeHtml(t('decks.format_hint'))}</p>
      </div>

      <div class="card deck-card deck-card-all">
        <div class="deck-card-header">
          <div>
            <h3>${escapeHtml(t('decks.all.title'))}</h3>
            <p class="muted small">${escapeHtml(t('decks.all.hint', { count: allCount }))}</p>
          </div>
          <button type="button" class="btn" data-all-combined>${escapeHtml(t('decks.download'))}</button>
        </div>
      </div>

      <div class="deck-list"></div>
    </section>
  `);

  root.querySelector('[data-all-combined]').addEventListener('click', async () => {
    const rows = [];
    for (const s of manifest.scripts) rows.push(...await buildDeckRows(s.id, 'combined'));
    downloadDeck('allscripts-all-combined.txt', rows, 'allScripts::All Combined');
  });

  const list = root.querySelector('.deck-list');
  for (const summary of summaries) {
    const card = el(`
      <div class="card deck-card">
        <div class="deck-card-header">
          <div>
            <h3>${escapeHtml(summary.name)}</h3>
            <p class="muted small" dir="${summary.direction}">${escapeHtml(summary.nativeName)}</p>
          </div>
        </div>
        <div class="deck-download-grid"></div>
      </div>
    `);
    const grid = card.querySelector('.deck-download-grid');
    for (const type of DECK_TYPES) {
      const count = summary.counts[type.id] || 0;
      const button = el(`
        <button type="button" class="deck-download" data-type="${escapeHtml(type.id)}" ${count ? '' : 'disabled'}>
          <span class="deck-download-title">${escapeHtml(t(type.labelKey))}</span>
          <span class="deck-download-count">${escapeHtml(t('decks.card_count', { count }))}</span>
        </button>
      `);
      button.addEventListener('click', async () => {
        const rows = await buildDeckRows(summary.id, type.id);
        downloadDeck(
          `allscripts-${summary.id}-${type.id}.txt`,
          rows,
          `allScripts::${summary.name}::${t(type.labelKey)}`
        );
      });
      grid.appendChild(button);
    }
    list.appendChild(card);
  }

  mount.appendChild(root);
}

async function scriptDeckSummary(entry) {
  const [script, syllables, words, phrases] = await Promise.all([
    getScript(entry.id),
    getSyllables(entry.id),
    getWordPool(entry.id),
    getPhrases(entry.id)
  ]);
  return {
    id: entry.id,
    name: localized(script.meta.name),
    nativeName: script.meta.nativeName,
    direction: script.meta.direction,
    counts: {
      letters: script.letters.length,
      syllables: syllables.length,
      words: words.length,
      phrases: phrases.length,
      combined: script.letters.length + syllables.length + words.length + phrases.length
    }
  };
}

export async function buildDeckRows(scriptId, type) {
  const script = await getScript(scriptId);
  const builders = {
    letters: () => buildLetterRows(script),
    syllables: async () => buildSyllableRows(script, await getSyllables(scriptId)),
    words: async () => buildWordRows(script, await getWordPool(scriptId)),
    phrases: async () => buildPhraseRows(script, await getPhrases(scriptId))
  };
  if (type === 'combined') {
    const groups = await Promise.all([
      builders.letters(),
      builders.syllables(),
      builders.words(),
      builders.phrases()
    ]);
    return groups.flat();
  }
  return builders[type] ? builders[type]() : [];
}

function buildLetterRows(script) {
  return script.letters.map(letter => {
    const ex = letter.example || {};
    const front = `<div class="anki-glyph" dir="${attr(script.meta.direction)}">${html(letter.glyph)}</div>`;
    const back = [
      transcriptionTable(letter),
      localized(letter.note) ? `<p>${html(localized(letter.note))}</p>` : '',
      ex.native ? `<p><b>${html(t('decks.example'))}</b> <span dir="${attr(script.meta.direction)}">${html(ex.native)}</span> ${html(ex.latin || ex.ipa || '')} - ${html(localized(ex.meaning))}</p>` : ''
    ].filter(Boolean).join('');
    return [front, back, tags(script.meta.id, 'letters')];
  });
}

function buildSyllableRows(script, syllables) {
  return syllables.map(item => {
    const native = item.nativeVoweled || item.native;
    const category = t(`preview.syll.cat.${item.category || 'common'}`);
    const front = `<div class="anki-glyph" dir="${attr(script.meta.direction)}">${html(native)}</div>`;
    const back = [
      transcriptionTable(item),
      `<p>${html(category)}</p>`,
      localized(item.note) ? `<p>${html(localized(item.note))}</p>` : ''
    ].filter(Boolean).join('');
    return [front, back, tags(script.meta.id, 'syllables', item.category)];
  });
}

function buildWordRows(script, words) {
  return words.map(word => {
    const native = word.nativeVoweled || word.native;
    const front = `<div class="anki-word" dir="${attr(script.meta.direction)}">${html(native)}</div>`;
    const back = [
      `<p><b>${html(localized(word.meaning))}</b></p>`,
      transcriptionTable(word),
      localized(word.note) ? `<p>${html(localized(word.note))}</p>` : ''
    ].filter(Boolean).join('');
    return [front, back, tags(script.meta.id, 'words', word.source || word.category)];
  });
}

function buildPhraseRows(script, phrases) {
  return phrases.map(phrase => {
    const translation = (phrase.translations && (phrase.translations[currentLang()] || phrase.translations.en)) || '';
    const front = `<div class="anki-word" dir="${attr(script.meta.direction)}">${html(phrase.native)}</div>`;
    const back = [
      `<p><b>${html(translation)}</b></p>`,
      transcriptionTable(phrase)
    ].filter(Boolean).join('');
    return [front, back, tags(script.meta.id, 'phrases')];
  });
}

function transcriptionTable(item) {
  const fields = [
    ['IPA', item.ipa],
    ['Latin', item.latin || item[fieldFor('english')]],
    ['Cyrillic', item.cyrillic || item[fieldFor('russian')]]
  ].filter(([, value]) => value);
  if (!fields.length) return '';
  return `<table>${fields.map(([label, value]) => `<tr><th>${html(label)}</th><td>${html(value)}</td></tr>`).join('')}</table>`;
}

function downloadDeck(filename, rows, deckName) {
  const text = ankiText(rows, deckName);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ankiText(rows, deckName) {
  const headers = [
    '#separator:Tab',
    '#html:true',
    '#notetype:Basic',
    `#deck:${deckName}`,
    '#columns:Front\tBack\tTags',
    '#tags column:3'
  ];
  return headers.concat(rows.map(row => row.map(tsv).join('\t'))).join('\n') + '\n';
}

function tsv(value) {
  return String(value ?? '')
    .replace(/\t/g, ' ')
    .replace(/\r?\n/g, '<br>');
}

function tags(...parts) {
  return ['allscripts', ...parts.filter(Boolean)]
    .map(part => String(part).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, ''))
    .filter(Boolean)
    .join(' ');
}

function html(value) {
  return escapeHtml(value);
}

function attr(value) {
  return escapeHtml(value || '');
}
