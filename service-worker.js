const CACHE_VERSION = 'allscripts-v5';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-512.png',
  './css/styles.css',
  './data/manifest.json',
  './js/app.js',
  './js/data.js',
  './js/i18n.js',
  './js/pwa.js',
  './js/router.js',
  './js/storage.js',
  './js/theme.js',
  './js/modes/choose.js',
  './js/modes/flashcards.js',
  './js/modes/flashcards-syllables.js',
  './js/modes/flashcards-words.js',
  './js/modes/phrases.js',
  './js/modes/preview-letters.js',
  './js/modes/preview-phrases.js',
  './js/modes/preview-syllables.js',
  './js/modes/preview-words.js',
  './js/modes/read.js',
  './js/modes/spell.js',
  './js/ui/countdown.js',
  './js/ui/dom.js',
  './js/ui/flashcard-keys.js',
  './js/ui/home.js',
  './js/ui/ipa-keyboard.js',
  './js/ui/keyboard.js',
  './js/ui/settings.js'
];

const SCRIPT_FILES = [
  'meta.json',
  'letters.json',
  'words.json',
  'phrases.json',
  'syllables.json',
  'signs.json',
  'international.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    precache()
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function precache() {
  const cache = await caches.open(CACHE_VERSION);
  const assets = await assetsToCache();
  await cache.addAll(assets);
}

async function assetsToCache() {
  const manifest = await fetch('./data/manifest.json', { cache: 'no-cache' }).then(response => response.json());
  const scriptAssets = (manifest.scripts || []).flatMap(entry => {
    const folder = entry.folder || `scripts/${entry.id}`;
    return SCRIPT_FILES.map(file => `./data/${folder}/${file}`);
  });
  const flagAssets = await Promise.all((manifest.scripts || []).map(async entry => {
    const folder = entry.folder || `scripts/${entry.id}`;
    const meta = await fetch(`./data/${folder}/meta.json`, { cache: 'no-cache' }).then(response => response.json());
    return meta.flagsSvg ? [`./data/${folder}/${meta.flagsSvg}`] : [];
  }));
  return [...CORE_ASSETS, ...scriptAssets, ...flagAssets.flat()];
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
