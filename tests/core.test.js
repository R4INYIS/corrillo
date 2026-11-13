const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers');
const json = (v) => JSON.parse(JSON.stringify(v));

test('los ajustes se limitan por los jugadores incluso al abrir una configuración antigua', () => {
  const { C } = loadApp();
  for (const [id, setting] of [['impostor', 'impostors'], ['mentiroso', 'liars'], ['cifras', 'impostors'], ['lobos', 'wolves']]) {
    const g = C.games.find((it) => it.id === id);
    C.store.set('cfg:' + id, { players: ['', '', ''], s: { [setting]: 8 } });
    assert.equal(C.loadCfg(g).s[setting], 1, id);
  }
});

test('una tarjeta solo persiste al completarla; saltar y abandonar la dejan disponible', () => {
  const { C, storage } = loadApp();
  const pool = ['A', 'B', 'C'];
  const first = C.draw('test', pool);
  assert.equal(C.unplayed('test', pool), 3);
  C.skip('test'); C.commit();
  assert.equal(C.unplayed('test', pool), 3);
  const second = C.draw('test', pool);
  assert.notEqual(first, second);
  C.commit();
  assert.equal(C.unplayed('test', pool), 2);
  C.draw('test', pool); C.discard(); C.commit();
  assert.equal(C.unplayed('test', pool), 2);
  const again = loadApp(Object.fromEntries(Array.from({ length: storage.length }, (_, i) => { const key = storage.key(i); return [key, storage.getItem(key)]; }))).C;
  assert.equal(again.unplayed('test', pool), 2);
  assert.notEqual(again.draw('test', pool), second);
});

test('agotamiento, reinicio e historial temporal no bloquean ni consumen tarjetas', () => {
  const { C } = loadApp();
  C.draw('one', ['A']); C.commit();
  assert.equal(C.unplayed('one', ['A']), 0);
  assert.equal(C.draw('one', ['A']), 'A');
  C.forget('one'); C.commit();
  assert.equal(C.unplayed('one', ['A']), 1);
  C.draw('temporary', ['A'], { keep: false }); C.commit();
  assert.deepEqual(json(C.store.get('used:temporary', [])), []);
});

test('una tarjeta compartida por dos categorías no recibe el doble de peso', () => {
  const { C } = loadApp();
  assert.deepEqual(json(C.pool({ a: ['A', 'B'], b: ['A', 'C'] }, ['a', 'b'])), ['A', 'B', 'C']);
});

test('el marcador migra mayúsculas y espacios, permite correcciones y nombres de propiedades', () => {
  const { C } = loadApp();
  C.store.set('night', { Ana: 2, ' ana ': 3, 'Ana  María': 1, 'ana maría': 2 });
  C.nightAdd(['ANA', ' ana ', '__proto__']);
  const rows = C.nightRows();
  assert.equal(rows.get('ana').wins, 6);
  assert.equal(rows.get('ana maría').wins, 3);
  assert.equal(rows.get('__proto__').wins, 1);
  C.nightAdjust('Ana', -1);
  assert.equal(C.nightRows().get('ana').wins, 5);
  C.nightAdjust('__proto__', -10);
  assert.equal(C.nightRows().get('__proto__').wins, 0);
});

test('el picante de fiesta no modifica ajustes guardados y desactiva beber', () => {
  const { C } = loadApp();
  const g = C.games.find((it) => it.id === 'yonunca');
  const cfg = C.loadCfg(g);
  cfg.s.cats = ['clasico', 'picante']; cfg.s.rule = 'beber';
  C.store.set('cfg:yonunca', { ...cfg, known: g.cats.map((c) => c.id) });
  const safe = C.partySettings(g, 4, false), spicy = C.partySettings(g, 4, true);
  assert.equal(safe.cats.includes('picante'), false);
  assert.equal(safe.rule, 'dedo');
  assert.equal(spicy.cats.includes('picante'), true);
  assert.equal(C.store.get('cfg:yonunca').s.rule, 'beber');
  assert.equal(C.store.get('cfg:yonunca').s.cats.includes('picante'), true);
});

test('los filtros combinan tamaño de grupo, duración y estilo', () => {
  const { C } = loadApp();
  const games = C.games.filter((g) => !g.hidden && C.matches(g, { players: 2, minutes: 5, style: 'accion' }));
  assert.ok(games.length > 0);
  assert.equal(games.some((g) => g.min > 2), false);
  assert.equal(games.some((g) => C.catalog[g.id][1] > 5), false);
});

test('Verdad o Reto guarda, valida y restaura ambos tipos de contenido propio', () => {
  const { C } = loadApp();
  const g = C.games.find((it) => it.id === 'verdadreto');
  const value = { verdad: ['¿Cuál es tu plan favorito?'], reto: ['Imita a {j}.'] };
  C.applyCustom(g, value); C.store.set('custom:verdadreto', value);
  assert.equal(C.hasCustom(g), true);
  const backup = C.exportData();
  C.applyCustom(g, { verdad: [], reto: [] });
  C.importData(backup);
  assert.deepEqual(json(C.customValue(g)), value);
  assert.throws(() => C.parseCustom(C.games.find((it) => it.id === 'prefieres'), 'sin separador'));
});

test('la copia conserva ajustes y mazos y no incluye otras aplicaciones', () => {
  const { C, storage } = loadApp();
  storage.setItem('otra-app', 'secreto ajeno');
  const g = C.games.find((it) => it.id === 'impostor');
  C.store.set('cfg:impostor', C.loadCfg(g));
  C.draw('impostor', ['A']); C.commit();
  const config = C.loadCfg(g); config.s.mode = 'parecida';
  C.store.set('cfg:impostor', config);
  C.draw('impostor-pares', ['B|C']); C.commit();
  const backup = C.exportData();
  assert.equal(JSON.stringify(backup).includes('secreto ajeno'), false);
  const restored = loadApp();
  restored.C.importData(backup);
  assert.equal(restored.C.unplayed('impostor', ['A']), 0);
  assert.equal(restored.C.unplayed('impostor-pares', ['B|C']), 0);
  assert.deepEqual(json(restored.C.loadCfg(restored.C.games.find((it) => it.id === 'impostor')).players), ['', '', '', '']);
});

test('una copia inválida no altera datos y un fallo de espacio revierte lo escrito', () => {
  const { C, storage } = loadApp();
  C.store.set('sound', true);
  assert.throws(() => C.importData({ app: 'Corrillo', version: 1, data: { sound: false, 'cfg:impostor': { players: [], s: { cats: 'mal' } } } }));
  assert.equal(C.store.get('sound'), true);
  const original = storage.setItem;
  let failed = false;
  storage.setItem = (key, value) => { if (key === 'corrillo:night' && !failed) { failed = true; throw new Error('quota'); } original(key, value); };
  assert.throws(() => C.importData({ app: 'Corrillo', version: 1, data: { sound: false, night: { Ana: 1 } } }));
  assert.equal(C.store.get('sound'), true);
  assert.equal(C.store.get('night', null), null);
});
