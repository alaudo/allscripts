// Loads JSON content from /data and caches it. The top-level manifest only
// lists script folders; each folder owns its own metadata and learning data.

const cache = {
  manifest: null,
  scripts: new Map(),
  international: new Map(),
  signs: new Map(),
  syllables: new Map(),
  phrases: new Map()
};

async function fetchJSON(path) {
  let res;
  try {
    res = await fetch(path, { cache: 'no-cache' });
  } catch (err) {
    if (location.protocol === 'file:') {
      throw new Error(
        `Cannot fetch ${path} when the app is opened with file://. ` +
        `Serve the directory over HTTP (e.g. "python -m http.server").`
      );
    }
    throw err;
  }
  if (!res.ok) throw new Error(`Failed to load ${path}: HTTP ${res.status}`);
  return res.json();
}

export async function getManifest() {
  if (!cache.manifest) {
    const manifest = await fetchJSON('data/manifest.json');
    const scripts = await Promise.all((manifest.scripts || []).map(async entry => {
      const folder = scriptFolder(entry);
      const meta = await fetchJSON(`data/${folder}/meta.json`);
      return { ...entry, ...meta, folder };
    }));
    cache.manifest = { ...manifest, scripts };
  }
  return cache.manifest;
}

export async function getScript(id) {
  if (!cache.scripts.has(id)) {
    const entry = await getScriptEntry(id);
    const [lettersData, wordsData] = await Promise.all([
      fetchJSON(`data/${entry.folder}/letters.json`),
      fetchJSON(`data/${entry.folder}/words.json`)
    ]);
    cache.scripts.set(id, {
      meta: entry,
      letters: lettersData.letters || [],
      words: wordsData.words || []
    });
  }
  return cache.scripts.get(id);
}

export async function getInternational(scriptId) {
  if (!cache.international.has(scriptId)) {
    const entry = await getScriptEntry(scriptId);
    cache.international.set(scriptId, await fetchJSON(`data/${entry.folder}/international.json`));
  }
  return cache.international.get(scriptId);
}

export async function getSigns(scriptId) {
  if (!cache.signs.has(scriptId)) {
    const entry = await getScriptEntry(scriptId);
    cache.signs.set(scriptId, await fetchJSON(`data/${entry.folder}/signs.json`));
  }
  return cache.signs.get(scriptId);
}

export async function getSyllables(scriptId) {
  if (!cache.syllables.has(scriptId)) {
    const entry = await getScriptEntry(scriptId);
    const data = await fetchJSON(`data/${entry.folder}/syllables.json`);
    cache.syllables.set(scriptId, data.items || []);
  }
  return cache.syllables.get(scriptId);
}

export async function getPhrases(scriptId) {
  if (!cache.phrases.has(scriptId)) {
    const entry = await getScriptEntry(scriptId);
    const data = await fetchJSON(`data/${entry.folder}/phrases.json`);
    cache.phrases.set(scriptId, data.phrases || []);
  }
  return cache.phrases.get(scriptId);
}

// Returns the union of a script's curated words, signboard words, and international entries
// that have a rendering for that script. Each entry is normalised to the same
// shape: { native, ipa, latin, cyrillic, meaning, note?, category, source }
export async function getWordPool(scriptId) {
  const [script, intl, signs] = await Promise.all([getScript(scriptId), getInternational(scriptId), getSigns(scriptId)]);
  const pool = (script.words || []).map(w => ({
    ...w,
    category: w.category || 'general',
    source: 'curated'
  }));
  for (const entry of (signs.entries || [])) {
    pool.push({
      native: entry.native,
      nativeVoweled: entry.nativeVoweled,
      ipa: entry.ipa,
      latin: entry.latin,
      cyrillic: entry.cyrillic,
      meaning: entry.meaning || entry.concept,
      note: entry.note,
      category: signs.category?.id || 'signs',
      source: 'signs'
    });
  }
  for (const entry of (intl.entries || [])) {
    pool.push({
      native: entry.native,
      nativeVoweled: entry.nativeVoweled,
      ipa: entry.ipa,
      latin: entry.latin,
      cyrillic: entry.cyrillic,
      meaning: entry.meaning || entry.concept,
      note: entry.note,
      category: entry.category || 'general',
      source: 'international'
    });
  }
  return pool;
}

async function getScriptEntry(id) {
  const manifest = await getManifest();
  const entry = manifest.scripts.find(s => s.id === id);
  if (!entry) throw new Error(`Unknown script id: ${id}`);
  return entry;
}

function scriptFolder(entry) {
  return entry.folder || `scripts/${entry.id}`;
}
