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

// Cycle through transcription systems in a stable order.
export const TRANSCRIPTIONS = ['ipa', 'english', 'russian'];
export function nextTranscription(current) {
  const i = TRANSCRIPTIONS.indexOf(current);
  return TRANSCRIPTIONS[(i + 1) % TRANSCRIPTIONS.length];
}
