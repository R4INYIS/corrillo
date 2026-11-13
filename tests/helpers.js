const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');

function loadApp(initial = {}) {
  const values = new Map(Object.entries(initial));
  const storage = {
    get length() { return values.size; },
    key(i) { return Array.from(values.keys())[i]; },
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
  const context = { localStorage: storage, navigator: {}, location: { protocol: 'file:' }, document: { addEventListener() {} }, addEventListener() {}, setTimeout, clearTimeout, setInterval, clearInterval, URL, Blob };
  context.window = context;
  vm.createContext(context);
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) vm.runInContext(fs.readFileSync(path.join(ROOT, src), 'utf8'), context, { filename: src });
  context.Corrillo.loadCustom();
  return { C: context.Corrillo, storage, context, values };
}
module.exports = { loadApp, ROOT };
