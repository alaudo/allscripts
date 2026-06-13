// Persistence layer. Everything lives under one localStorage key so a single
// JSON.stringify round-trip keeps the saved state self-consistent.

const KEY = 'scriptgame:v1';

const DEFAULTS = {
  version: 1,
  settings: {
    activeScript: 'greek',
    transcription: 'ipa',     // 'ipa' | 'english' | 'russian'
    inputSystem: 'latin'      // 'latin' | 'cyrillic'  -- used in mode 2
  },
  progress: {}                // { [scriptId]: { letters: {...}, words: {...} } }
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) },
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
  const p = state.progress[scriptId] || { letters: {}, words: {} };
  return {
    letters: { ...(p.letters || {}) },
    words: { ...(p.words || {}) }
  };
}

function ensureScript(scriptId) {
  if (!state.progress[scriptId]) {
    state.progress[scriptId] = { letters: {}, words: {} };
  }
  return state.progress[scriptId];
}

export function recordLetter(scriptId, glyph, { known } = {}) {
  const bucket = ensureScript(scriptId).letters;
  const entry = bucket[glyph] || { seen: 0, known: false };
  entry.seen += 1;
  if (typeof known === 'boolean') entry.known = known;
  bucket[glyph] = entry;
  persist();
}

export function recordWord(scriptId, key, { correct }) {
  const bucket = ensureScript(scriptId).words;
  const entry = bucket[key] || { correct: 0, wrong: 0 };
  if (correct) entry.correct += 1; else entry.wrong += 1;
  bucket[key] = entry;
  persist();
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
  return { lettersKnown, lettersSeen, wordsCorrect, wordsWrong };
}
