/* Mantenimiento: node tools/catalogue.cjs. Conserva IDs existentes y añade alias editoriales. */
const fs = require('node:fs');
const path = require('node:path');
const { loadApp, ROOT } = require('../tests/helpers');
const { C } = loadApp();
const hash = (item) => {
  const text = typeof item === 'string' ? item : JSON.stringify(item);
  let n = 5381;
  for (let i = 0; i < text.length; i++) n = ((n << 5) + n + text.charCodeAt(i)) | 0;
  return n.toString(36);
};
const rows = (C.stableCards || []).map((row) => row.slice()), index = new Map();
rows.forEach((row) => row.slice(1).forEach((key) => index.set(key, row)));
let serial = Math.max(0, ...rows.map((row) => Number(row[0].slice(1))));
function ensure(item) {
  const key = hash(item);
  if (!index.has(key)) {
    const row = ['c' + String(++serial).padStart(5, '0'), key]; rows.push(row); index.set(key, row);
  }
  return index.get(key);
}
function visit(value) {
  if (Array.isArray(value)) {
    value.forEach((item) => { if (typeof item === 'string' || Array.isArray(item)) ensure(item); });
  } else if (value && typeof value === 'object') Object.values(value).forEach(visit);
}
visit(C.content);
for (const pair of C.unique(Object.values(C.content.cifras).flat())) {
  ensure(pair[0]); ensure(pair[3]);
  ensure([pair[0], pair[1], pair[2], pair[6], pair[7]]);
  ensure([pair[3], pair[4], pair[5], pair[6], pair[7]]);
}
for (const item of C.unique(Object.values(C.content.estimaciones).flat()).concat(C.unique(Object.values(C.content.precios).flat()))) ensure(item[0]);
for (const item of C.unique(Object.values(C.content.invento).flat())) ensure(item.split('|')[1]);
for (const [before, after] of C.cardAliases || []) {
  const row = ensure(before), alias = hash(after), previous = index.get(alias);
  if (previous && previous !== row) {
    for (const key of previous) { if (!row.includes(key)) row.push(key); index.set(key, row); }
    rows.splice(rows.indexOf(previous), 1);
  }
  if (!row.includes(alias)) row.push(alias);
  index.set(alias, row);
}
fs.writeFileSync(path.join(ROOT, 'js/content/identities.js'), '/* IDs permanentes. Los hashes siguientes son alias para migrar historiales antiguos. No renumerar. */\nCorrillo.stableCards = ' + JSON.stringify(rows, null, 0).replace(/\],\[/g, '],\n[') + ';\n');
console.log(rows.length + ' identificadores conservados o añadidos.');
