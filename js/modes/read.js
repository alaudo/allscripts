import { getScript, getWordPool } from '../data.js';
import { getSettings, updateSettings, recordWord } from '../storage.js';
import { el, escapeHtml, pickRandom, looseEqual, fuzzyEqual, inputFieldFor, inputSystemLabel, nextInputSystem } from '../ui/dom.js';
import { renderKeyboard } from '../ui/keyboard.js';
import { IPA_ROWS } from '../ui/ipa-keyboard.js';

export async function renderRead(_, mount) {
  // Re-render the whole view when input system changes so the keyboard and
  // expected-field reset cleanly.
  let settings = getSettings();
  const script = await getScript(settings.activeScript);
  const pool = await getWordPool(script.meta.id);
  const field = inputFieldFor(settings.inputSystem);
  const useIpaKeyboard = settings.inputSystem === 'ipa';

  let current = pickRandom(pool);
  let revealed = false;

  const root = el(`
    <section class="read">
      <header class="mode-header">
        <a href="#/home" class="back">← Home</a>
        <h2>Read &amp; transcribe — ${escapeHtml(script.meta.name)}</h2>
        <button class="input-system-toggle clickable" id="input-system-toggle" title="Click to change input system (Latin → Cyrillic → IPA)">${escapeHtml(inputSystemLabel(settings.inputSystem))}${settings.vocalised ? ' · vocalised' : ''}${settings.fuzzy ? ' · fuzzy' : ''}</button>
      </header>

      <div class="card prompt-card">
        <div class="prompt" dir="${script.meta.direction}" id="prompt"></div>
        <form id="form" class="answer-form">
          <input type="text" id="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the ${escapeHtml(inputSystemLabel(settings.inputSystem))} transcription..." />
          <button type="submit" class="btn">Check</button>
        </form>
        <div class="result" id="result" aria-live="polite"></div>
      </div>

      ${useIpaKeyboard ? `
      <div class="card">
        <h3 class="kb-title">IPA keyboard</h3>
        <div id="keyboard"></div>
        <p class="muted small">Click symbols to insert them. Most cells are single characters; combining diacritics attach to the previous character.</p>
      </div>` : ''}

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
  const inputSystemToggle = root.querySelector('#input-system-toggle');

  inputSystemToggle.addEventListener('click', e => {
    e.stopPropagation();
    updateSettings({ inputSystem: nextInputSystem(settings.inputSystem) });
    mount.innerHTML = '';
    renderRead(_, mount);
  });

  if (useIpaKeyboard) {
    const kbEl = root.querySelector('#keyboard');
    renderKeyboard(kbEl, IPA_ROWS, {
      onInput: ch => insertAtCursor(inputEl, ch),
      onBackspace: () => backspaceAtCursor(inputEl),
      onSubmit: () => form.requestSubmit()
    });
  }

  function showWord() {
    revealed = false;
    promptEl.textContent = settings.vocalised && current.nativeVoweled ? current.nativeVoweled : current.native;
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
    const ipa = current.ipa && field !== 'ipa' ? `<div class="ipa">/${escapeHtml(current.ipa)}/</div>` : '';
    const note = current.note ? `<div class="note">📝 ${escapeHtml(current.note)}</div>` : '';
    const voweledHint = !settings.vocalised && current.nativeVoweled
      ? `<div class="muted small">vocalised: <span dir="${script.meta.direction}">${escapeHtml(current.nativeVoweled)}</span></div>` : '';

    resultEl.innerHTML = `
      <div class="verdict ${correct ? 'good' : 'bad'}">${correct ? '✓ Correct' : '✗ Not quite'}</div>
      <div class="answer-row">
        <span class="muted">Answer:</span>
        <strong class="answer-text">${escapeHtml(expected ?? '—')}</strong>
      </div>
      <div class="meaning">${escapeHtml(current.meaning || '')}</div>
      ${ipa}
      ${voweledHint}
      ${note}
    `;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (revealed) { next(); return; }
    const guess = inputEl.value;
    const expected = current[field] || '';
    let ok;
    if (field === 'ipa') {
      // For IPA, accept either exact match or loose-equal (strips stress / length marks).
      const a = stripIpaMarks(guess);
      const b = stripIpaMarks(expected);
      ok = guess.trim() === expected.trim()
        || looseEqual(a, b)
        || (settings.fuzzy && fuzzyEqual(a, b));
    } else {
      ok = looseEqual(guess, expected)
        || (settings.fuzzy && fuzzyEqual(guess, expected));
    }
    reveal(ok);
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

function insertAtCursor(inputEl, ch) {
  const start = inputEl.selectionStart ?? inputEl.value.length;
  const end = inputEl.selectionEnd ?? inputEl.value.length;
  inputEl.value = inputEl.value.slice(0, start) + ch + inputEl.value.slice(end);
  const pos = start + ch.length;
  inputEl.setSelectionRange(pos, pos);
  inputEl.focus();
}

function backspaceAtCursor(inputEl) {
  const start = inputEl.selectionStart ?? inputEl.value.length;
  const end = inputEl.selectionEnd ?? inputEl.value.length;
  if (start === end && start > 0) {
    inputEl.value = inputEl.value.slice(0, start - 1) + inputEl.value.slice(end);
    inputEl.setSelectionRange(start - 1, start - 1);
  } else {
    inputEl.value = inputEl.value.slice(0, start) + inputEl.value.slice(end);
    inputEl.setSelectionRange(start, start);
  }
  inputEl.focus();
}

function stripIpaMarks(s) {
  return String(s || '').replace(/[ˈˌː]/g, '').trim();
}
