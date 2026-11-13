const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { ROOT } = require('./helpers');
const SCOPE = 'https://example.test/corrillo/';
function worker(fetcher) {
  const handlers = {}, saved = new Map(), deleted = [], state = { skipped: 0, claimed: 0, failPut: false };
  const cache = {
    async match(key) { return saved.get(String(key))?.clone(); },
    async put(key, response) { if (state.failPut) throw new Error('quota'); saved.set(String(key), response); },
    async addAll() {},
  };
  const context = {
    URL, Set, Response, Request, fetch: fetcher,
    caches: { open: async () => cache, keys: async () => ['corrillo-v0', context.cacheVersion, 'otra-app'], delete: async (key) => deleted.push(key) },
    self: { registration: { scope: SCOPE }, addEventListener: (name, fn) => (handlers[name] = fn), skipWaiting: () => state.skipped++, clients: { claim: async () => state.claimed++ } },
  };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8') + '\nglobalThis.cacheVersion = VERSION;', context);
  async function request(file, mode = 'cors') {
    let result;
    handlers.fetch({ request: { method: 'GET', url: new URL(file, SCOPE).href, mode }, respondWith: (promise) => (result = promise) });
    return result;
  }
  return { handlers, saved, deleted, state, request };
}

test('un error HTTP conserva la copia buena y la devuelve', async () => {
  const w = worker(async () => new Response('error', { status: 503 }));
  w.saved.set(SCOPE + 'css/styles.css', new Response('css correcto'));
  const response = await w.request('css/styles.css?version=1');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'css correcto');
  assert.equal(await w.saved.get(SCOPE + 'css/styles.css').text(), 'css correcto');
});

test('sin copia, un script no se sustituye por otra publicación de la red', async () => {
  const w = worker(async () => new Response('error', { status: 503 }));
  assert.equal((await w.request('js/core/core.js')).type, 'error');
  assert.equal(w.saved.size, 0);
});

test('sin conexión se devuelve HTML solo para navegación, nunca para un script', async () => {
  const w = worker(async () => { throw new Error('offline'); });
  w.saved.set(SCOPE + 'index.html', new Response('<html>app</html>'));
  assert.equal(await (await w.request('./', 'navigate')).text(), '<html>app</html>');
  assert.equal((await w.request('js/core/core.js')).type, 'error');
  assert.equal(await w.request('https://otra.test/file.js'), undefined);
  assert.equal(await w.request('desconocido.js'), undefined);
});

test('un fallo al escribir la caché no impide usar una respuesta válida', async () => {
  const w = worker(async () => new Response('nuevo'));
  w.state.failPut = true;
  assert.equal(await (await w.request('img/precios/ps5.jpg')).text(), 'nuevo');
});

test('activar borra solo versiones antiguas de Corrillo y la actualización espera', async () => {
  const w = worker(async () => new Response('ok'));
  let task;
  w.handlers.install({ waitUntil: (promise) => (task = promise) }); await task;
  assert.equal(w.state.skipped, 0);
  w.handlers.activate({ waitUntil: (promise) => (task = promise) }); await task;
  assert.deepEqual(w.deleted, ['corrillo-v0']);
  assert.equal(w.state.claimed, 1);
  w.handlers.message({ data: { type: 'SKIP_WAITING' } });
  assert.equal(w.state.skipped, 1);
});
