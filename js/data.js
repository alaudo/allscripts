// Loads JSON content from /data and caches it. Each script's data file is
// fetched lazily; the manifest and international words pool are fetched once.

const cache = {
  manifest: null,
  scripts: new Map(),
  international: null,
  phrases: null
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
    cache.manifest = await fetchJSON('data/manifest.json');
  }
  return cache.manifest;
}

export async function getScript(id) {
  if (!cache.scripts.has(id)) {
    const manifest = await getManifest();
    const entry = manifest.scripts.find(s => s.id === id);
    if (!entry) throw new Error(`Unknown script id: ${id}`);
    const data = await fetchJSON(`data/${entry.file}`);
    cache.scripts.set(id, { meta: entry, ...data });
  }
  return cache.scripts.get(id);
}

export async function getInternational() {
  if (!cache.international) {
    cache.international = await fetchJSON('data/words-international.json');
  }
  return cache.international;
}

export async function getPhrases(scriptId) {
  if (!cache.phrases) {
    cache.phrases = await fetchJSON('data/phrases.json');
  }
  const entry = cache.phrases.scripts?.[scriptId];
  return entry?.phrases || [];
}

// Returns the union of a script's curated words and the international entries
// that have a rendering for that script. Each entry is normalised to the same
// shape: { native, ipa, latin, cyrillic, meaning, note?, source }
export async function getWordPool(scriptId) {
  const [script, intl] = await Promise.all([getScript(scriptId), getInternational()]);
  const pool = (script.words || []).map(w => ({ ...w, source: 'curated' }));
  for (const entry of (intl.entries || [])) {
    const form = entry.forms?.[scriptId];
    if (!form) continue;
    pool.push({
      native: form.native,
      ipa: form.ipa,
      latin: form.latin,
      cyrillic: form.cyrillic,
      meaning: entry.meaning || entry.concept,
      note: entry.note,
      source: 'international'
    });
  }
  return pool;
}
