// Preview phrases — every phrase from the active script on one page, with the
// translation visible alongside the native form and (when available) its
// romanisation. Not an exercise: no flipping, no scoring, no progress.

import { getManifest, getPhrases } from '../data.js';
import { getSettings } from '../storage.js';
import { el, escapeHtml } from '../ui/dom.js';
import { t, currentLang } from '../i18n.js';

export async function renderPreviewPhrases(_route, mount) {
  const settings = getSettings();
  const scriptId = settings.activeScript;
  const [manifest, phrases] = await Promise.all([getManifest(), getPhrases(scriptId)]);
  const meta = manifest.scripts.find(s => s.id === scriptId);

  mount.innerHTML = '';
  const root = el(`<section class="preview-phrases"></section>`);

  const header = el(
    `<header class="mode-header">
       <a href="#/home" class="back">${escapeHtml(t('nav.back_home'))}</a>
       <h2>${escapeHtml(t('preview.phrases.header', { name: meta.name }))}</h2>
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
  const lang = currentLang();
  for (const p of phrases) {
    const tr = (p.translations && (p.translations[lang] || p.translations.en)) || '';
    const latin = p.latin
      ? `<div class="phrase-row-latin muted small">${escapeHtml(p.latin)}</div>` : '';
    const item = el(
      `<div class="phrase-row">
         <div class="phrase-row-native" dir="${meta.direction}">${escapeHtml(p.native)}</div>
         ${latin}
         <div class="phrase-row-translation">${escapeHtml(tr)}</div>
       </div>`
    );
    list.appendChild(item);
  }
  root.appendChild(list);

  mount.appendChild(root);
}
