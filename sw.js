/* ==========================================================================
   TrailKit — Service Worker
   ========================================================================== */

const CACHE_VERSION = 'trailkit-v2.0.0';
const APP_SHELL = [
  './', './index.html', './offline.html', './404.html', './manifest.webmanifest',
  './assets/css/style.css', './assets/css/responsive.css',
  './assets/css/animations.css', './assets/css/mobile.css',
  './assets/js/state.js', './assets/js/notify.js', './assets/js/tool-engine.js',
  './assets/js/theme.js', './assets/js/navigation.js', './assets/js/favorites.js',
  './assets/js/command-palette.js', './assets/js/mobile.js', './assets/js/help.js',
  './assets/js/app.js', './assets/js/outdoor.js', './assets/js/weather.js',
  './assets/js/image-tools.js', './assets/js/pdf-tools.js', './assets/js/speech.js',
  './assets/js/utilities.js',
  './assets/images/logo.svg',
  './pages/outdoor.html', './pages/weather.html', './pages/image-tools.html',
  './pages/pdf-tools.html', './pages/speech.html', './pages/utilities.html', './pages/about.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('./offline.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        fetch(req).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(req).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
        }
        return response;
      }).catch(() => {
        const accept = req.headers.get('accept') || '';
        if (accept.includes('text/html')) return caches.match('./offline.html');
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});