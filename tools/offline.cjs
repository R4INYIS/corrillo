/* node tools/offline.cjs: fija los bytes de cada recurso de una publicación. No compila la web. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..'), worker = path.join(root, 'sw.js');
let source = fs.readFileSync(worker, 'utf8');
const context = { URL, Set, self: { registration: { scope: 'https://example.test/corrillo/' }, addEventListener() {} } };
vm.createContext(context);
vm.runInContext(source + '\nglobalThis.files = FILES;', context);
const integrity = Object.fromEntries(Array.from(context.files, (file) => {
  const target = path.join(root, file === './' ? 'index.html' : file);
  let bytes = fs.readFileSync(target);
  if (/\.(?:html|css|js|webmanifest|svg)$/.test(target)) {
    const normalized = bytes.toString('utf8').replace(/\r\n/g, '\n');
    if (normalized !== bytes.toString('utf8')) fs.writeFileSync(target, normalized);
    bytes = Buffer.from(normalized, 'utf8');
  }
  return [file, 'sha256-' + crypto.createHash('sha256').update(bytes).digest('base64')];
}));
source = source.replace(/const INTEGRITY = \{[\s\S]*?\};/, 'const INTEGRITY = ' + JSON.stringify(integrity, null, 2) + ';');
fs.writeFileSync(worker, source);
console.log(Object.keys(integrity).length + ' recursos fijados para la versión offline.');
