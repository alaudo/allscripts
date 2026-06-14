// Persistence layer. Everything lives under one localStorage key so a single
// JSON.stringify round-trip keeps the saved state self-consistent.

const KEY = 'scriptgame:v1';

const DEFAULTS = {
  version: 1,
  settings: {
    activeScript: 'greek',
    transcription: 'ipa',     // 'ipa' | 'english' | 'russian'
    inputSystem: 'latin',     // 'latin' | 'cyrillic' | 'ipa'
    vocalised: false,         // show full vocalisation for Arabic/Hebrew
    theme: 'auto',            // 'auto' | 'light' | 'dark'
    uiLanguage: 'en',         // 'en' | 'ru'
    fuzzy: false,             // allow small typos in mode 2 / mode 3 transliteration matching
    flashcardTimerSec: 0,     // 0 = off; seconds per LETTER card before auto-advance
    phrasesTimerSec: 0,       // same idea, applied to PHRASE flashcards
    srsIntervals: {           // minutes added to "now" when a LETTER card is rated
      again: 1,               // 1 min
      hard: 10,               // 10 min
      good: 1440,             // 1 day
      easy: 5760              // 4 days
    },
    phrasesSrsIntervals: {    // identical structure, applied to PHRASE flashcards
      again: 1,
      hard: 10,
      good: 1440,
      easy: 5760
    }
  },
  progress: {}                // { [scriptId]: { letters: {...}, words: {...}, phrases: {...} } }
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      settings: {
        ...DEFAULTS.settings,
        ...(parsed.settings || {}),
        srsIntervals: { ...DEFAULTS.settings.srsIntervals, ...((parsed.settings || {}).srsIntervals || {}) },
        phrasesSrsIntervals: { ...DEFAULTS.settings.phrasesSrsIntervals, ...((parsed.settings || {}).phrasesSrsIntervals || {}) }
      },
      progress: { ...(parsed.progress || {}) }
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

let state = load();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode, quota, etc.) — fail soft.
  }
}

export function getSettings() {
  return { ...state.settings };
}

export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  persist();
  return { ...state.settings };
}

export function getProgress(scriptId) {
  const p = state.progress[scriptId] || { letters: {}, words: {}, phrases: {} };
  return {
    letters: { ...(p.letters || {}) },
    words: { ...(p.words || {}) },
    phrases: { ...(p.phrases || {}) }
  };
}

function ensureScript(scriptId) {
  if (!state.progress[scriptId]) {
    state.progress[scriptId] = { letters: {}, words: {}, phrases: {} };
  }
  const bucket = state.progress[scriptId];
  if (!bucket.letters) bucket.letters = {};
  if (!bucket.words) bucket.words = {};
  if (!bucket.phrases) bucket.phrases = {};
  return bucket;
}

export function recordLetter(scriptId, glyph, { known, dueAt, intervalMin } = {}) {
  const bucket = ensureScript(scriptId).letters;
  const entry = bucket[glyph] || { seen: 0, known: false, due: 0, intervalMin: 0, ratings: 0 };
  entry.seen += 1;
  if (typeof known === 'boolean') entry.known = known;
  if (typeof dueAt === 'number') entry.due = dueAt;
  if (typeof intervalMin === 'number') entry.intervalMin = intervalMin;
  if (dueAt || intervalMin) entry.ratings = (entry.ratings || 0) + 1;
  bucket[glyph] = entry;
  persist();
}

export function getLetterProgress(scriptId, glyph) {
  const p = state.progress[scriptId];
  if (!p || !p.letters || !p.letters[glyph]) return { seen: 0, known: false, due: 0, intervalMin: 0, ratings: 0 };
  return { ...p.letters[glyph] };
}

export function recordWord(scriptId, key, { correct }) {
  const bucket = ensureScript(scriptId).words;
  const entry = bucket[key] || { correct: 0, wrong: 0 };
  if (correct) entry.correct += 1; else entry.wrong += 1;
  bucket[key] = entry;
  persist();
}

export function recordPhrase(scriptId, key, { known, dueAt, intervalMin } = {}) {
  const bucket = ensureScript(scriptId).phrases;
  const entry = bucket[key] || { seen: 0, known: false, due: 0, intervalMin: 0, ratings: 0 };
  entry.seen += 1;
  if (typeof known === 'boolean') entry.known = known;
  if (typeof dueAt === 'number') entry.due = dueAt;
  if (typeof intervalMin === 'number') entry.intervalMin = intervalMin;
  if (dueAt || intervalMin) entry.ratings = (entry.ratings || 0) + 1;
  bucket[key] = entry;
  persist();
}

export function getPhraseProgress(scriptId, key) {
  const p = state.progress[scriptId];
  if (!p || !p.phrases || !p.phrases[key]) return { seen: 0, known: false, due: 0, intervalMin: 0, ratings: 0 };
  return { ...p.phrases[key] };
}

export function resetScript(scriptId) {
  delete state.progress[scriptId];
  persist();
}

export function resetAll() {
  state = structuredClone(DEFAULTS);
  persist();
}

export function summary(scriptId) {
  const p = getProgress(scriptId);
  const lettersKnown = Object.values(p.letters).filter(l => l.known).length;
  const lettersSeen = Object.keys(p.letters).length;
  const wordsCorrect = Object.values(p.words).reduce((n, w) => n + (w.correct || 0), 0);
  const wordsWrong = Object.values(p.words).reduce((n, w) => n + (w.wrong || 0), 0);
  // A word is considered "learned" once the learner has answered it correctly
  // at least once and has more correct answers than wrong ones.
  const wordsLearned = Object.values(p.words).filter(w => (w.correct || 0) > 0 && (w.correct || 0) >= (w.wrong || 0)).length;
  const phrasesKnown = Object.values(p.phrases).filter(ph => ph.known).length;
  const phrasesSeen = Object.keys(p.phrases).length;
  return { lettersKnown, lettersSeen, wordsCorrect, wordsWrong, wordsLearned, phrasesKnown, phrasesSeen };
}
