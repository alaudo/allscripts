import { getScript } from '../data.js';
import { getSettings, updateSettings, recordLetter, getLetterProgress } from '../storage.js';
import { el, escapeHtml, shuffle, fieldFor, nextTranscription, formatMinutes } from '../ui/dom.js';
import { bindFlashcardKeys, flashcardShortcutHelpHtml } from '../ui/flashcard-keys.js';
import { countdownBadgeHtml, hideCountdownBadges, updateCountdownBadges } from '../ui/countdown.js';
import { t, transcriptionLabel, localized } from '../i18n.js';

function ratings() {
  return [
    { key: 'again', label: t('flashcards.again'), cls: 'rate rate-again', known: false },
    { key: 'hard',  label: t('flashcards.hard'),  cls: 'rate rate-hard',  known: false },
    { key: 'good',  label: t('flashcards.good'),  cls: 'rate rate-good',  known: true  },
    { key: 'easy',  label: t('flashcards.easy'),  cls: 'rate rate-easy',  known: true  }
  ];
}

export async function renderFlashcards(_, mount) {
  let settings = getSettings();
  const script = await getScript(settings.activeScript);

  let deck = buildDeck(script);
  let idx = 0;
  let flipped = false;
  let timerHandle = null;
  let timerStart = 0;
  let timerRaf = null;
  const RATINGS = ratings();

  const root = el(`
    <section class="flashcards">
      <header class="mode-header">
        <a href="#/home" class="back">${escapeHtml(t('nav.back_home'))}</a>
        <h2>${escapeHtml(t('flashcards.header', { name: localized(script.meta.name) }))}</h2>
        <button class="transcription-toggle clickable" id="transcription-toggle" title="${escapeHtml(t('transcription.cycle_tooltip'))}"></button>
      </header>

      <div class="timer-bar" id="timer-bar" hidden><div class="timer-fill" id="timer-fill"></div></div>

      <div class="card-stack">
        <button class="flashcard" id="card" dir="${script.meta.direction}" aria-keyshortcuts="Escape Space Enter ArrowLeft ArrowRight">
          <div class="face front"></div>
          <div class="face back"></div>
        </button>
      </div>
      <div class="shortcut-toast" id="shortcut-toast" aria-live="polite" aria-atomic="true"></div>

      <div class="card-actions rate-row" id="rate-row"></div>
      ${flashcardShortcutHelpHtml({
        title: t('flashcards.shortcuts'),
        homeLabel: t('flashcards.shortcut.home'),
        flipLabel: t('flashcards.shortcut.flip'),
        skipLabel: t('flashcards.shortcut.skip'),
        previousLabel: t('flashcards.shortcut.previous'),
        nextLabel: t('flashcards.shortcut.next'),
        ratings: RATINGS
      })}

      <div class="card-nav">
        <button class="btn-link" id="prev" title="${escapeHtml(`ArrowLeft: ${t('flashcards.shortcut.previous')}`)}" aria-keyshortcuts="ArrowLeft">${escapeHtml(t('flashcards.previous'))}</button>
        <span class="muted small" id="counter"></span>
        <button class="btn-link" id="next" title="${escapeHtml(`ArrowRight: ${t('flashcards.shortcut.next')}`)}" aria-keyshortcuts="ArrowRight">${escapeHtml(t('flashcards.next'))}</button>
      </div>

      <div class="card-shuffle">
        <button class="btn-link" id="shuffle">${escapeHtml(t('flashcards.reshuffle'))}</button>
        <span class="muted small" id="deck-info"></span>
      </div>
    </section>
  `);

  const cardEl = root.querySelector('#card');
  const frontEl = root.querySelector('.face.front');
  const backEl = root.querySelector('.face.back');
  const counterEl = root.querySelector('#counter');
  const deckInfoEl = root.querySelector('#deck-info');
  const transToggle = root.querySelector('#transcription-toggle');
  const rateRow = root.querySelector('#rate-row');
  const timerBar = root.querySelector('#timer-bar');
  const timerFill = root.querySelector('#timer-fill');
  const homeLink = root.querySelector('.back');
  const prevBtn = root.querySelector('#prev');
  const nextBtn = root.querySelector('#next');
  const shortcutToast = root.querySelector('#shortcut-toast');
  const rateButtons = {};
  let actions = null;

  RATINGS.forEach((r, i) => {
    const min = settings.srsIntervals[r.key] ?? 0;
    const tip = t('flashcards.next_review', { interval: formatMinutes(min) });
    const btn = el(`<button class="${r.cls}" data-rate="${r.key}" title="${escapeHtml(`${i + 1}: ${r.label} - ${tip}`)}"><span class="rate-key" aria-hidden="true">${i + 1}</span>${escapeHtml(r.label)}<span class="rate-int muted small">${escapeHtml(formatMinutes(min))}</span></button>`);
    btn.setAttribute('aria-keyshortcuts', String(i + 1));
    btn.addEventListener('click', e => {
      e.stopPropagation();
      actions?.rate(r.key);
    });
    rateButtons[r.key] = btn;
    rateRow.appendChild(btn);
  });

  function renderTranscriptionLabel() {
    transToggle.textContent = transcriptionLabel(settings.transcription);
  }

  function render() {
    stopTimer();
    if (!deck.length) {
      frontEl.innerHTML = '<div class="glyph">🎉</div>';
      backEl.innerHTML = `<div class="transcription">${escapeHtml(t('flashcards.all_caught_up'))}</div>`;
      counterEl.textContent = '0 / 0';
      return;
    }
    const letter = deck[idx];
    const field = fieldFor(settings.transcription);
    cardEl.classList.toggle('flipped', flipped);
    frontEl.innerHTML = `${countdownBadgeHtml()}<div class="glyph">${escapeHtml(letter.glyph)}</div>`;
    const transcription = letter[field] ?? letter.ipa;
    const ex = letter.example || {};
    backEl.innerHTML = `
      ${countdownBadgeHtml()}
      <div class="transcription">${escapeHtml(transcription)}</div>
      ${letter.note ? `<div class="note">${escapeHtml(localized(letter.note))}</div>` : ''}
      ${ex.native ? `
        <div class="example">
          <span class="example-native" dir="${script.meta.direction}">${escapeHtml(ex.native)}</span>
          <span class="example-transcription">${escapeHtml(ex[field] ?? ex.ipa ?? '')}</span>
          <span class="example-meaning">— ${escapeHtml(localized(ex.meaning))}</span>
        </div>` : ''}
    `;
    counterEl.textContent = `${idx + 1} / ${deck.length}`;
    const dueNow = countDueNow(script);
    deckInfoEl.textContent = dueNow > 0
      ? t('flashcards.due_now', { n: dueNow })
      : t('flashcards.no_due');
    renderTranscriptionLabel();
    startTimerIfEnabled();
  }

  function startTimerIfEnabled() {
    const secs = settings.flashcardTimerSec;
    const countdownBadges = root.querySelectorAll('.timer-countdown');
    if (!secs || secs <= 0) {
      timerBar.hidden = true;
      hideCountdownBadges(countdownBadges);
      return;
    }
    timerBar.hidden = false;
    timerFill.style.width = '100%';
    timerStart = performance.now();
    const total = secs * 1000;
    updateCountdownBadges(countdownBadges, total);
    const tick = () => {
      const elapsed = performance.now() - timerStart;
      const remaining = Math.max(0, total - elapsed);
      timerFill.style.width = `${(remaining / total) * 100}%`;
      updateCountdownBadges(countdownBadges, remaining);
      if (remaining > 0) timerRaf = requestAnimationFrame(tick);
    };
    timerRaf = requestAnimationFrame(tick);
    timerHandle = setTimeout(() => {
      if (!flipped) {
        flipped = true;
        recordLetter(script.meta.id, deck[idx].glyph, {});
        render();
      } else {
        rateCurrent('again');
      }
    }, total);
  }

  function stopTimer() {
    if (timerHandle) { clearTimeout(timerHandle); timerHandle = null; }
    if (timerRaf) { cancelAnimationFrame(timerRaf); timerRaf = null; }
    timerFill.style.width = '0%';
    hideCountdownBadges(root.querySelectorAll('.timer-countdown'));
  }

  function rateCurrent(ratingKey) {
    const rating = RATINGS.find(r => r.key === ratingKey);
    if (!rating || !deck.length) return;
    const intervalMin = settings.srsIntervals[ratingKey] ?? 0;
    const dueAt = Date.now() + intervalMin * 60_000;
    recordLetter(script.meta.id, deck[idx].glyph, { known: rating.known, dueAt, intervalMin });
    advance();
  }

  transToggle.addEventListener('click', e => {
    e.stopPropagation();
    settings = updateSettings({ transcription: nextTranscription(settings.transcription) });
    render();
  });

  cardEl.addEventListener('click', () => {
    flipCard();
  });

  function flipCard() {
    flipped = !flipped;
    if (flipped) recordLetter(script.meta.id, deck[idx].glyph, {});
    render();
  }

  prevBtn.addEventListener('click', e => {
    e.stopPropagation();
    actions?.previous();
  });
  nextBtn.addEventListener('click', e => {
    e.stopPropagation();
    actions?.next();
  });
  root.querySelector('#shuffle').addEventListener('click', e => {
    e.stopPropagation();
    deck = buildDeck(script);
    idx = 0;
    flipped = false;
    render();
  });

  actions = bindFlashcardKeys({
    root,
    home: goHome,
    previous,
    next: advance,
    skip: advance,
    flip: flipCard,
    rate: rateCurrent,
    ratingKeys: RATINGS.map(r => r.key),
    labels: {
      home: t('flashcards.shortcut.home'),
      flip: t('flashcards.shortcut.flip'),
      next: t('flashcards.shortcut.next'),
      skip: t('flashcards.shortcut.skip'),
      previous: t('flashcards.shortcut.previous'),
      ratings: RATINGS.map(r => r.label)
    },
    controls: {
      home: homeLink,
      previous: prevBtn,
      card: cardEl,
      next: nextBtn,
      ratings: rateButtons,
      status: shortcutToast
    }
  });

  function goHome() {
    location.hash = '#/home';
  }

  function previous() {
    if (!deck.length) return;
    idx = (idx - 1 + deck.length) % deck.length;
    flipped = false;
    render();
  }

  function advance() {
    if (!deck.length) return;
    idx = (idx + 1) % deck.length;
    flipped = false;
    if (idx === 0) deck = buildDeck(script);
    render();
  }

  render();
  mount.appendChild(root);

  const stop = () => {
    stopTimer();
    actions?.dispose();
  };
  window.addEventListener('hashchange', stop, { once: true });
}

function buildDeck(script) {
  const now = Date.now();
  const all = script.letters;
  const annotated = all.map(letter => {
    const prog = getLetterProgress(script.meta.id, letter.glyph);
    return { letter, due: prog.due || 0 };
  });
  const due = annotated.filter(a => a.due <= now).sort((a, b) => a.due - b.due).map(a => a.letter);
  if (due.length === 0) return shuffle(all);
  if (due.length < all.length) {
    const notDue = annotated.filter(a => a.due > now).sort((a, b) => a.due - b.due).map(a => a.letter);
    return [...shuffle(due), ...notDue];
  }
  return shuffle(due);
}

function countDueNow(script) {
  const now = Date.now();
  let n = 0;
  for (const letter of script.letters) {
    const prog = getLetterProgress(script.meta.id, letter.glyph);
    if ((prog.due || 0) <= now) n++;
  }
  return n;
}
