// Preview alphabet — every letter of the active script on one page, with
// transcription printed (smaller, muted) directly below the glyph. Filter
// chips toggle which categories (vowels / consonants / marks) are visible.

import { getScript, getManifest, getWordPool } from '../data.js';
import { getSettings, updateSettings } from '../storage.js';
import { el, escapeHtml, fieldFor, nextTranscription } from '../ui/dom.js';
import { t, transcriptionLabel, localized } from '../i18n.js';

// Split a letter's glyph cell (e.g. "Α α" or "क" or "◌्") into the bare
// character forms we should match against word text. Whitespace separates
// upper/lower forms in scripts that show both, and the dotted-circle
// placeholder (U+25CC) is just a typographic stand-in for combining marks.
function letterForms(glyph) {
  return (glyph || '')
    .split(/\s+/)
    .map(form => form.replace(/\u25CC/g, ''))
    .filter(Boolean);
}

// Hangul syllables (U+AC00..U+D7A3) are precomposed blocks of jamo, but the
// alphabet lists letters as Compatibility Jamo (U+3131..U+318F). To match a
// letter like ㄱ against a word like 가족, decompose each syllable into its
// constituent jamo first. Algorithm per Unicode 3.12 "Hangul Syllable
// Decomposition", followed by Hangul-Jamo → Compatibility-Jamo remapping.
const HANGUL_INITIAL_TO_COMPAT = [
  0x3131, 0x3132, 0x3134, 0x3137, 0x3138, 0x3139, 0x3141, 0x3142, 0x3143,
  0x3145, 0x3146, 0x3147, 0x3148, 0x3149, 0x314A, 0x314B, 0x314C, 0x314D, 0x314E
];
const HANGUL_MEDIAL_TO_COMPAT = [
  0x314F, 0x3150, 0x3151, 0x3152, 0x3153, 0x3154, 0x3155, 0x3156, 0x3157,
  0x3158, 0x3159, 0x315A, 0x315B, 0x315C, 0x315D, 0x315E, 0x315F, 0x3160,
  0x3161, 0x3162, 0x3163
];
const HANGUL_FINAL_TO_COMPAT = [
  0,      0x3131, 0x3132, 0x3133, 0x3134, 0x3135, 0x3136, 0x3137, 0x3139,
  0x313A, 0x313B, 0x313C, 0x313D, 0x313E, 0x313F, 0x3140, 0x3141, 0x3142,
  0x3144, 0x3145, 0x3146, 0x3147, 0x3148, 0x314A, 0x314B, 0x314C, 0x314D, 0x314E
];

function decomposeHangul(text) {
  if (!text) return '';
  let out = '';
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const idx = code - 0xAC00;
      const initial = Math.floor(idx / (21 * 28));
      const medial  = Math.floor((idx % (21 * 28)) / 28);
      const final_  = idx % 28;
      out += String.fromCodePoint(HANGUL_INITIAL_TO_COMPAT[initial]);
      out += String.fromCodePoint(HANGUL_MEDIAL_TO_COMPAT[medial]);
      if (final_) out += String.fromCodePoint(HANGUL_FINAL_TO_COMPAT[final_]);
    } else {
      out += ch;
    }
  }
  return out;
}

function wordContainsLetter(nativeWord, glyph) {
  if (!nativeWord) return false;
  const forms = letterForms(glyph);
  if (!forms.length) return false;
  const wordDecomposed = decomposeHangul(nativeWord);
  const wordLower = wordDecomposed.toLocaleLowerCase();
  return forms.some(form => {
    const f = decomposeHangul(form);
    if (wordDecomposed.includes(f)) return true;
    const fl = f.toLocaleLowerCase();
    return !!fl && wordLower.includes(fl);
  });
}

// Build the de-duplicated list of words that contain this letter, drawn from
// the script's curated examples, curated word list, and any international
// entries that ship a form for this script. Returns plain word objects with
// at least { native, ipa, latin, cyrillic, meaning, source }.
function findWordsForLetter(letter, script, pool) {
  const seen = new Map();
  const consider = (entry) => {
    if (!entry?.native) return;
    if (!wordContainsLetter(entry.native, letter.glyph)) return;
    if (!seen.has(entry.native)) seen.set(entry.native, entry);
  };
  // Letter's own example always counts (carries `meaning`).
  if (letter.example) consider({ ...letter.example, source: 'curated' });
  // Other letters' examples — they share the letter if it appears in the word.
  for (const other of script.letters) {
    if (other === letter || !other.example) continue;
    consider({ ...other.example, source: 'curated' });
  }
  // Curated + international word pool.
  for (const w of pool) consider(w);
  return [...seen.values()];
}

// Characters we consider as IPA vowels (a superset covering all the scripts
// shipped in this app). Diacritics like ː / ˈ are stripped before testing.
const VOWEL_RE = /[aeiouyæɛɪɔʊʌəɑɒɵøœɯɤʏɨɘɞɜɐɶ]/i;

function letterCategory(letter) {
  const glyph = letter.glyph || '';
  // Combining marks render with a dotted-circle placeholder; we use that as
  // the strongest signal a letter is actually a diacritic / mark.
  if (glyph.includes('\u25CC')) return 'mark';
  const ipa = (letter.ipa || '').trim();
  if (!ipa || ipa === '—' || ipa.startsWith('(')) return 'mark';
  // Strip suprasegmentals, length marks and combining diacritics before
  // deciding whether what's left is purely vocalic.
  const stripped = ipa.replace(/[ˈˌːʰʷʲˤʴ̥̩̃\s.\u02D0-\u02FF\u0300-\u036F]/g, '');
  if (!stripped) return 'mark';
  if ([...stripped].every(ch => VOWEL_RE.test(ch))) return 'vowel';
  return 'consonant';
}

export async function renderPreviewLetters(_route, mount) {
  const settings = getSettings();
  const scriptId = settings.activeScript;
  const [manifest, script, pool] = await Promise.all([
    getManifest(),
    getScript(scriptId),
    getWordPool(scriptId)
  ]);
  const meta = manifest.scripts.find(s => s.id === scriptId);
  let selectedGlyph = null;

  // Count letters per category — only chips for non-empty categories appear.
  const cats = { vowel: 0, consonant: 0, mark: 0 };
  for (const l of script.letters) cats[letterCategory(l)]++;
  const present = ['consonant', 'vowel', 'mark'].filter(c => cats[c] > 0);
  const active = new Set(present);

  let transcription = settings.transcription;

  mount.innerHTML = '';
  const root = el(`<section class="preview-letters"></section>`);

  const transcriptionBtnHtml =
    `<button type="button" class="transcription-toggle clickable" id="trans-toggle" title="${escapeHtml(t('transcription.cycle_tooltip'))}">${escapeHtml(transcriptionLabel(transcription))}</button>`;

  const header = el(
    `<header class="mode-header">
       <a href="#/home" class="back">${escapeHtml(t('nav.back_home'))}</a>
       <h2>${escapeHtml(t('preview.letters.header', { name: localized(meta.name) }))}</h2>
       ${transcriptionBtnHtml}
     </header>`
  );
  root.appendChild(header);

  const bar = el(`<div class="filter-bar" role="group" aria-label="${escapeHtml(t('preview.filter'))}"></div>`);
  const labels = {
    vowel: t('preview.cat.vowels'),
    consonant: t('preview.cat.consonants'),
    mark: t('preview.cat.marks')
  };
  const chips = {};
  for (const cat of present) {
    const chip = el(
      `<button type="button" class="chip on" data-cat="${cat}" aria-pressed="true">
         ${escapeHtml(labels[cat])} <span class="chip-count">${cats[cat]}</span>
       </button>`
    );
    chip.addEventListener('click', () => {
      if (active.has(cat)) active.delete(cat); else active.add(cat);
      if (active.size === 0) active.add(cat); // never let user filter to nothing
      for (const c of present) {
        chips[c].classList.toggle('on', active.has(c));
        chips[c].setAttribute('aria-pressed', String(active.has(c)));
      }
      paint();
    });
    chips[cat] = chip;
    bar.appendChild(chip);
  }
  root.appendChild(bar);

  const meter = el(`<div class="filter-meter muted small"></div>`);
  root.appendChild(meter);

  const grid = el(`<div class="preview-grid"></div>`);
  root.appendChild(grid);
  mount.appendChild(root);

  function paint() {
    const tField = fieldFor(transcription);
    grid.innerHTML = '';
    const filtered = script.letters.filter(l => active.has(letterCategory(l)));
    // If the previously selected letter is no longer visible, clear selection.
    if (selectedGlyph && !filtered.some(l => l.glyph === selectedGlyph)) {
      selectedGlyph = null;
    }
    for (const l of filtered) {
      const trans = l[tField] || l.ipa || '';
      const noteText = localized(l.note);
      const note = noteText
        ? `<span class="preview-note" title="${escapeHtml(noteText)}" aria-label="${escapeHtml(noteText)}">ℹ︎</span>`
        : '';
      const isSelected = l.glyph === selectedGlyph;
      const cell = el(
        `<button type="button" class="preview-cell clickable${isSelected ? ' selected' : ''}" data-cat="${letterCategory(l)}" aria-pressed="${isSelected}">
           <span class="preview-native" dir="${meta.direction}">${escapeHtml(l.glyph)}</span>
           <span class="preview-trans">${escapeHtml(trans)}</span>
           ${note}
         </button>`
      );
      cell.addEventListener('click', () => {
        selectedGlyph = isSelected ? null : l.glyph;
        paint();
      });
      grid.appendChild(cell);
      if (isSelected) {
        grid.appendChild(buildInlay(l, tField));
      }
    }
    if (!filtered.length) {
      grid.appendChild(el(`<div class="muted small">${escapeHtml(t('preview.empty'))}</div>`));
    }
    meter.textContent = t('preview.count', { shown: filtered.length, total: script.letters.length });
  }

  function buildInlay(letter, tField) {
    const words = findWordsForLetter(letter, script, pool);
    const heading = t('preview.letter.words', { glyph: letter.glyph, count: words.length });
    const inlay = el(
      `<div class="letter-inlay" role="region" aria-label="${escapeHtml(heading)}">
         <div class="letter-inlay-head">
           <span class="letter-inlay-title">${escapeHtml(heading)}</span>
         </div>
       </div>`
    );
    if (!words.length) {
      inlay.appendChild(el(
        `<div class="muted small">${escapeHtml(t('preview.letter.no_words'))}</div>`
      ));
      return inlay;
    }
    const list = el(`<div class="detail-words"></div>`);
    for (const w of words) {
      const trans = w[tField] || w.ipa || w.latin || '';
      const meaning = localized(w.meaning);
      list.appendChild(el(
        `<div class="detail-word" data-src="${w.source || 'curated'}">
           <span class="detail-word-native" dir="${meta.direction}">${escapeHtml(w.native)}</span>
           <span class="detail-word-trans">${escapeHtml(trans)}</span>
           ${meaning ? `<span class="detail-word-meaning muted">${escapeHtml(meaning)}</span>` : ''}
         </div>`
      ));
    }
    inlay.appendChild(list);
    return inlay;
  }

  header.querySelector('#trans-toggle').addEventListener('click', () => {
    transcription = nextTranscription(transcription);
    updateSettings({ transcription });
    header.querySelector('#trans-toggle').textContent = transcriptionLabel(transcription);
    paint();
  });

  paint();
}
