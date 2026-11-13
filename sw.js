/* Corrillo — service worker: guarda la app para jugar sin conexión.
   Al cambiar archivos, sube el número de VERSION para que los móviles descarguen la versión nueva. */
const VERSION = 'corrillo-v7';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/styles.css",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon.svg",
  "js/content/cifras.js",
  "js/content/deduccion.js",
  "js/content/nuevos.js",
  "js/content/palabras.js",
  "js/content/preguntas.js",
  "js/content/universidad.js",
  "js/core/core.js",
  "js/core/library.js",
  "js/games/azar.js",
  "js/games/cifras.js",
  "js/games/espia.js",
  "js/games/fiesta.js",
  "js/games/impostor.js",
  "js/games/lobos.js",
  "js/games/mentiroso.js",
  "js/games/nuevos.js",
  "js/games/puntos.js",
  "js/games/rapidez.js",
  "js/games/tarjetas.js",
  "js/games/verdadreto.js",
  "js/content/ampliacion.js",
  "js/content/ampliacion2.js",
  "js/content/creditos.js",
  "img/precios/activision.jpg",
  "img/precios/alaska.jpg",
  "img/precios/android.jpg",
  "img/precios/apolo.jpg",
  "img/precios/avatar.jpg",
  "img/precios/banana.jpg",
  "img/precios/blairwitch.jpg",
  "img/precios/bugatti.jpg",
  "img/precios/burj.jpg",
  "img/precios/codice.jpg",
  "img/precios/cristiano.jpg",
  "img/precios/ds.jpg",
  "img/precios/endgame.jpg",
  "img/precios/ferrari.jpg",
  "img/precios/fox.jpg",
  "img/precios/gameboy.jpg",
  "img/precios/girasoles.jpg",
  "img/precios/grito.jpg",
  "img/precios/gta.jpg",
  "img/precios/instagram.jpg",
  "img/precios/ipad.jpg",
  "img/precios/iphone1.jpg",
  "img/precios/iphone15.jpg",
  "img/precios/ipod.jpg",
  "img/precios/iss.jpg",
  "img/precios/jugadores.jpg",
  "img/precios/linkedin.jpg",
  "img/precios/lirios.jpg",
  "img/precios/lucasfilm.jpg",
  "img/precios/luisiana.jpg",
  "img/precios/macintosh.jpg",
  "img/precios/manhattan.jpg",
  "img/precios/maradona.jpg",
  "img/precios/marvel.jpg",
  "img/precios/mbappe.jpg",
  "img/precios/megadrive.jpg",
  "img/precios/mercedes.jpg",
  "img/precios/meules.jpg",
  "img/precios/minecraft.jpg",
  "img/precios/modelt.jpg",
  "img/precios/n64.jpg",
  "img/precios/neymar.jpg",
  "img/precios/paypal.jpg",
  "img/precios/pixar.jpg",
  "img/precios/pizza.jpg",
  "img/precios/ps1.jpg",
  "img/precios/ps2.jpg",
  "img/precios/ps5.jpg",
  "img/precios/raspberry.jpg",
  "img/precios/salvator.jpg",
  "img/precios/sello.jpg",
  "img/precios/skype.jpg",
  "img/precios/snes.jpg",
  "img/precios/steamdeck.jpg",
  "img/precios/sue.jpg",
  "img/precios/superbowl.jpg",
  "img/precios/switch.jpg",
  "img/precios/tesla3.jpg",
  "img/precios/titanic.jpg",
  "img/precios/twitch.jpg",
  "img/precios/twitter.jpg",
  "img/precios/virgin.jpg",
  "img/precios/visionpro.jpg",
  "img/precios/webb.jpg",
  "img/precios/wholefoods.jpg",
  "img/precios/wii.jpg",
  "img/precios/youtube.jpg"
];

const APP_URLS = new Set(FILES.map((path) => new URL(path, self.registration.scope).href));
/* Las actualizaciones esperan a cerrar la app o a pulsar «Actualizar» en el menú. */
self.addEventListener('install', (e) => e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES))));
self.addEventListener('message', (e) => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('corrillo-v') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
/* Solo archivos de esta app. Una respuesta HTTP de error nunca sustituye una copia buena. */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  url.search = ''; url.hash = '';
  if (!APP_URLS.has(url.href)) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const fallback = async () => (await cache.match(url.href)) || (e.request.mode === 'navigate' ? await cache.match(new URL('index.html', self.registration.scope).href) : null);
    try {
      const response = await fetch(e.request);
      if (!response.ok) return (await fallback()) || response;
      try { await cache.put(url.href, response.clone()); } catch (ignored) { /* Sin espacio: se conserva la respuesta de red. */ }
      return response;
    } catch (error) {
      const saved = await fallback();
      if (saved) return saved;
      return Response.error();
    }
  })());
});
