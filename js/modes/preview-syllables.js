// Preview syllables & forms — an intermediate layer between individual
// letters and full words. Click a syllable/form to see training words and
// phrases that contain it, mirroring the word inlay in the alphabet preview.

import { getManifest, getScript, getSyllables, getWordPool, getPhrases } from '../data.js';
import { getSettings, updateSettings } from '../storage.js';
import { el, escapeHtml, fieldFor, nextTranscription } from '../ui/dom.js';
import { t, currentLang, transcriptionLabel, localized } from '../i18n.js';

const CATEGORY_ORDER = ['common', 'form', 'conjunct', 'block'];

function searchableText(word) {
  return [word.native, word.nativeVoweled].filter(Boolean).join('\n').normalize('NFC');
}

function syllableForms(item) {
  const raw = item.match?.length ? item.match : [item.native];
  return raw
    .flatMap(form => String(form).split(/\s+/))
    .map(form => form.replace(/\u25CC/g, '').normalize('NFC'))
    .filter(Boolean);
}

function entryContainsSyllable(entry, item) {
  const text = searchableText(entry);
  if (!text) return false;
  const lower = text.toLocaleLowerCase();
  return syllableForms(item).some(form => {
    if (text.includes(form)) return true;
    const fl = form.toLocaleLowerCase();
    return !!fl && lower.includes(fl);
  });
}

function findWordsForSyllable(item, pool) {
  const seen = new Map();
  for (const word of pool) {
    if (!word?.native) continue;
    if (!entryContainsSyllable(word, item)) continue;
    if (!seen.has(word.native)) seen.set(word.native, word);
  }
  return [...seen.values()];
}

function findPhrasesForSyllable(item, phrases) {
  const seen = new Map();
  for (const phrase of phrases) {
    if (!phrase?.native) continue;
    if (!entryContainsSyllable(phrase, item)) continue;
    if (!seen.has(phrase.native)) seen.set(phrase.native, phrase);
  }
  return [...seen.values()];
}

export async function renderPreviewSyllables(_route, mount) {
  const settings = getSettings();
  const scriptId = settings.activeScript;
  const [manifest, script, items, pool, phrases] = await Promise.all([
    getManifest(),
    getScript(scriptId),
    getSyllables(scriptId),
    getWordPool(scriptId),
    getPhrases(scriptId)
  ]);
  const meta = manifest.scripts.find(s => s.id === scriptId);
  const useVoweled = !!settings.vocalised;
  let transcription = settings.transcription;
  let selectedNative = null;

  mount.innerHTML = '';
  const root = el(`<section class="preview-syllables"></section>`);
  const header = el(
    `<header class="mode-header">
       <a href="#/home" class="back">${escapeHtml(t('nav.back_home'))}</a>
       <h2>${escapeHtml(t('preview.syllables.header', { name: localized(meta.name) }))}</h2>
       <button type="button" class="transcription-toggle clickable" id="trans-toggle" title="${escapeHtml(t('transcription.cycle_tooltip'))}">${escapeHtml(transcriptionLabel(transcription))}</button>
     </header>`
  );
  root.appendChild(header);

  if (!items.length) {
    root.appendChild(el(`<div class="card"><p class="muted">${escapeHtml(t('preview.syllables.empty'))}</p></div>`));
    mount.appendChild(root);
    return;
  }

  const counts = {};
  for (const item of items) {
    const cat = item.category || 'common';
    counts[cat] = (counts[cat] || 0) + 1;
  }
  const present = [
    ...CATEGORY_ORDER.filter(cat => counts[cat]),
    ...Object.keys(counts).filter(cat => !CATEGORY_ORDER.includes(cat)).sort()
  ];
  const active = new Set(present);

  const bar = el(`<div class="filter-bar" role="group" aria-label="${escapeHtml(t('preview.filter'))}"></div>`);
  const chips = {};
  for (const cat of present) {
    const chip = el(
      `<button type="button" class="chip on" data-cat="${escapeHtml(cat)}" aria-pressed="true">
         ${escapeHtml(t('preview.syll.cat.' + cat))} <span class="chip-count">${counts[cat]}</span>
       </button>`
    );
    chip.addEventListener('click', () => {
      if (active.has(cat)) active.delete(cat); else active.add(cat);
      if (active.size === 0) active.add(cat);
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
    const filtered = items.filter(item => active.has(item.category || 'common'));
    if (selectedNative && !filtered.some(item => item.native === selectedNative)) {
      selectedNative = null;
    }

    for (const item of filtered) {
      const native = (useVoweled && item.nativeVoweled) || item.native;
      const trans = item[tField] || item.ipa || item.latin || '';
      const noteText = localized(item.note);
      const note = noteText
        ? `<span class="preview-note" title="${escapeHtml(noteText)}" aria-label="${escapeHtml(noteText)}">ℹ︎</span>`
        : '';
      const isSelected = item.native === selectedNative;
      const cell = el(
        `<button type="button" class="preview-cell clickable${isSelected ? ' selected' : ''}" data-cat="${escapeHtml(item.category || 'common')}" aria-pressed="${isSelected}">
           <span class="preview-native" dir="${meta.direction}">${escapeHtml(native)}</span>
           <span class="preview-trans">${escapeHtml(trans)}</span>
           ${note}
         </button>`
      );
      cell.addEventListener('click', () => {
        selectedNative = isSelected ? null : item.native;
        paint();
      });
      grid.appendChild(cell);
      if (isSelected) {
        grid.appendChild(buildInlay(item, tField));
      }
    }

    if (!filtered.length) {
      grid.appendChild(el(`<div class="muted small">${escapeHtml(t('preview.empty'))}</div>`));
    }
    meter.textContent = t('preview.count', { shown: filtered.length, total: items.length });
  }

  function buildInlay(item, tField) {
    const words = findWordsForSyllable(item, pool);
    const phraseMatches = findPhrasesForSyllable(item, phrases);
    const heading = t('preview.syllable.examples', { syllable: item.native });
    const inlay = el(
      `<div class="letter-inlay" role="region" aria-label="${escapeHtml(heading)}">
         <div class="letter-inlay-head">
           <span class="letter-inlay-title">${escapeHtml(heading)}</span>
         </div>
       </div>`
    );

    inlay.appendChild(el(
      `<div class="letter-inlay-subtitle">${escapeHtml(t('preview.syllable.words', { syllable: item.native, count: words.length }))}</div>`
    ));
    if (!words.length) {
      inlay.appendChild(el(`<div class="muted small">${escapeHtml(t('preview.syllable.no_words'))}</div>`));
    } else {
      const list = el(`<div class="detail-words"></div>`);
      for (const w of words) {
        const native = (useVoweled && w.nativeVoweled) || w.native;
        const trans = w[tField] || w.ipa || w.latin || '';
        const meaning = localized(w.meaning);
        list.appendChild(el(
          `<div class="detail-word" data-src="${w.source || 'curated'}">
             <span class="detail-word-native" dir="${meta.direction}">${escapeHtml(native)}</span>
             <span class="detail-word-trans">${escapeHtml(trans)}</span>
             ${meaning ? `<span class="detail-word-meaning muted">${escapeHtml(meaning)}</span>` : ''}
           </div>`
        ));
      }
      inlay.appendChild(list);
    }

    inlay.appendChild(el(
      `<div class="letter-inlay-subtitle">${escapeHtml(t('preview.syllable.phrases', { syllable: item.native, count: phraseMatches.length }))}</div>`
    ));
    if (!phraseMatches.length) {
      inlay.appendChild(el(`<div class="muted small">${escapeHtml(t('preview.syllable.no_phrases'))}</div>`));
      return inlay;
    }

    const phraseList = el(`<div class="detail-phrases"></div>`);
    const lang = currentLang();
    for (const p of phraseMatches) {
      const trans = p[tField] || p.latin || p.ipa || '';
      const translation = (p.translations && (p.translations[lang] || p.translations.en)) || '';
      phraseList.appendChild(el(
        `<div class="detail-phrase">
           <span class="detail-phrase-native" dir="${meta.direction}">${escapeHtml(p.native)}</span>
           ${trans ? `<span class="detail-phrase-trans muted">${escapeHtml(trans)}</span>` : ''}
           ${translation ? `<span class="detail-phrase-translation">${escapeHtml(translation)}</span>` : ''}
         </div>`
      ));
    }
    inlay.appendChild(phraseList);
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
