/* Corrillo — service worker: guarda la app para jugar sin conexión.
   Al cambiar archivos, sube el número de VERSION para que los móviles descarguen la versión nueva. */
const VERSION = 'corrillo-v9';
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
  "js/core/rules.js",
  "js/core/experience.js",
  "js/core/catalogue.js",
  "js/content/social.js",
  "js/content/identities.js",
  "js/content/revision.js",
  "js/content/referencias.js",
  "js/games/ampliaciones.js",
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
const ESSENTIAL = FILES.filter((path) => !path.startsWith('img/'));
const OPTIONAL = FILES.filter((path) => path.startsWith('img/'));
/* Generado por node tools/offline.cjs después de editar recursos. */
const INTEGRITY = {
  "./": "sha256-VWkipNzyOFHscclACK6cVtKykbfjEdrRXmdXlLBpZIw=",
  "index.html": "sha256-VWkipNzyOFHscclACK6cVtKykbfjEdrRXmdXlLBpZIw=",
  "manifest.webmanifest": "sha256-rQd3xTjpWDTuvkO/KkpFVtvkBhxMFczAWCMzBYgLWtw=",
  "css/styles.css": "sha256-rL1eccEjxBppGWngSTTN1KmbWJewppMBMGCllkQfAmg=",
  "icons/icon-180.png": "sha256-7NL2kBa4CWKtv8L35rNpMPxxCSdw178zMpvWkXnzY/I=",
  "icons/icon-192.png": "sha256-tEHnsWQXPrbclcY7lUIqZ8tpFPVi6bccDT23tkXJ25o=",
  "icons/icon-512.png": "sha256-z7wRuppsYXmF5Z5llnTWQQpLsRyQFRWeGs04eHemuFM=",
  "icons/icon.svg": "sha256-mmAYnde8wPW6cWH9sM8cg9LPvmglIrDt521nKNr8Xa8=",
  "js/content/cifras.js": "sha256-LDGWxAzhJSMuHy0dkKTlm3P+/LuvumIOgFCyoQAhBT8=",
  "js/content/deduccion.js": "sha256-h5frgVEjiiJfnqVeGxDh3tu0kVzzuYvyDF05xljjyXc=",
  "js/content/nuevos.js": "sha256-bmJLo5qOwRF2IZIqYoldREdddH0Mm1Md8jbD3Uhxg6w=",
  "js/content/palabras.js": "sha256-tOXG/JBFnAkc47/fJhgjesZWkmyupplpmvTkap+JouQ=",
  "js/content/preguntas.js": "sha256-wZcEgwSl+vZzcxqPYlqVpA1L61lXsouFQYBPxPtuIrM=",
  "js/content/universidad.js": "sha256-oFfNW20m5I+6sqLz6l2Cl4F8bVedHTGPSoWELMRb1WQ=",
  "js/core/core.js": "sha256-QjdmBcA/Qgb1iioN0M+8vmNY9fnvo49gMnHtSAIoos4=",
  "js/core/library.js": "sha256-3bMxwW/L6Xkemke7BECYoEV9vJH73KC5PJtwF6v4wI0=",
  "js/core/rules.js": "sha256-+CgB2iT7bsiAh9N06A2skeNFtxUD5ZvCU6fHeaQ8PDU=",
  "js/core/experience.js": "sha256-Tla97AYZYYAWg7e41Se62zUqrl0DZIBP0d+3Z8PKmWg=",
  "js/core/catalogue.js": "sha256-dPVeCm+F/+dRyYJlj0ijQW5NMKc/uHAl+G9OqTkx90g=",
  "js/content/social.js": "sha256-GmzraREFmszORdQMmfh2FYWoRB4TuoJkzrX31m/jLLE=",
  "js/content/identities.js": "sha256-69p2/2IwSHLtqKnwjdGhhiYBQdNoxNOLnkT+lHSmKdM=",
  "js/content/revision.js": "sha256-J4Kwt19yeM+btxZ4TiiKtIOY4GQAS9OY3BqNTbQeV8Y=",
  "js/content/referencias.js": "sha256-HZ4u7PjjNjUurGYQla9LsuGnBiyI4+dwXcL5ZkgUWGY=",
  "js/games/ampliaciones.js": "sha256-Lp9zW75IVU8kwCc/0kTz+FjLbfwb+fCdzLzIq8eYi/o=",
  "js/games/azar.js": "sha256-5hEr6gsGtmIrplWVtt1cCPW3YupSV30+5bObCjo85vI=",
  "js/games/cifras.js": "sha256-i5X/TB7GT/5yPm8oxIAb7RTYsE6GWitLA+v/d8/5h44=",
  "js/games/espia.js": "sha256-ESeykFJqvVXVJqkx9mfWgWb6RA+0ANTXUbStTrwO8iw=",
  "js/games/fiesta.js": "sha256-36Ynd4iUOSwrmN1vnZIBZLWPW3cSjgSzghJLgrkJeJU=",
  "js/games/impostor.js": "sha256-LxCUDazwsciJw5WoMdQDPK4fQc+p4y2i5Yc82trOOiM=",
  "js/games/lobos.js": "sha256-JDNtUlwngzFQdlLKNNkEaArz7yx0VxSDMprzEOUgRm8=",
  "js/games/mentiroso.js": "sha256-eiJ0XdnrHQp6qofgGwuT1D9UPXDKvty/v+VLZSVjFl8=",
  "js/games/nuevos.js": "sha256-Fsh0Mmg69oapft+DeXgNE/rjkKeXG7+/komMkh4fE1U=",
  "js/games/puntos.js": "sha256-5lZiwCaqCNbmagTUAH+012XfRJ7W33i683F7jbNU9Y0=",
  "js/games/rapidez.js": "sha256-dd9BMILvyD5bykcJRRwwgXoPKD9YwDp4o/BvRx3wtwo=",
  "js/games/tarjetas.js": "sha256-4ZeZhGkJmuksCqvM7jcIrhYBLVDOE4CNLX+ZmpadCJM=",
  "js/games/verdadreto.js": "sha256-6J1V183urs6MJsHdjSnxIUZJ5NC/nj0fO6PkiJPc464=",
  "js/content/ampliacion.js": "sha256-Km4FgyCSy34VyAJT4J9n6NyCUXo7X7FZwdhPiG857pk=",
  "js/content/ampliacion2.js": "sha256-NpJPp1vKYkfl1XVW3x6W8S0Z+0Dn9GmPKk8JnSWzqQc=",
  "js/content/creditos.js": "sha256-3jF869m0cRU25fD0J3X8zWW4pSpFL7xGaNUS24FESMk=",
  "img/precios/activision.jpg": "sha256-QPnj7td+CybB/KhSzFRbjONVvNYrBIX3uhVsLzIMZt4=",
  "img/precios/alaska.jpg": "sha256-14l5HRMUzRV6Mo4D7wcqZK+mCOCqoj+WrCJCoJznF0c=",
  "img/precios/android.jpg": "sha256-Oc6miy8sS4EcSkQPnKuc/EkYDYeNqgpRFXEQvATVfCU=",
  "img/precios/apolo.jpg": "sha256-EK/K95LIVCf93AqurRy3LMN7unPDWtlw2RZs/s/Ftyw=",
  "img/precios/avatar.jpg": "sha256-cfVKYjhbPBhW2vuR2HQeSY07u6Xz0mLajIl0eqSxyQU=",
  "img/precios/banana.jpg": "sha256-OREpXUypu48NFxMJGH0/rwK6zS8LAhT8j9oOJEC1AXw=",
  "img/precios/blairwitch.jpg": "sha256-LKQQsrgzeC1yfhtGZnHBSjoG6q7n/OmH7uuRWasI8u4=",
  "img/precios/bugatti.jpg": "sha256-m/DcSx96IDbHm8F29zcj2os5mtqIvb3buFNFGrvoUis=",
  "img/precios/burj.jpg": "sha256-JZSd6REevcAieOYR1Xl/KlrNcHedjZ6i8HRVdoIGGfI=",
  "img/precios/codice.jpg": "sha256-WvgsaHSPz0xdzQyfgrbK40RmyERJ17FNx+zCbvCZZPI=",
  "img/precios/cristiano.jpg": "sha256-nSMfEs7Kfz+vgVtGBS0Tsz+QpQh5Lm50AZDkrNtccx8=",
  "img/precios/ds.jpg": "sha256-UXhh2WASRLM28VHtxkJOTfqdcaFhRhPb9n2+cXaE8mc=",
  "img/precios/endgame.jpg": "sha256-yBm4MyV7F2HBlXrquoPIiJSbvBAoJuopPXT9hOptXaM=",
  "img/precios/ferrari.jpg": "sha256-bKo3ifUaVuqngwA+csBgno3a14pGQB4E4yd0+/7GHMU=",
  "img/precios/fox.jpg": "sha256-jLSs58SP9WpvIZ+3B9laQVYwfIgKaq31M56/AuM896Y=",
  "img/precios/gameboy.jpg": "sha256-aXv8S2fFQ1E3ArcTrnj3Q4oF+ZuTDuQQJcCDvyT1wVk=",
  "img/precios/girasoles.jpg": "sha256-91rK0qmfqSAZGL85fWXGdAcQDKIRQakTM8PWLYk3Xac=",
  "img/precios/grito.jpg": "sha256-+M+gkHLPLowoZnRxv4Sh7+EJgPazXRZoagDRJvNCESQ=",
  "img/precios/gta.jpg": "sha256-nkdtV2LaeguEylGc+egluB2aPlcR2E5ZpOPC0dnbwZI=",
  "img/precios/instagram.jpg": "sha256-SHL3AYwCLirlZXmWye6Gn9x4AqA+a5A7CJJEf0H9yuE=",
  "img/precios/ipad.jpg": "sha256-LRwSVGeZB5M1Ro86oOdjfpaQ2UFDmkVtOhRUq2FOnCw=",
  "img/precios/iphone1.jpg": "sha256-EicyAk/lZY19lwnE+vArhZXUMsEAWIfMt6csznxGi9w=",
  "img/precios/iphone15.jpg": "sha256-sUu0zc6xF8OU33scopThaAe08CvNBx/uz+qLAc1MvbE=",
  "img/precios/ipod.jpg": "sha256-/llT6RSQaLSP8v8wyzUqDY4cQjFZ1/6eE4Mw/6abZag=",
  "img/precios/iss.jpg": "sha256-b+yhs/n4YdKSC6gK5JeqXgmvdSX92AWS6jxekjfQ7pA=",
  "img/precios/jugadores.jpg": "sha256-KauVMiFebnF/SJLXEAptU60W1xdJh+RGtMhQv6OP3v0=",
  "img/precios/linkedin.jpg": "sha256-yxv2iLmA4MtiwRRZLreP9BfOtt41cz078kN40wBytNs=",
  "img/precios/lirios.jpg": "sha256-CxyJ1HaKnmJibkiutXOYISjXhHTe9Vv4oMNzMAdu6Tc=",
  "img/precios/lucasfilm.jpg": "sha256-kY6hkMEYnlUk0T3rAj1ePTOL3nMW8YEgf/tMYkUZRwg=",
  "img/precios/luisiana.jpg": "sha256-2Axf3SgF++1AL0nnS6U8KkchHGqTffpTXGGH2/XvJyM=",
  "img/precios/macintosh.jpg": "sha256-1O0up1j2PeVe8A7HjmpNzqOg0QdsJHUZbxxLZ2PbDt0=",
  "img/precios/manhattan.jpg": "sha256-yP9eYPe+xofslICG2PmuIHhfLgu+DVd+dBGynmnrcNw=",
  "img/precios/maradona.jpg": "sha256-6ESnX2EP8XqdEVU/1QL7dtbzx3jSAIfAUDojI/voNb4=",
  "img/precios/marvel.jpg": "sha256-M+JE6YH2tXGrI4a5iNvn7GGMQk/4X/TPtCmXj3z/hUE=",
  "img/precios/mbappe.jpg": "sha256-bRAK42HJXB4129rTjmWAcDkrFpszKGM6QxayPtivQZc=",
  "img/precios/megadrive.jpg": "sha256-7e9G27cqgvBYuhK+UwzctlFIYHL747a8MRdTpknCGkQ=",
  "img/precios/mercedes.jpg": "sha256-YAnaTgYu6m1dzSADmtlr4442zezL8kZnTv1RvOnu2uU=",
  "img/precios/meules.jpg": "sha256-ZqSosklC9z8WenaTwOrrkmeRSatIYy/Psao1/nyxzo8=",
  "img/precios/minecraft.jpg": "sha256-dAZPGm9FCtHWHcrWoLtpsDR/nJsGf9F2rXfA7mK+0Ek=",
  "img/precios/modelt.jpg": "sha256-VLNkOvbdqT+meCHAl8pRnoYcklpBLhYA5BHvnwSwU/k=",
  "img/precios/n64.jpg": "sha256-UeuRvLbzVum317+nM2xn5mnV/iQ69QcqVOx8ZTbLF+A=",
  "img/precios/neymar.jpg": "sha256-DqfVb7bfi3iunqqemhcwNorNXova8D4GR3Fdffpf4gI=",
  "img/precios/paypal.jpg": "sha256-u+MpJLVzBgamBux1NKsT6wyIgRt/uMowbZHJ4IKTO/8=",
  "img/precios/pixar.jpg": "sha256-RnYpohalJLNn/IQY/cZoKzodxPBqdjYcnojLjxNthjA=",
  "img/precios/pizza.jpg": "sha256-WXdOuQNRnu23luMWkerXuMfPCWGi0sQe7s0/2jXnNHU=",
  "img/precios/ps1.jpg": "sha256-wV6oYw5Efo4XE+tq3d+k/DdtelAV2f4uXVdMrkWorLM=",
  "img/precios/ps2.jpg": "sha256-xjCLzwPNG8BmDUjFOKYP61zrN9XRXjSNsFU60iRpoOQ=",
  "img/precios/ps5.jpg": "sha256-oQeg87gXiv7uZKIeNL54DrgnElEt8xf/Kf+mfjwU78A=",
  "img/precios/raspberry.jpg": "sha256-IuafGvv+d7Pe0aAYSqSUAvsmCd8IB7jSjCiPp1UWU1U=",
  "img/precios/salvator.jpg": "sha256-ReOxnXsFH/QuixN1q2+v5rCnRgc67D9eMg4Di98VyHw=",
  "img/precios/sello.jpg": "sha256-SAwlOnoZSCB+6smLhFpJyNr9QXY/V5Mq9vckmYKsync=",
  "img/precios/skype.jpg": "sha256-hZkQFjiAEVIZcQkONtPESfYZZ1YBTLRXa1aX3QuvBCs=",
  "img/precios/snes.jpg": "sha256-7Z3tvB0OMqWJoC9MygX0JOGC5im7SxgLW3ZnSF9rQ70=",
  "img/precios/steamdeck.jpg": "sha256-pJmHUOED7bKC03XVPk10fS8tbkzaWMFtSyEmZpktjuw=",
  "img/precios/sue.jpg": "sha256-jeGgb1FhPhAOZUs6OiaZv/wxUgnGHKY61DkWX6ymBIY=",
  "img/precios/superbowl.jpg": "sha256-/eHAAkq4+OYZ9ZQiR4NIoVj5uzU8qQB6AMLpTTWzEgA=",
  "img/precios/switch.jpg": "sha256-2/Eheruy6Q8rmqEjc7sbNtDpAhSxuD3qB0449nqoU2Q=",
  "img/precios/tesla3.jpg": "sha256-LBN7qviMNXrL9K5ExXs7kZI52PzDmXAXH68LaFuDJGo=",
  "img/precios/titanic.jpg": "sha256-k0XhWs/yLIkFvXn8RxBO3tKRgWpYQQHTjwrxB/oD8ng=",
  "img/precios/twitch.jpg": "sha256-a7VwY8UCqJwaVKuFR8EwYfQ8MS9wzuXAyfZRrTpq6Ng=",
  "img/precios/twitter.jpg": "sha256-RKAZMiGK7/G5O68A8T7+9NkAg9irOrnJj3gZV1sl9n8=",
  "img/precios/virgin.jpg": "sha256-O03cTrdlC/Y2NDRDT6CHt8wkUWtEXH8CnIOmSMHwrI0=",
  "img/precios/visionpro.jpg": "sha256-A9mVX9YDe8urYmRh5DlflMSk4Gqr6xCiv7JreLQ9zpI=",
  "img/precios/webb.jpg": "sha256-J1ljC0C9TKex5QtEWpeZ7Nw5dufmvcNNfPVTfP8Q6i4=",
  "img/precios/wholefoods.jpg": "sha256-wKNqUbGU/mfDmqmhPr/qQ0lzBLUDKmM0F6tSTgN4RlA=",
  "img/precios/wii.jpg": "sha256-LjUZ1E7qThQS10SHYKx3wkueEP9u/qwnTQjHSEERmqc=",
  "img/precios/youtube.jpg": "sha256-Tpx6EkkuaaO5hdbxe5fq0Qhj8scA8YCyz17ZZNlkfHY="
};
const resource = (path) => new Request(new URL(path, self.registration.scope).href, { cache: 'reload', integrity: INTEGRITY[path] || '' });
/* Las actualizaciones esperan a cerrar la app o a pulsar «Actualizar» en el menú. */
self.addEventListener('install', (e) => e.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(ESSENTIAL.map(resource))).catch(async (error) => { await caches.delete(VERSION); throw error; })));
async function status(client) {
  const cache = await caches.open(VERSION);
  const present = await Promise.all(OPTIONAL.map((file) => cache.match(new URL(file, self.registration.scope).href)));
  if (client) client.postMessage({ type: 'OFFLINE_STATUS', version: VERSION, images: present.filter(Boolean).length, total: OPTIONAL.length });
}
let warming = null;
async function warm(client) {
  if (!warming) warming = (async () => {
    const cache = await caches.open(VERSION), queue = OPTIONAL.slice();
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const file = queue.pop(), url = new URL(file, self.registration.scope).href;
        if (await cache.match(url)) continue;
        try { const response = await fetch(resource(file)); if (response.ok) await cache.put(url, response); } catch (ignored) {}
      }
    }));
  })().finally(() => { warming = null; });
  await warming; await status(client);
}
self.addEventListener('message', (e) => {
  if (!e.data) return;
  if (e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data.type === 'OFFLINE_STATUS') e.waitUntil(status(e.source));
  if (e.data.type === 'WARM_IMAGES') e.waitUntil(warm(e.source));
});
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
    const saved = await fallback();
    if (saved) return saved;
    const path = FILES.find((file) => new URL(file, self.registration.scope).href === url.href);
    /* Un script ausente nunca se sustituye por el de otra publicación. */
    if (ESSENTIAL.includes(path)) return Response.error();
    try {
      const response = await fetch(resource(path));
      if (!response.ok) return (await fallback()) || response;
      try { await cache.put(url.href, response.clone()); } catch (ignored) { /* Sin espacio: se conserva la respuesta de red. */ }
      return response;
    } catch (error) {
      return Response.error();
    }
  })());
});
