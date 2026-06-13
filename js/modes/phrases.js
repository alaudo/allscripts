import { getScript, getPhrases } from '../data.js';
import { el, escapeHtml, shuffle } from '../ui/dom.js';
import { t, currentLang } from '../i18n.js';

export async function renderPhrases(_, mount) {
  const { getSettings } = await import('../storage.js');
  const settings = getSettings();
  const script = await getScript(settings.activeScript);
  const phrases = shuffle(await getPhrases(script.meta.id));
  const total = phrases.length;
  let idx = 0;
  let flipped = false;

  if (!total) {
    mount.appendChild(el(`
      <section class="phrases">
        <header class="mode-header">
          <a href="#/home" class="back">${escapeHtml(t('nav.back_home'))}</a>
          <h2>${escapeHtml(t('phrases.header', { name: script.meta.name }))}</h2>
        </header>
        <div class="card"><p class="muted">${escapeHtml(t('phrases.none'))}</p></div>
      </section>
    `));
    return;
  }

  const root = el(`
    <section class="phrases">
      <header class="mode-header">
        <a href="#/home" class="back">${escapeHtml(t('nav.back_home'))}</a>
        <h2>${escapeHtml(t('phrases.header', { name: script.meta.name }))}</h2>
      </header>

      <div class="card-stack">
        <button class="flashcard phrase-card" id="card" dir="${script.meta.direction}">
          <div class="face front"></div>
          <div class="face back"></div>
        </button>
      </div>

      <div class="card-nav">
        <button class="btn-link" id="prev">${escapeHtml(t('phrases.previous'))}</button>
        <span class="muted small" id="counter"></span>
        <button class="btn-link" id="next">${escapeHtml(t('phrases.next'))}</button>
      </div>

      <div class="card-shuffle">
        <button class="btn-link" id="shuffle">${escapeHtml(t('phrases.shuffle'))}</button>
      </div>
    </section>
  `);

  const cardEl = root.querySelector('#card');
  const frontEl = root.querySelector('.face.front');
  const backEl = root.querySelector('.face.back');
  const counterEl = root.querySelector('#counter');

  function render() {
    const p = phrases[idx];
    cardEl.classList.toggle('flipped', flipped);
    const tr = (p.translations && (p.translations[currentLang()] || p.translations.en)) || '';
    frontEl.innerHTML = `
      <div class="phrase-native" dir="${script.meta.direction}">${escapeHtml(p.native)}</div>
      ${p.latin ? `<div class="phrase-latin muted small">${escapeHtml(p.latin)}</div>` : ''}
      <div class="phrase-hint muted small">${escapeHtml(t('phrases.tap_to_reveal'))}</div>
    `;
    backEl.innerHTML = `
      <div class="phrase-translation">${escapeHtml(tr)}</div>
      <div class="phrase-native back-native" dir="${script.meta.direction}">${escapeHtml(p.native)}</div>
      ${p.latin ? `<div class="phrase-latin muted small">${escapeHtml(p.latin)}</div>` : ''}
      <div class="phrase-hint muted small">${escapeHtml(t('phrases.tap_to_flip_back'))}</div>
    `;
    counterEl.textContent = t('phrases.counter', { idx: idx + 1, total });
  }

  cardEl.addEventListener('click', () => {
    flipped = !flipped;
    render();
  });

  root.querySelector('#prev').addEventListener('click', e => {
    e.stopPropagation();
    idx = (idx - 1 + total) % total;
    flipped = false;
    render();
  });
  root.querySelector('#next').addEventListener('click', e => {
    e.stopPropagation();
    idx = (idx + 1) % total;
    flipped = false;
    render();
  });
  root.querySelector('#shuffle').addEventListener('click', e => {
    e.stopPropagation();
    phrases.sort(() => Math.random() - 0.5);
    idx = 0;
    flipped = false;
    render();
  });

  render();
  mount.appendChild(root);
}
