/* Asistente de señales de cambio — funciona sin internet.
   Guarda la página, el logo y las fuentes en el dispositivo; los envíos al flujo nunca se guardan aquí
   (de eso se encarga la cola de la propia página). */
var CACHE = 'senales-v3';
var BASE = ['./', './index.html', './logo-resurgir.png?v=3', './manifest.webmanifest', './icon-192.png?v=3', './icon-512.png?v=3'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var esFuente = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !esFuente) return;

  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    /* La página: primero internet (para recibir mejoras); si no hay, la copia guardada. */
    e.respondWith(fetch(req).then(function (r) {
      var copia = r.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', copia); });
      return r;
    }).catch(function () { return caches.match('./index.html'); }));
    return;
  }
  /* Logo, iconos y fuentes: primero la copia guardada; si falta, se baja y se guarda. */
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (r) {
      if (r && (r.ok || r.type === 'opaque')) { var copia = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, copia); }); }
      return r;
    });
  }));
});
