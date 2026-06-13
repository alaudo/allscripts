// Preview alphabet — every letter of the active script on one page, with
// transcription printed (smaller, muted) directly below the glyph. Filter
// chips toggle which categories (vowels / consonants / marks) are visible.

import { getScript, getManifest } from '../data.js';
import { getSettings, updateSettings } from '../storage.js';
import { el, escapeHtml, fieldFor, nextTranscription } from '../ui/dom.js';
import { t, transcriptionLabel } from '../i18n.js';

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
  const [manifest, script] = await Promise.all([getManifest(), getScript(scriptId)]);
  const meta = manifest.scripts.find(s => s.id === scriptId);

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
       <h2>${escapeHtml(t('preview.letters.header', { name: meta.name }))}</h2>
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
    for (const l of filtered) {
      const trans = l[tField] || l.ipa || '';
      const note = l.note
        ? `<span class="preview-note" title="${escapeHtml(l.note)}" aria-label="${escapeHtml(l.note)}">ℹ︎</span>`
        : '';
      const cell = el(
        `<div class="preview-cell" data-cat="${letterCategory(l)}">
           <span class="preview-native" dir="${meta.direction}">${escapeHtml(l.glyph)}</span>
           <span class="preview-trans">${escapeHtml(trans)}</span>
           ${note}
         </div>`
      );
      grid.appendChild(cell);
    }
    if (!filtered.length) {
      grid.appendChild(el(`<div class="muted small">${escapeHtml(t('preview.empty'))}</div>`));
    }
    meter.textContent = t('preview.count', { shown: filtered.length, total: script.letters.length });
  }

  header.querySelector('#trans-toggle').addEventListener('click', () => {
    transcription = nextTranscription(transcription);
    updateSettings({ transcription });
    header.querySelector('#trans-toggle').textContent = transcriptionLabel(transcription);
    paint();
  });

  paint();
}
