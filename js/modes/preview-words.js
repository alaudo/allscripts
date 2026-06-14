// Preview words — every word from the active script's pool on one page,
// native form on top with the transcription printed smaller and muted
// directly underneath. Two filter dimensions: source (curated vs
// international) and word length (dual-handled slider).

import { getManifest, getWordPool } from '../data.js';
import { getSettings, updateSettings } from '../storage.js';
import { el, escapeHtml, fieldFor, nextTranscription } from '../ui/dom.js';
import { t, transcriptionLabel, localized } from '../i18n.js';

function wordLength(w) {
  // Count user-visible characters; combining marks count as part of the base
  // character. Use Array.from to iterate by codepoints rather than code units.
  return Array.from(w.native || '').length;
}

export async function renderPreviewWords(_route, mount) {
  const settings = getSettings();
  const scriptId = settings.activeScript;
  const [manifest, pool] = await Promise.all([getManifest(), getWordPool(scriptId)]);
  const meta = manifest.scripts.find(s => s.id === scriptId);

  const useVoweled = !!settings.vocalised;

  const lengths = pool.map(wordLength);
  const minLen = lengths.length ? Math.min(...lengths) : 1;
  const maxLen = lengths.length ? Math.max(...lengths) : 1;

  // Filters: which sources are enabled, and the [min, max] length window.
  const sources = new Set(['curated', 'international']);
  let lo = minLen;
  let hi = maxLen;
  let transcription = settings.transcription;

  mount.innerHTML = '';
  const root = el(`<section class="preview-words"></section>`);

  const header = el(
    `<header class="mode-header">
       <a href="#/home" class="back">${escapeHtml(t('nav.back_home'))}</a>
       <h2>${escapeHtml(t('preview.words.header', { name: localized(meta.name) }))}</h2>
       <button type="button" class="transcription-toggle clickable" id="trans-toggle" title="${escapeHtml(t('transcription.cycle_tooltip'))}">${escapeHtml(transcriptionLabel(transcription))}</button>
     </header>`
  );
  root.appendChild(header);

  // Source chips
  const srcCounts = { curated: 0, international: 0 };
  for (const w of pool) srcCounts[w.source]++;
  const srcBar = el(`<div class="filter-bar" role="group" aria-label="${escapeHtml(t('preview.filter'))}"></div>`);
  const srcLabels = {
    curated: t('preview.src.curated'),
    international: t('preview.src.international')
  };
  const srcChips = {};
  for (const s of ['curated', 'international']) {
    if (srcCounts[s] === 0) continue;
    const chip = el(
      `<button type="button" class="chip on" data-src="${s}" aria-pressed="true">
         ${escapeHtml(srcLabels[s])} <span class="chip-count">${srcCounts[s]}</span>
       </button>`
    );
    chip.addEventListener('click', () => {
      if (sources.has(s)) sources.delete(s); else sources.add(s);
      if (sources.size === 0) sources.add(s);
      for (const k of Object.keys(srcChips)) {
        srcChips[k].classList.toggle('on', sources.has(k));
        srcChips[k].setAttribute('aria-pressed', String(sources.has(k)));
      }
      paint();
    });
    srcChips[s] = chip;
    srcBar.appendChild(chip);
  }
  root.appendChild(srcBar);

  // Length dual-slider
  const lenLabel = t('preview.length');
  const lenRange = el(
    `<div class="length-filter">
       <label class="length-label muted small">
         <span class="length-label-text">${escapeHtml(lenLabel)}:</span>
         <span class="length-value" id="len-value">${escapeHtml(t('preview.length.range', { min: lo, max: hi }))}</span>
       </label>
       <div class="length-sliders">
         <input type="range" id="len-min" min="${minLen}" max="${maxLen}" value="${lo}" step="1" aria-label="${escapeHtml(t('preview.length.min'))}" />
         <input type="range" id="len-max" min="${minLen}" max="${maxLen}" value="${hi}" step="1" aria-label="${escapeHtml(t('preview.length.max'))}" />
       </div>
     </div>`
  );
  root.appendChild(lenRange);

  const minInput = lenRange.querySelector('#len-min');
  const maxInput = lenRange.querySelector('#len-max');
  const lenValue = lenRange.querySelector('#len-value');
  const onLen = () => {
    lo = Math.min(+minInput.value, +maxInput.value);
    hi = Math.max(+minInput.value, +maxInput.value);
    lenValue.textContent = t('preview.length.range', { min: lo, max: hi });
    paint();
  };
  minInput.addEventListener('input', onLen);
  maxInput.addEventListener('input', onLen);

  if (minLen === maxLen) {
    // Hide the slider entirely when the pool is degenerate.
    lenRange.hidden = true;
  }

  const meter = el(`<div class="filter-meter muted small"></div>`);
  root.appendChild(meter);

  const grid = el(`<div class="preview-grid words-grid"></div>`);
  root.appendChild(grid);
  mount.appendChild(root);

  function paint() {
    const tField = fieldFor(transcription);
    grid.innerHTML = '';
    const filtered = pool.filter(w => {
      if (!sources.has(w.source)) return false;
      const len = wordLength(w);
      return len >= lo && len <= hi;
    });
    for (const w of filtered) {
      const native = (useVoweled && w.nativeVoweled) || w.native;
      const trans = w[tField] || w.ipa || '';
      const meaningText = localized(w.meaning);
      const meaning = meaningText ? `<span class="preview-meaning muted">${escapeHtml(meaningText)}</span>` : '';
      const noteText = localized(w.note);
      const note = noteText
        ? `<span class="preview-note" title="${escapeHtml(noteText)}" aria-label="${escapeHtml(noteText)}">ℹ︎</span>`
        : '';
      const cell = el(
        `<div class="preview-cell word-cell" data-src="${w.source}">
           <span class="preview-native" dir="${meta.direction}">${escapeHtml(native)}</span>
           <span class="preview-trans">${escapeHtml(trans)}</span>
           ${meaning}
           ${note}
         </div>`
      );
      grid.appendChild(cell);
    }
    if (!filtered.length) {
      grid.appendChild(el(`<div class="muted small">${escapeHtml(t('preview.empty'))}</div>`));
    }
    meter.textContent = t('preview.count', { shown: filtered.length, total: pool.length });
  }

  header.querySelector('#trans-toggle').addEventListener('click', () => {
    transcription = nextTranscription(transcription);
    updateSettings({ transcription });
    header.querySelector('#trans-toggle').textContent = transcriptionLabel(transcription);
    paint();
  });

  paint();
}
