import { getScript, getWordPool } from '../data.js';
import { getSettings, updateSettings, recordWord } from '../storage.js';
import { el, escapeHtml, pickRandom, looseEqual, fuzzyEqual, inputFieldFor, nextInputSystem } from '../ui/dom.js';
import { renderKeyboard } from '../ui/keyboard.js';
import { t, inputSystemLabel, localized } from '../i18n.js';

export async function renderSpell(_, mount) {
  const settings = getSettings();
  const script = await getScript(settings.activeScript);
  const pool = await getWordPool(script.meta.id);
  const promptField = inputFieldFor(settings.inputSystem);

  let current = pickRandom(pool);
  let revealed = false;

  const headerExtras =
    (settings.vocalised ? t('read.vocalised_target') : '') +
    (settings.fuzzy ? t('read.fuzzy_modifier') : '');

  const root = el(`
    <section class="spell">
      <header class="mode-header">
        <a href="#/home" class="back">${escapeHtml(t('nav.back_home'))}</a>
        <h2>${escapeHtml(t('spell.header', { name: script.meta.name }))}</h2>
        <button class="input-system-toggle clickable" id="input-system-toggle" title="${escapeHtml(t('input.prompt_cycle_tooltip'))}">${escapeHtml(inputSystemLabel(settings.inputSystem))}${escapeHtml(headerExtras)}</button>
      </header>

      <div class="card prompt-card">
        <div class="prompt small-prompt" id="prompt"></div>
        <div class="meaning-hint" id="meaning"></div>
        <form id="form" class="answer-form">
          <input type="text" id="answer" autocomplete="off" autocapitalize="off" spellcheck="false" dir="${script.meta.direction}" placeholder="${escapeHtml(t('spell.placeholder', { name: script.meta.name }))}" />
          <button type="submit" class="btn">${escapeHtml(t('read.check'))}</button>
        </form>
        <div class="result" id="result" aria-live="polite"></div>
      </div>

      <div class="card">
        <h3 class="kb-title">${escapeHtml(t('spell.keyboard', { name: script.meta.name }))}</h3>
        <div id="keyboard"></div>
        <p class="muted small">${escapeHtml(t('spell.kbd_hint', { name: script.meta.name }))}</p>
      </div>

      <div class="next-row">
        <button class="btn-secondary" id="skip">${escapeHtml(t('read.skip'))}</button>
      </div>
    </section>
  `);

  const promptEl = root.querySelector('#prompt');
  const meaningEl = root.querySelector('#meaning');
  const inputEl = root.querySelector('#answer');
  const resultEl = root.querySelector('#result');
  const form = root.querySelector('#form');
  const skipBtn = root.querySelector('#skip');
  const kbEl = root.querySelector('#keyboard');
  const inputSystemToggle = root.querySelector('#input-system-toggle');

  inputSystemToggle.addEventListener('click', e => {
    e.stopPropagation();
    updateSettings({ inputSystem: nextInputSystem(settings.inputSystem) });
    mount.innerHTML = '';
    renderSpell(_, mount);
  });

  const rows = script.keyboardRows && script.keyboardRows.length
    ? script.keyboardRows
    : [script.letters.map(l => (l.glyph || '').split(' ')[0])];

  renderKeyboard(kbEl, rows, {
    onInput: ch => {
      const start = inputEl.selectionStart ?? inputEl.value.length;
      const end = inputEl.selectionEnd ?? inputEl.value.length;
      inputEl.value = inputEl.value.slice(0, start) + ch + inputEl.value.slice(end);
      const pos = start + ch.length;
      inputEl.setSelectionRange(pos, pos);
      inputEl.focus({ preventScroll: true });
    },
    onBackspace: () => {
      const start = inputEl.selectionStart ?? inputEl.value.length;
      const end = inputEl.selectionEnd ?? inputEl.value.length;
      if (start === end && start > 0) {
        inputEl.value = inputEl.value.slice(0, start - 1) + inputEl.value.slice(end);
        inputEl.setSelectionRange(start - 1, start - 1);
      } else {
        inputEl.value = inputEl.value.slice(0, start) + inputEl.value.slice(end);
        inputEl.setSelectionRange(start, start);
      }
      inputEl.focus({ preventScroll: true });
    },
    onSubmit: () => form.requestSubmit()
  }, { direction: script.meta.direction });

  function showWord() {
    revealed = false;
    const transcription = current[promptField] ?? current.latin ?? current.ipa ?? '';
    promptEl.textContent = transcription;
    meaningEl.textContent = current.meaning ? t('spell.meaning', { meaning: current.meaning }) : '';
    inputEl.value = '';
    inputEl.disabled = false;
    resultEl.innerHTML = '';
    inputEl.focus({ preventScroll: true });
  }

  function reveal(correct) {
    revealed = true;
    inputEl.disabled = true;
    recordWord(script.meta.id, current.native, { correct });
    const noteText = localized(current.note);
    const note = noteText ? `<div class="note">📝 ${escapeHtml(noteText)}</div>` : '';
    const voweledHint = current.nativeVoweled
      ? `<div class="muted small">${escapeHtml(t('read.vocalised_label'))} <span dir="${script.meta.direction}">${escapeHtml(current.nativeVoweled)}</span></div>` : '';
    resultEl.innerHTML = `
      <div class="verdict ${correct ? 'good' : 'bad'}">${correct ? escapeHtml(t('read.verdict_correct')) : escapeHtml(t('read.verdict_wrong'))}</div>
      <div class="answer-row">
        <span class="muted">${escapeHtml(t('read.answer'))}</span>
        <strong class="answer-text" dir="${script.meta.direction}">${escapeHtml(current.native)}</strong>
      </div>
      ${voweledHint}
      ${current.ipa ? `<div class="ipa">/${escapeHtml(current.ipa)}/</div>` : ''}
      ${note}
    `;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (revealed) { next(); return; }
    const guess = inputEl.value.trim();
    const baseTarget = (current.native || '').trim();
    const voweledTarget = (current.nativeVoweled || '').trim();
    let ok;
    if (settings.vocalised && voweledTarget) {
      ok = guess === voweledTarget;
    } else {
      ok = guess === baseTarget
        || (voweledTarget && guess === voweledTarget)
        || looseEqual(guess, baseTarget)
        || (settings.fuzzy && fuzzyEqual(guess, baseTarget));
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

  const hint = el(`<p class="muted small prompt-hint">${escapeHtml(inputSystemLabel(settings.inputSystem))}</p>`);
  promptEl.after(hint);

  showWord();
  mount.appendChild(root);
}
