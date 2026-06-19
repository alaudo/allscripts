import { escapeHtml } from './dom.js';

const ratingShortcuts = ['1', '2', '3', '4'];
const actionDelayMs = 320;
const flipDelayMs = 80;

export function flashcardShortcutHelpHtml({ title, homeLabel, flipLabel, skipLabel }) {
  return `
    <div class="shortcut-help" aria-label="${escapeHtml(title)}">
      <span class="shortcut-help-title">${escapeHtml(title)}</span>
      ${shortcutHint('Esc', homeLabel)}
      ${shortcutHint('Space', flipLabel)}
      ${shortcutHint('Enter', skipLabel)}
    </div>
  `;
}

export function bindFlashcardKeys({ root, home, previous, next, skip, flip, rate, ratingKeys, labels, controls = {} }) {
  let timeoutId = null;
  let activeControl = null;
  let disposed = false;

  const runHome = () => animateAction('home', labels.home, controls.home, home);
  const runPrevious = () => animateAction('prev', labels.previous, controls.previous, previous);
  const runNext = () => animateAction('next', labels.next, controls.next, next);
  const runSkip = () => animateAction('skip', labels.skip, controls.card, skip);
  const runFlip = () => animateAction('flip', labels.flip, controls.card, flip, { delayMs: flipDelayMs, showStatus: false });
  const runRate = ratingKey => {
    const index = ratingKeys.indexOf(ratingKey);
    if (index === -1) return;
    animateAction('rate', labels.ratings[index], controls.ratings?.[ratingKey], () => rate(ratingKey));
  };

  const onKeyDown = event => {
    if (event.defaultPrevented || event.repeat || !root.isConnected || isTypingTarget(event.target)) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      runHome();
      return;
    }

    if (event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space') {
      event.preventDefault();
      runFlip();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      runSkip();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      runPrevious();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      runNext();
      return;
    }

    const ratingIndex = ratingShortcuts.indexOf(event.key);
    if (ratingIndex !== -1 && ratingIndex < ratingKeys.length) {
      event.preventDefault();
      runRate(ratingKeys[ratingIndex]);
    }
  };

  document.addEventListener('keydown', onKeyDown);
  return {
    home: runHome,
    previous: runPrevious,
    next: runNext,
    skip: runSkip,
    flip: runFlip,
    rate: runRate,
    dispose() {
      disposed = true;
      document.removeEventListener('keydown', onKeyDown);
      if (timeoutId) clearTimeout(timeoutId);
      clearVisualState();
    }
  };

  function animateAction(kind, label, control, action, { delayMs = actionDelayMs, showStatus = true } = {}) {
    if (timeoutId || disposed || !root.isConnected) return;
    const status = controls.status;
    root.dataset.shortcutAction = label;
    root.classList.add('shortcut-animating', `shortcut-${kind}`);
    activeControl = control || null;
    activeControl?.classList.add('shortcut-active');
    if (status && showStatus) status.textContent = label;

    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      clearVisualState();
      if (!disposed && root.isConnected) action();
    }, delayMs);
  }

  function clearVisualState() {
    root.classList.remove('shortcut-animating', 'shortcut-home', 'shortcut-prev', 'shortcut-next', 'shortcut-skip', 'shortcut-flip', 'shortcut-rate');
    delete root.dataset.shortcutAction;
    activeControl?.classList.remove('shortcut-active');
    activeControl = null;
    if (controls.status) controls.status.textContent = '';
  }
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

function shortcutHint(key, label) {
  return `<span class="shortcut-hint" title="${escapeHtml(key)}: ${escapeHtml(label)}"><kbd>${escapeHtml(key)}</kbd>${escapeHtml(label)}</span>`;
}
