// Tiny helpers shared by mode and UI modules.

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Loose comparison: case-insensitive, trims whitespace, strips a small set of
// common diacritics so 'ḥaḍīqa' matches 'hadiqa'. Doesn't touch the native
// script — only ASCII/Latin transliterations.
export function looseEqual(a, b) {
  return normalise(a) === normalise(b);
}

// Fuzzy comparison on top of looseEqual: tolerates a small number of edits.
// Tolerance scales with the length of the expected answer so short words don't
// become trivially "correct". Roughly: ~1 edit per 3 chars, minimum 1.
export function fuzzyEqual(a, b) {
  const na = normalise(a);
  const nb = normalise(b);
  if (na === nb) return true;
  if (!na.length || !nb.length) return false;
  const len = Math.max(na.length, nb.length);
  const tolerance = Math.max(1, Math.ceil(len / 3));
  return levenshtein(na, nb) <= tolerance;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

function normalise(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    // strip combining marks (accents, macrons, dots, etc.)
    .replace(/[\u0300-\u036f]/g, '')
    // remove apostrophes/quotes used in many transliterations
    .replace(/[ʼʿʾ’'`ʻ]/g, '')
    // collapse whitespace
    .replace(/\s+/g, ' ');
}

export function fieldFor(transcription) {
  // Map a settings.transcription value to the matching word field.
  return transcription === 'english' ? 'latin'
       : transcription === 'russian' ? 'cyrillic'
       : 'ipa';
}

export function inputFieldFor(inputSystem) {
  return inputSystem === 'cyrillic' ? 'cyrillic'
       : inputSystem === 'ipa' ? 'ipa'
       : 'latin';
}

export function transcriptionLabel(transcription) {
  return transcription === 'english' ? 'English re-spelling'
       : transcription === 'russian' ? 'Russian re-spelling'
       : 'IPA';
}

export function inputSystemLabel(inputSystem) {
  return inputSystem === 'cyrillic' ? 'Cyrillic'
       : inputSystem === 'ipa' ? 'IPA'
       : 'Latin';
}

export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  const coarsePointer = window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches;
  const touchViewport = typeof navigator !== 'undefined'
    && (navigator.maxTouchPoints || 0) > 0
    && window.innerWidth <= 900;
  return Boolean(coarsePointer || touchViewport);
}

export function shouldSuppressMobileKeyboard(settings, hasOnScreenKeyboard = true) {
  return Boolean(settings?.suppressKeyboardOnMobile && hasOnScreenKeyboard && isMobileDevice());
}

export function focusIfKeyboardAllowed(inputEl, suppressKeyboard) {
  if (!suppressKeyboard) inputEl.focus({ preventScroll: true });
}

export function bindEscToHome() {
  const controller = new AbortController();
  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    location.hash = '#/home';
  }, { signal: controller.signal });
  window.addEventListener('hashchange', () => controller.abort(), { once: true, signal: controller.signal });
  return () => controller.abort();
}

// Cycle through transcription systems in a stable order.
export const TRANSCRIPTIONS = ['ipa', 'english', 'russian'];
export function nextTranscription(current) {
  const i = TRANSCRIPTIONS.indexOf(current);
  return TRANSCRIPTIONS[(i + 1) % TRANSCRIPTIONS.length];
}

export const INPUT_SYSTEMS = ['latin', 'cyrillic', 'ipa'];
export function nextInputSystem(current) {
  const i = INPUT_SYSTEMS.indexOf(current);
  return INPUT_SYSTEMS[(i + 1) % INPUT_SYSTEMS.length];
}

// Format a duration in minutes as a short human-readable label.
export function formatMinutes(min) {
  if (min < 1) return '<1m';
  if (min < 60) return `${Math.round(min)}m`;
  if (min < 1440) return `${Math.round(min / 60)}h`;
  return `${Math.round(min / 1440)}d`;
}
