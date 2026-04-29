/* ── Villa Belém — Service Worker ─────────────────────────────── */
var CACHE = 'vilabelem-v1';

var PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-32.png',
  '/favicon-512.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

/* ── INSTALL: pré-carrega assets essenciais ───────────────────── */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(PRECACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── ACTIVATE: limpa caches antigos ──────────────────────────── */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── FETCH: cache-first para assets, network-first para HTML ─── */
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  /* Ignora requests não-GET e cross-origin que não sejam fontes/ícones */
  if (e.request.method !== 'GET') return;

  /* Estratégia network-first para o HTML principal */
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(function(res) {
          var clone = res.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
          return res;
        })
        .catch(function() {
          return caches.match('/index.html');
        })
    );
    return;
  }

  /* Estratégia cache-first para todo o resto (imagens, fontes, css, js) */
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        /* Só cacheia respostas válidas e de mesma origem ou CDNs permitidos */
        if (res && res.status === 200) {
          var clone = res.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        }
        return res;
      });
    })
  );
});
