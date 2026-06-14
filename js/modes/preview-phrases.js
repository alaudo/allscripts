// Preview phrases — every phrase from the active script on one page, with the
// translation visible alongside the native form and a transcription line
// (IPA / Latin / Cyrillic) underneath. The header's transcription toggle
// cycles which transcription is shown, mirroring the words preview.

import { getManifest, getPhrases } from '../data.js';
import { getSettings, updateSettings } from '../storage.js';
import { el, escapeHtml, fieldFor, nextTranscription } from '../ui/dom.js';
import { t, currentLang, transcriptionLabel, localized } from '../i18n.js';

export async function renderPreviewPhrases(_route, mount) {
  const settings = getSettings();
  const scriptId = settings.activeScript;
  const [manifest, phrases] = await Promise.all([getManifest(), getPhrases(scriptId)]);
  const meta = manifest.scripts.find(s => s.id === scriptId);
  let transcription = settings.transcription;

  mount.innerHTML = '';
  const root = el(`<section class="preview-phrases"></section>`);

  const header = el(
    `<header class="mode-header">
       <a href="#/home" class="back">${escapeHtml(t('nav.back_home'))}</a>
       <h2>${escapeHtml(t('preview.phrases.header', { name: localized(meta.name) }))}</h2>
       <button type="button" class="transcription-toggle clickable" id="trans-toggle" title="${escapeHtml(t('transcription.cycle_tooltip'))}">${escapeHtml(transcriptionLabel(transcription))}</button>
     </header>`
  );
  root.appendChild(header);

  if (!phrases.length) {
    root.appendChild(el(`<div class="card"><p class="muted">${escapeHtml(t('phrases.none'))}</p></div>`));
    mount.appendChild(root);
    return;
  }

  const meter = el(`<div class="filter-meter muted small">${escapeHtml(t('preview.count', { shown: phrases.length, total: phrases.length }))}</div>`);
  root.appendChild(meter);

  const list = el(`<div class="preview-phrases-list"></div>`);
  root.appendChild(list);
  mount.appendChild(root);

  function paint() {
    const tField = fieldFor(transcription);
    const lang = currentLang();
    list.innerHTML = '';
    for (const p of phrases) {
      const tr = (p.translations && (p.translations[lang] || p.translations.en)) || '';
      const trans = p[tField] || p.latin || p.ipa || '';
      const transLine = trans
        ? `<div class="phrase-row-latin muted small">${escapeHtml(trans)}</div>` : '';
      const item = el(
        `<div class="phrase-row">
           <div class="phrase-row-native" dir="${meta.direction}">${escapeHtml(p.native)}</div>
           ${transLine}
           <div class="phrase-row-translation">${escapeHtml(tr)}</div>
         </div>`
      );
      list.appendChild(item);
    }
  }

  header.querySelector('#trans-toggle').addEventListener('click', () => {
    transcription = nextTranscription(transcription);
    updateSettings({ transcription });
    header.querySelector('#trans-toggle').textContent = transcriptionLabel(transcription);
    paint();
  });

  paint();
}
