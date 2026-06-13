import { getScript } from '../data.js';
import { getSettings, updateSettings, recordLetter } from '../storage.js';
import { el, escapeHtml, shuffle, fieldFor, transcriptionLabel, nextTranscription } from '../ui/dom.js';

export async function renderFlashcards(_, mount) {
  let settings = getSettings();
  const script = await getScript(settings.activeScript);

  let deck = shuffle(script.letters);
  let idx = 0;
  let flipped = false;

  const root = el(`
    <section class="flashcards">
      <header class="mode-header">
        <a href="#/home" class="back">← Home</a>
        <h2>${escapeHtml(script.meta.name)} flashcards</h2>
        <button class="transcription-toggle" id="transcription-toggle" title="Click to cycle transcription system"></button>
      </header>

      <div class="card-stack">
        <button class="flashcard" id="card" dir="${script.meta.direction}">
          <div class="face front"></div>
          <div class="face back"></div>
        </button>
      </div>

      <div class="card-actions">
        <button class="btn-secondary" id="again">↻ Again</button>
        <button class="btn" id="known">✓ I knew it</button>
      </div>

      <div class="card-nav">
        <button class="btn-link" id="prev">← Previous</button>
        <span class="muted small" id="counter"></span>
        <button class="btn-link" id="next">Next →</button>
      </div>

      <div class="card-shuffle">
        <button class="btn-link" id="shuffle">Shuffle deck</button>
      </div>
    </section>
  `);

  const cardEl = root.querySelector('#card');
  const frontEl = root.querySelector('.face.front');
  const backEl = root.querySelector('.face.back');
  const counterEl = root.querySelector('#counter');
  const transToggle = root.querySelector('#transcription-toggle');

  function renderTranscriptionLabel() {
    transToggle.innerHTML = `${escapeHtml(transcriptionLabel(settings.transcription))} <span class="muted small">(click to change)</span>`;
  }

  function render() {
    const letter = deck[idx];
    const field = fieldFor(settings.transcription);
    cardEl.classList.toggle('flipped', flipped);
    frontEl.innerHTML = `<div class="glyph">${escapeHtml(letter.glyph)}</div>`;
    const transcription = letter[field] ?? letter.ipa;
    const ex = letter.example || {};
    backEl.innerHTML = `
      <div class="transcription">${escapeHtml(transcription)}</div>
      ${letter.note ? `<div class="note">${escapeHtml(letter.note)}</div>` : ''}
      ${ex.native ? `
        <div class="example">
          <span class="example-native" dir="${script.meta.direction}">${escapeHtml(ex.native)}</span>
          <span class="example-transcription">${escapeHtml(ex[field] ?? ex.ipa ?? '')}</span>
          <span class="example-meaning">— ${escapeHtml(ex.meaning || '')}</span>
        </div>` : ''}
    `;
    counterEl.textContent = `${idx + 1} / ${deck.length}`;
    renderTranscriptionLabel();
  }

  transToggle.addEventListener('click', e => {
    e.stopPropagation();
    settings = updateSettings({ transcription: nextTranscription(settings.transcription) });
    render();
  });

  cardEl.addEventListener('click', () => {
    flipped = !flipped;
    if (flipped) recordLetter(script.meta.id, deck[idx].glyph, {});
    render();
  });

  root.querySelector('#again').addEventListener('click', e => {
    e.stopPropagation();
    recordLetter(script.meta.id, deck[idx].glyph, { known: false });
    advance();
  });
  root.querySelector('#known').addEventListener('click', e => {
    e.stopPropagation();
    recordLetter(script.meta.id, deck[idx].glyph, { known: true });
    advance();
  });
  root.querySelector('#prev').addEventListener('click', e => {
    e.stopPropagation();
    idx = (idx - 1 + deck.length) % deck.length;
    flipped = false;
    render();
  });
  root.querySelector('#next').addEventListener('click', e => {
    e.stopPropagation();
    advance();
  });
  root.querySelector('#shuffle').addEventListener('click', e => {
    e.stopPropagation();
    deck = shuffle(script.letters);
    idx = 0;
    flipped = false;
    render();
  });

  function advance() {
    idx = (idx + 1) % deck.length;
    flipped = false;
    render();
  }

  render();
  mount.appendChild(root);
}
