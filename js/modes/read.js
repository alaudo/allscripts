import { getScript, getWordPool } from '../data.js';
import { getSettings, recordWord } from '../storage.js';
import { el, escapeHtml, pickRandom, looseEqual, inputFieldFor } from '../ui/dom.js';

export async function renderRead(_, mount) {
  const settings = getSettings();
  const script = await getScript(settings.activeScript);
  const pool = await getWordPool(script.meta.id);
  const field = inputFieldFor(settings.inputSystem);

  let current = pickRandom(pool);
  let revealed = false;

  const root = el(`
    <section class="read">
      <header class="mode-header">
        <a href="#/home" class="back">← Home</a>
        <h2>Read &amp; transcribe — ${escapeHtml(script.meta.name)}</h2>
        <span class="muted small">Input: ${escapeHtml(settings.inputSystem)}</span>
      </header>

      <div class="card prompt-card">
        <div class="prompt" dir="${script.meta.direction}" id="prompt"></div>
        <form id="form" class="answer-form">
          <input type="text" id="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the ${escapeHtml(settings.inputSystem)} transcription..." />
          <button type="submit" class="btn">Check</button>
        </form>
        <div class="result" id="result" aria-live="polite"></div>
      </div>

      <div class="next-row">
        <button class="btn-secondary" id="skip">Skip / Next →</button>
      </div>
    </section>
  `);

  const promptEl = root.querySelector('#prompt');
  const inputEl = root.querySelector('#answer');
  const resultEl = root.querySelector('#result');
  const form = root.querySelector('#form');
  const skipBtn = root.querySelector('#skip');

  function showWord() {
    revealed = false;
    promptEl.textContent = current.native;
    inputEl.value = '';
    inputEl.disabled = false;
    resultEl.innerHTML = '';
    inputEl.focus();
  }

  function reveal(correct) {
    revealed = true;
    inputEl.disabled = true;
    recordWord(script.meta.id, current.native, { correct });

    const expected = current[field];
    const ipa = current.ipa ? `<div class="ipa">/${escapeHtml(current.ipa)}/</div>` : '';
    const note = current.note ? `<div class="note">📝 ${escapeHtml(current.note)}</div>` : '';

    resultEl.innerHTML = `
      <div class="verdict ${correct ? 'good' : 'bad'}">${correct ? '✓ Correct' : '✗ Not quite'}</div>
      <div class="answer-row">
        <span class="muted">Answer:</span>
        <strong class="answer-text">${escapeHtml(expected ?? '—')}</strong>
      </div>
      <div class="meaning">${escapeHtml(current.meaning || '')}</div>
      ${ipa}
      ${note}
    `;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (revealed) { next(); return; }
    const guess = inputEl.value;
    const expected = current[field];
    reveal(looseEqual(guess, expected));
  });

  skipBtn.addEventListener('click', () => {
    if (!revealed) reveal(false);
    else next();
  });

  function next() {
    if (pool.length > 1) {
      let pick;
      do { pick = pickRandom(pool); } while (pick.native === current.native);
      current = pick;
    } else {
      current = pickRandom(pool);
    }
    showWord();
  }

  showWord();
  mount.appendChild(root);
}
