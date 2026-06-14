// Multiple-choice drill — shared across three item types (letters, words,
// phrases). The active item is shown as a "prompt" and the user picks the
// matching "answer" out of 4–8 options. Two directions are supported and
// toggleable per session:
//   - "recognize" (native → meaning): the native script is the prompt,
//     options are transcriptions / meanings / translations.
//   - "recall"    (meaning → native): the transcription / meaning /
//     translation is the prompt, options are the native forms.
//
// All three drills share the same UI and recording machinery; they differ
// only in how an item is loaded and which fields are used for prompt + answer.
// Each drill records correct/wrong outcomes against the existing per-script
// progress buckets (recordLetter / recordWord / recordPhrase) so progress is
// shared with the other modes.

import { getScript, getWordPool, getPhrases } from '../data.js';
import {
  getSettings,
  updateSettings,
  recordLetter,
  recordWord,
  recordPhrase
} from '../storage.js';
import { el, escapeHtml, shuffle, pickRandom, fieldFor } from '../ui/dom.js';
import { t, currentLang, localized } from '../i18n.js';

const COUNT_CYCLE = [4, 6, 8];
const DIRECTIONS = ['recognize', 'recall'];

// ---- Public entrypoints -----------------------------------------------------

export function renderChooseLetters(_route, mount) {
  return renderChoose(mount, lettersDrill);
}

export function renderChooseWords(_route, mount) {
  return renderChoose(mount, wordsDrill);
}

export function renderChoosePhrases(_route, mount) {
  return renderChoose(mount, phrasesDrill);
}

// ---- Drill descriptors ------------------------------------------------------
// Each descriptor knows how to:
//   - load(scriptId)              -> { script, items, emptyHintKey, headerKey }
//   - keyOf(item)                 -> stable key for progress
//   - record(scriptId, item, ok)  -> persist outcome
//   - prompt(item, ctx)           -> { text, dir }
//   - answer(item, ctx)           -> { text, dir }
//   - extras(item, ctx)?          -> { hint?: string } shown after reveal

const lettersDrill = {
  id: 'letters',
  headerKey: 'choose.letters.header',
  emptyKey: 'choose.letters.empty',
  blurbKey: 'mode.choose-letters.title',
  async load(scriptId) {
    const script = await getScript(scriptId);
    return { script, items: script.letters };
  },
  keyOf(letter) { return letter.glyph; },
  record(scriptId, letter, ok) {
    recordLetter(scriptId, letter.glyph, { known: ok });
  },
  // The "answer" is the active transcription of the letter.
  prompt(letter, { script, transcription, direction }) {
    if (direction === 'recognize') {
      return { text: letter.glyph, dir: script.meta.direction, big: true };
    }
    return { text: transcriptionOf(letter, transcription), dir: 'ltr' };
  },
  answer(letter, { script, transcription, direction }) {
    if (direction === 'recognize') {
      return { text: transcriptionOf(letter, transcription), dir: 'ltr' };
    }
    return { text: letter.glyph, dir: script.meta.direction, big: true };
  },
  // For the option grid, render either glyphs or transcriptions.
  optionText(letter, { transcription, direction }) {
    return direction === 'recognize'
      ? transcriptionOf(letter, transcription)
      : letter.glyph;
  },
  optionDir(_letter, { script, direction }) {
    return direction === 'recognize' ? 'ltr' : script.meta.direction;
  },
  // Hint shown beneath the revealed answer (the example word + meaning).
  extras(letter) {
    const ex = letter.example || {};
    const m = localized(ex.meaning);
    if (!ex.native && !m) return null;
    const native = ex.native ? `<strong>${escapeHtml(ex.native)}</strong>` : '';
    const meaning = m ? `<span class="muted"> — ${escapeHtml(m)}</span>` : '';
    return { html: `${native}${meaning}` };
  }
};

const wordsDrill = {
  id: 'words',
  headerKey: 'choose.words.header',
  emptyKey: 'choose.words.empty',
  blurbKey: 'mode.choose-words.title',
  async load(scriptId) {
    const script = await getScript(scriptId);
    const items = await getWordPool(scriptId);
    return { script, items };
  },
  keyOf(word) { return word.native; },
  record(scriptId, word, ok) {
    recordWord(scriptId, word.native, { correct: ok });
  },
  prompt(word, { script, direction }) {
    if (direction === 'recognize') {
      return { text: word.native, dir: script.meta.direction, big: true };
    }
    return { text: localized(word.meaning) || word.native, dir: 'ltr' };
  },
  answer(word, { script, direction }) {
    if (direction === 'recognize') {
      return { text: localized(word.meaning) || '—', dir: 'ltr' };
    }
    return { text: word.native, dir: script.meta.direction, big: true };
  },
  optionText(word, { direction }) {
    return direction === 'recognize' ? localized(word.meaning) || word.native : word.native;
  },
  optionDir(_word, { script, direction }) {
    return direction === 'recognize' ? 'ltr' : script.meta.direction;
  },
  // Show the transcription + IPA after the reveal so the learner gets full
  // context for the word they just picked.
  extras(word, { transcription }) {
    const trans = transcriptionOf(word, transcription);
    if (!trans && !word.ipa) return null;
    const parts = [];
    if (trans) parts.push(`<span>${escapeHtml(trans)}</span>`);
    if (word.ipa && trans !== word.ipa) parts.push(`<span class="muted">/${escapeHtml(word.ipa)}/</span>`);
    return { html: parts.join(' ') };
  }
};

const phrasesDrill = {
  id: 'phrases',
  headerKey: 'choose.phrases.header',
  emptyKey: 'choose.phrases.empty',
  blurbKey: 'mode.choose-phrases.title',
  async load(scriptId) {
    const script = await getScript(scriptId);
    const items = await getPhrases(scriptId);
    return { script, items };
  },
  keyOf(phrase) { return phrase.native; },
  record(scriptId, phrase, ok) {
    recordPhrase(scriptId, phrase.native, { known: ok });
  },
  prompt(phrase, { script, direction }) {
    if (direction === 'recognize') {
      return { text: phrase.native, dir: script.meta.direction };
    }
    return { text: translationOf(phrase) || phrase.native, dir: 'ltr' };
  },
  answer(phrase, { script, direction }) {
    if (direction === 'recognize') {
      return { text: translationOf(phrase) || '—', dir: 'ltr' };
    }
    return { text: phrase.native, dir: script.meta.direction };
  },
  optionText(phrase, { direction }) {
    return direction === 'recognize' ? translationOf(phrase) || phrase.native : phrase.native;
  },
  optionDir(_phrase, { script, direction }) {
    return direction === 'recognize' ? 'ltr' : script.meta.direction;
  },
  extras(phrase, { transcription }) {
    const trans = transcriptionOf(phrase, transcription);
    if (!trans) return null;
    return { html: `<span class="muted">${escapeHtml(trans)}</span>` };
  }
};

// ---- Shared rendering -------------------------------------------------------

async function renderChoose(mount, drill) {
  let settings = getSettings();
  const { script, items } = await drill.load(settings.activeScript);
  const scriptName = localized(script.meta.name);

  if (!items || !items.length) {
    mount.innerHTML = '';
    mount.appendChild(el(`
      <section class="choose">
        <header class="mode-header">
          <a href="#/home" class="back">${escapeHtml(t('nav.back_home'))}</a>
          <h2>${escapeHtml(t(drill.headerKey, { name: scriptName }))}</h2>
        </header>
        <div class="card"><p class="muted">${escapeHtml(t(drill.emptyKey))}</p></div>
      </section>
    `));
    return;
  }

  // Direction + option count are session toggles, persisted in settings so
  // navigating away and back keeps the user's preferred mode.
  let direction = DIRECTIONS.includes(settings.chooseDirection) ? settings.chooseDirection : 'recognize';
  let optionCount = COUNT_CYCLE.includes(settings.chooseOptionCount)
    ? settings.chooseOptionCount
    : 4;

  let current = pickRandom(items);
  let revealed = false;

  mount.innerHTML = '';
  const root = el(`
    <section class="choose">
      <header class="mode-header">
        <a href="#/home" class="back">${escapeHtml(t('nav.back_home'))}</a>
        <h2>${escapeHtml(t(drill.headerKey, { name: scriptName }))}</h2>
        <button type="button" class="choose-toggle clickable" id="dir-toggle"></button>
        <button type="button" class="choose-toggle clickable" id="count-toggle"></button>
      </header>
      <div class="card prompt-card choose-card">
        <div class="prompt" id="prompt"></div>
        <div class="choose-options" id="options" role="group" aria-label="${escapeHtml(t('choose.options_aria'))}"></div>
        <div class="result" id="result" aria-live="polite"></div>
      </div>
      <div class="next-row">
        <button class="btn-secondary" id="skip">${escapeHtml(t('choose.skip'))}</button>
        <button class="btn" id="next" hidden>${escapeHtml(t('choose.next'))}</button>
      </div>
    </section>
  `);

  const promptEl = root.querySelector('#prompt');
  const optionsEl = root.querySelector('#options');
  const resultEl = root.querySelector('#result');
  const dirToggle = root.querySelector('#dir-toggle');
  const countToggle = root.querySelector('#count-toggle');
  const skipBtn = root.querySelector('#skip');
  const nextBtn = root.querySelector('#next');

  function ctx() {
    return { script, transcription: settings.transcription, direction };
  }

  function refreshToggles() {
    dirToggle.textContent = t('choose.direction.' + direction + '.label');
    dirToggle.title = t('choose.direction.tooltip');
    countToggle.textContent = t('choose.count.label', { n: optionCount });
    countToggle.title = t('choose.count.tooltip');
  }

  function renderPrompt() {
    const { text, dir, big } = drill.prompt(current, ctx());
    promptEl.textContent = text || '';
    promptEl.dir = dir || 'ltr';
    promptEl.classList.toggle('prompt--big', !!big);
  }

  function buildDistractors() {
    // Distractors are other items whose option-text is different from the
    // correct one (so we don't accidentally show two equally-correct cards).
    const correctText = drill.optionText(current, ctx());
    const pool = items.filter(it => drill.optionText(it, ctx()) !== correctText);
    return shuffle(pool).slice(0, Math.max(0, optionCount - 1));
  }

  function renderOptions() {
    optionsEl.innerHTML = '';
    const distractors = buildDistractors();
    const options = shuffle([current, ...distractors]);
    for (const item of options) {
      const txt = drill.optionText(item, ctx());
      const odir = drill.optionDir(item, ctx());
      const btn = el(
        `<button type="button" class="choose-option clickable" dir="${escapeHtml(odir || 'ltr')}">
           <span class="choose-option-text${direction === 'recall' ? ' choose-option-text--native' : ''}">${escapeHtml(txt)}</span>
         </button>`
      );
      btn.addEventListener('click', () => pickOption(item, btn));
      optionsEl.appendChild(btn);
    }
  }

  function pickOption(item, btn) {
    if (revealed) return;
    revealed = true;
    const ok = drill.keyOf(item) === drill.keyOf(current);
    drill.record(script.meta.id, current, ok);

    // Highlight all options: the correct one always greens, the user's pick
    // reds if it was wrong.
    for (const opt of optionsEl.children) {
      opt.disabled = true;
      const optText = opt.querySelector('.choose-option-text')?.textContent ?? '';
      const isCorrect = optText === drill.optionText(current, ctx());
      opt.classList.toggle('correct', isCorrect);
    }
    if (!ok) btn.classList.add('wrong');

    showResult(ok);
    skipBtn.hidden = true;
    nextBtn.hidden = false;
    nextBtn.focus({ preventScroll: true });
  }

  function showResult(ok) {
    const { text: answerText, dir: answerDir } = drill.answer(current, ctx());
    const verdictKey = ok ? 'choose.verdict_correct' : 'choose.verdict_wrong';
    const verdictCls = ok ? 'good' : 'bad';
    const extras = drill.extras ? drill.extras(current, ctx()) : null;
    const extrasHtml = extras?.html
      ? `<div class="choose-extras">${extras.html}</div>`
      : '';
    resultEl.innerHTML = `
      <div class="verdict ${verdictCls}">${escapeHtml(t(verdictKey))}</div>
      <div class="answer-row">
        <span class="muted">${escapeHtml(t('choose.answer_label'))}</span>
        <strong class="answer-text" dir="${escapeHtml(answerDir || 'ltr')}">${escapeHtml(answerText)}</strong>
      </div>
      ${extrasHtml}
    `;
  }

  function next() {
    revealed = false;
    resultEl.innerHTML = '';
    skipBtn.hidden = false;
    nextBtn.hidden = true;
    if (items.length > 1) {
      let pick;
      do { pick = pickRandom(items); } while (drill.keyOf(pick) === drill.keyOf(current));
      current = pick;
    }
    renderPrompt();
    renderOptions();
  }

  dirToggle.addEventListener('click', () => {
    direction = direction === 'recognize' ? 'recall' : 'recognize';
    settings = updateSettings({ chooseDirection: direction });
    refreshToggles();
    next();
  });
  countToggle.addEventListener('click', () => {
    const i = COUNT_CYCLE.indexOf(optionCount);
    optionCount = COUNT_CYCLE[(i + 1) % COUNT_CYCLE.length];
    settings = updateSettings({ chooseOptionCount: optionCount });
    refreshToggles();
    next();
  });
  skipBtn.addEventListener('click', () => {
    // Skipping counts as a "wrong" outcome — it still moves the item along
    // in the SRS queue without unfairly marking it known.
    if (!revealed) drill.record(script.meta.id, current, false);
    next();
  });
  nextBtn.addEventListener('click', next);

  refreshToggles();
  renderPrompt();
  renderOptions();
  mount.appendChild(root);
}

// ---- Helpers ----------------------------------------------------------------

function transcriptionOf(item, transcription) {
  const field = fieldFor(transcription);
  return item[field] || item.ipa || item.latin || '';
}

function translationOf(phrase) {
  const tr = phrase.translations || {};
  return tr[currentLang()] || tr.en || '';
}
