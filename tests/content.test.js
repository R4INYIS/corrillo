const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { loadApp, ROOT } = require('./helpers');

test('todos los bancos conservan su formato y no tienen duplicados dentro de una categoría', () => {
  const { C } = loadApp();
  const fields = { impostor: 2, impostorPares: 2, mentiroso: 2, prefieres: 2, invento: 3, apuesto: 2, prohibidas: 2, conocemos: 3, onda: 2 };
  for (const [bank, value] of Object.entries(C.content)) {
    if (bank === 'creditos') continue;
    const categories = bank === 'verdadreto' ? Object.entries(value).flatMap(([kind, cats]) => Object.entries(cats).map(([cat, items]) => [kind + ':' + cat, items])) : Array.isArray(value) ? [['pares', value]] : Object.entries(value);
    for (const [cat, items] of categories) {
      assert.ok(Array.isArray(items), bank + ':' + cat);
      assert.equal(new Set(items.map((it) => JSON.stringify(it))).size, items.length, 'Duplicados en ' + bank + ':' + cat);
      for (const it of items) {
        if (['cifras', 'estimaciones', 'precios'].includes(bank)) {
          assert.equal(it.length, bank === 'cifras' ? 8 : bank === 'estimaciones' ? 5 : it[7] ? 8 : 7);
          assert.equal(typeof it[0], 'string'); assert.ok(Number.isFinite(it[1]) && it[1] >= 0 && it[1] <= 1e12);
          if (bank === 'cifras') { assert.equal(typeof it[3], 'string'); assert.ok(Number.isFinite(it[4]) && it[4] >= 0 && it[4] <= 1e12); }
          if (bank === 'precios' && it[7]) assert.ok(fs.existsSync(path.join(ROOT, it[7])), it[7]);
        } else {
          assert.equal(typeof it, 'string'); assert.ok(it.trim().length > 0);
          if (fields[bank]) { assert.equal(it.split('|').length, fields[bank], it); assert.ok(it.split('|').every((s) => s.trim()), it); }
          if (bank === 'invento') assert.match(it, /^[VF]\|/);
          if (bank === 'prohibidas') assert.equal(it.split('|')[1].split(',').length, 5, it);
          if (bank === 'apuesto') assert.ok(Number.isFinite(Number(it.split('|')[1])) && Number(it.split('|')[1]) >= 0, it);
        }
      }
    }
  }
});

test('todos los datos factuales tienen referencia, fecha, contexto y precisión', () => {
  const { C } = loadApp();
  const size = (bank) => Object.values(C.content[bank]).flat().length;
  assert.equal(size('cifras'), 60);
  assert.equal(size('estimaciones'), 54);
  assert.equal(size('invento'), 94);
  assert.equal(size('quienlodijo'), 86);
  assert.equal(size('castigos'), 66);
  assert.equal(C.sources.length, 338);
  for (const bank of ['cifras', 'estimaciones', 'precios', 'invento']) {
    for (const item of Object.values(C.content[bank]).flat()) {
      const questions = bank === 'cifras' ? [item[0], item[3]] : bank === 'invento' ? [item.split('|')[1]] : [item[0]];
      questions.forEach((question) => assert.equal(C.sources.filter((source) => source.bank === bank && source.question === question).length, 1, question));
    }
  }
  for (const items of Object.values(C.content.invento)) {
    const truth = items.filter((item) => item.startsWith('V|')).length / items.length;
    assert.ok(truth >= .45 && truth <= .55, 'V/F equilibrado: ' + truth);
  }
  for (const source of C.sources) {
    const questions = Object.values(C.content[source.bank]).flat().flatMap((it) => source.bank === 'cifras' ? [it[0], it[3]] : source.bank === 'invento' ? [it.split('|')[1]] : [it[0]]);
    assert.ok(questions.includes(source.question), source.question);
    assert.match(source.checked, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(source.urls.length);
    assert.ok(source.asof && source.precision, source.question);
    source.urls.forEach((url) => assert.equal(new URL(url).protocol, 'https:'));
  }
});

test('el catálogo cubre los 28 juegos y todas las categorías seleccionables contienen datos', () => {
  const { C } = loadApp();
  assert.equal(C.games.filter((g) => !g.hidden).length, 28);
  for (const g of C.games) {
    if (!g.hidden) assert.ok(C.catalog[g.id], g.id);
    if (g.id === 'fiesta' || !g.cats) continue;
    for (const cat of g.cats) {
      const decks = C.decks(g, { ...C.loadCfg(g).s, cats: [cat.id] });
      assert.ok(decks.some((d) => d.pool.length), g.id + ':' + cat.id);
    }
  }
});

test('la caché incluye scripts, estilos, manifest, iconos y todas las fotos y créditos', () => {
  const { C } = loadApp();
  const ctx = { URL, Set, self: { registration: { scope: 'https://example.test/corrillo/' }, addEventListener() {} } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8') + '\nglobalThis.files = FILES;', ctx);
  const files = Array.from(ctx.files);
  assert.equal(new Set(files).size, files.length);
  files.forEach((file) => assert.ok(fs.existsSync(path.join(ROOT, file)), file));
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const [, src] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) assert.ok(files.includes(src), src);
  C.content.creditos.forEach(([src]) => assert.ok(files.includes(src), src));
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  manifest.icons.forEach(({ src }) => assert.ok(files.includes(src), src));
  const code = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const integrity = JSON.parse(code.match(/const INTEGRITY = (\{[\s\S]*?\});/)[1]);
  for (const file of files) {
    const bytes = fs.readFileSync(path.join(ROOT, file === './' ? 'index.html' : file));
    assert.equal(integrity[file], 'sha256-' + crypto.createHash('sha256').update(bytes).digest('base64'), 'Regenerar node tools/offline.cjs: ' + file);
  }
});
