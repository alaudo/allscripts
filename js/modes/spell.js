import { getScript, getWordPool } from '../data.js';
import { getSettings, updateSettings, recordWord } from '../storage.js';
import { el, escapeHtml, pickRandom, looseEqual, fuzzyEqual, inputFieldFor, nextInputSystem, shouldSuppressMobileKeyboard, focusIfKeyboardAllowed } from '../ui/dom.js';
import { renderKeyboard } from '../ui/keyboard.js';
import { hasClassicKeyboard, keyboardRowsFor, nextKeyboardLayout } from '../ui/script-keyboards.js';
import { t, inputSystemLabel, keyboardLayoutLabel, localized } from '../i18n.js';

export async function renderSpell(_, mount) {
  const settings = getSettings();
  const script = await getScript(settings.activeScript);
  const pool = await getWordPool(script.meta.id);
  const promptField = inputFieldFor(settings.inputSystem);
  const scriptName = localized(script.meta.name);
  let suppressNativeKeyboard = shouldSuppressMobileKeyboard(settings);
  let keyboardLayout = settings.scriptKeyboardLayout || 'alphabetic';

  let current = pickRandom(pool);
  let revealed = false;

  const headerExtras =
    (settings.vocalised ? t('read.vocalised_target') : '') +
    (settings.fuzzy ? t('read.fuzzy_modifier') : '');

  const root = el(`
    <section class="spell">
      <header class="mode-header">
        <a href="#/home" class="back">${escapeHtml(t('nav.back_home'))}</a>
        <h2>${escapeHtml(t('spell.header', { name: scriptName }))}</h2>
        <button class="input-system-toggle clickable" id="input-system-toggle" title="${escapeHtml(t('input.prompt_cycle_tooltip'))}">${escapeHtml(inputSystemLabel(settings.inputSystem))}${escapeHtml(headerExtras)}</button>
      </header>

      <div class="card prompt-card">
        <div class="prompt small-prompt" id="prompt"></div>
        <div class="meaning-hint" id="meaning"></div>
        <form id="form" class="answer-form">
          <input type="text" id="answer" autocomplete="off" autocapitalize="off" spellcheck="false" dir="${script.meta.direction}" placeholder="${escapeHtml(t('spell.placeholder', { name: scriptName }))}" />
          <button type="submit" class="btn">${escapeHtml(t('read.check'))}</button>
        </form>
        <div class="result" id="result" aria-live="polite"></div>
        <label class="switch-field task-switch">
          <input type="checkbox" id="suppress-mobile-keyboard" ${settings.suppressKeyboardOnMobile ? 'checked' : ''} />
          <span class="switch-track" aria-hidden="true"></span>
          <span class="switch-copy">
            <span class="field-label">${escapeHtml(t('task.suppress_mobile_keyboard'))}</span>
            <small class="muted" id="mobile-keyboard-hint">${escapeHtml(t('task.suppress_mobile_keyboard.hint'))}</small>
          </span>
        </label>
      </div>

      <div class="card">
        <div class="keyboard-card-header">
          <h3 class="kb-title">${escapeHtml(t('spell.keyboard', { name: scriptName }))}</h3>
          <button type="button" class="keyboard-layout-toggle clickable" id="keyboard-layout-toggle" title="${escapeHtml(t('keyboard.layout.tooltip'))}">${escapeHtml(keyboardLayoutLabel(keyboardLayout))}</button>
        </div>
        <div id="keyboard"></div>
        <p class="muted small">${escapeHtml(t('spell.kbd_hint', { name: scriptName }))}</p>
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
  const suppressKeyboardToggle = root.querySelector('#suppress-mobile-keyboard');
  const keyboardLayoutToggle = root.querySelector('#keyboard-layout-toggle');

  inputSystemToggle.addEventListener('click', e => {
    e.stopPropagation();
    updateSettings({ inputSystem: nextInputSystem(settings.inputSystem) });
    mount.innerHTML = '';
    renderSpell(_, mount);
  });

  if (!hasClassicKeyboard(script.meta.id)) keyboardLayoutToggle.hidden = true;

  keyboardLayoutToggle.addEventListener('click', e => {
    e.stopPropagation();
    keyboardLayout = nextKeyboardLayout(keyboardLayout);
    updateSettings({ scriptKeyboardLayout: keyboardLayout });
    keyboardLayoutToggle.textContent = keyboardLayoutLabel(keyboardLayout);
    renderCurrentKeyboard();
  });

  function renderCurrentKeyboard() {
    renderKeyboard(kbEl, keyboardRowsFor(script, keyboardLayout), {
      onInput: ch => {
        const start = inputEl.selectionStart ?? inputEl.value.length;
        const end = inputEl.selectionEnd ?? inputEl.value.length;
        inputEl.value = inputEl.value.slice(0, start) + ch + inputEl.value.slice(end);
        const pos = start + ch.length;
        inputEl.setSelectionRange(pos, pos);
        focusIfKeyboardAllowed(inputEl, suppressNativeKeyboard);
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
        focusIfKeyboardAllowed(inputEl, suppressNativeKeyboard);
      },
      onSubmit: () => form.requestSubmit()
    }, { direction: script.meta.direction });
  }

  suppressKeyboardToggle.addEventListener('change', e => {
    updateSettings({ suppressKeyboardOnMobile: e.target.checked });
    suppressNativeKeyboard = shouldSuppressMobileKeyboard(getSettings());
    applyMobileKeyboardMode();
  });

  function applyMobileKeyboardMode() {
    inputEl.readOnly = suppressNativeKeyboard;
    if (suppressNativeKeyboard) {
      inputEl.setAttribute('inputmode', 'none');
      inputEl.setAttribute('aria-describedby', 'mobile-keyboard-hint');
    } else {
      inputEl.removeAttribute('inputmode');
      inputEl.removeAttribute('aria-describedby');
    }
    root.classList.toggle('mobile-keyboard-suppressed', suppressNativeKeyboard);
  }

  function showWord() {
    revealed = false;
    const transcription = current[promptField] ?? current.latin ?? current.ipa ?? '';
    promptEl.textContent = transcription;
    const meaningText = localized(current.meaning);
    meaningEl.textContent = meaningText ? t('spell.meaning', { meaning: meaningText }) : '';
    inputEl.value = '';
    inputEl.disabled = false;
    inputEl.readOnly = suppressNativeKeyboard;
    resultEl.innerHTML = '';
    focusIfKeyboardAllowed(inputEl, suppressNativeKeyboard);
  }

  function reveal(correct) {
    revealed = true;
    inputEl.disabled = true;
    recordWord(script.meta.id, current.native, { correct });
    const noteText = localized(current.note);
    const note = noteText ? `<div class="note">📝 ${escapeHtml(noteText)}</div>` : '';
    const answerNative = settings.vocalised && current.nativeVoweled ? current.nativeVoweled : current.native;
    const voweledHint = !settings.vocalised && current.nativeVoweled
      ? `<div class="muted small">${escapeHtml(t('read.vocalised_label'))} <span dir="${script.meta.direction}">${escapeHtml(current.nativeVoweled)}</span></div>` : '';
    resultEl.innerHTML = `
      <div class="verdict ${correct ? 'good' : 'bad'}">${correct ? escapeHtml(t('read.verdict_correct')) : escapeHtml(t('read.verdict_wrong'))}</div>
      <div class="answer-row">
        <span class="muted">${escapeHtml(t('read.answer'))}</span>
        <strong class="answer-text" dir="${script.meta.direction}">${escapeHtml(answerNative)}</strong>
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

  renderCurrentKeyboard();
  applyMobileKeyboardMode();
  showWord();
  mount.appendChild(root);
}
