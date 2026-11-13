const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadApp } = require('./helpers');
const plain = (value) => JSON.parse(JSON.stringify(value));

test('primeros empatados ganan salvo empate total, incluso con ceros y negativos', () => {
  const { C } = loadApp();
  for (const [points, winners] of [[[3, 3, 1], ['A', 'B']], [[0, 0, -1], ['A', 'B']], [[-1, -1, -2], ['A', 'B']], [[0, 0, 0], []], [[-1, -1, -1], []]]) {
    assert.deepEqual(plain(C.ranking(['A', 'B', 'C'], points).winners), winners);
  }
  assert.deepEqual(plain(C.ranking(['A', 'B'], [1, 2], true).winners), ['A']);
});

test('resultados incompletos y cooperativos no suman; un resultado completo se suma una sola vez', () => {
  const { C } = loadApp(), ctx = { resultRecorded: false };
  C.recordOutcome(ctx, ['Ana', 'Luis'], [-1, -2], { complete: false });
  assert.equal(C.nightRows().size, 0);
  C.recordOutcome(ctx, ['Ana', 'Luis'], [-1, -2]);
  C.recordOutcome(ctx, ['Ana', 'Luis'], [-1, -2]);
  assert.equal(C.nightRows().get('ana').wins, 1);
  C.recordOutcome({ resultRecorded: false }, ['Grupo'], [10], { type: 'cooperative' });
  assert.equal(C.nightRows().size, 1);
});

test('la victoria de equipo se atribuye a sus integrantes, nunca a un nombre artificial', () => {
  const { C } = loadApp();
  const teams = C.teamsOf(['A', 'B', 'C', 'D', 'E'], { teamCount: 2 });
  C.recordOutcome({}, teams.map((t) => t.name), [-1, -2], { teams });
  assert.deepEqual(Array.from(C.nightRows().keys()).sort(), ['a', 'c', 'e']);
});

test('equipos impares tienen iguales turnos y rotan portavoces independientemente', () => {
  const { C } = loadApp();
  for (const count of [4, 5, 7, 9, 20]) {
    const players = Array.from({ length: count }, (_, i) => 'P' + i), teams = C.teamsOf(players, { teamCount: 2 });
    const turns = Array.from({ length: 12 }, (_, t) => C.teamTurn(teams, t));
    assert.equal(turns.filter((t) => t.side === 0).length, 6);
    assert.equal(turns.filter((t) => t.side === 1).length, 6);
    turns.forEach((turn) => assert.ok(teams[turn.side].indices.includes(turn.player)));
  }
  assert.equal(C.teamsOf(Array(9).fill('P'), { teamCount: 3 }).length, 3);
  assert.ok(C.teamProblem(['A', 'B', 'C', 'D'], { teamCount: 2, teamMap: [0, 0, 0, 1] }));
});

test('el azar favorece a los menos usados pero conserva opciones y excluye al ejecutante', () => {
  const { C, context } = loadApp();
  vm.runInContext('Math.random = () => 0.999999999', context);
  assert.equal(C.weightedRole([0, 0, 10]), 2, 'el papel más usado conserva una probabilidad positiva');
  let seed = 17;
  context.nextRandom = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  vm.runInContext('Math.random = nextRandom', context);
  const tally = [0, 0, 0];
  for (let i = 0; i < 10000; i++) tally[C.weightedRole([0, 0, 5])]++;
  assert.ok(tally[0] > 4000 && tally[1] > 4000 && tally[2] > 0 && tally[2] < 100);
  for (let i = 0; i < 100; i++) assert.notEqual(C.weightedRole([1, 1, 1], 1), 1);
});

test('Apuesto promedia ambos porcentajes en vez de sumar oportunidades desiguales', () => {
  const { C } = loadApp();
  assert.deepEqual(plain(C.apuestoScore([2, 4], [3, 2], [1, 2], [3, 2])), [75, 75]);
});

test('sin supervivientes Lobos no otorga victoria al pueblo', () => {
  const { C } = loadApp();
  assert.equal(C.lobosWinner(0, 0), 'none');
  assert.equal(C.lobosWinner(2, 0), 'pueblo');
  assert.equal(C.lobosWinner(4, 2), 'lobos');
  assert.equal(C.lobosWinner(5, 2), null);
});

test('la entrada numérica admite formato español sin aceptar texto, infinito o separadores inválidos', () => {
  const { C } = loadApp();
  for (const [text, value] of [['5', 5], ['499', 499], ['1.234.567', 1234567], ['2.500,5', 2500.5], ['0,25', .25]]) assert.equal(C.parseNumber(text), value);
  for (const text of ['', 'Infinity', '1.2.3', 'abc', '1,2,3']) assert.ok(Number.isNaN(C.parseNumber(text)));
});

test('invitado aísla nombres, marcador e historial y recupera los datos anteriores al salir', () => {
  const { C, storage } = loadApp();
  C.store.set('night', { Ana: 2 });
  C.store.set('last', ['Ana']);
  C.setGuest(true);
  assert.deepEqual(plain(C.store.get('night', {})), {});
  assert.equal(C.store.get('last', null), null);
  C.nightAdd(['Luis']); C.store.set('last', ['Luis']);
  assert.equal(JSON.parse(storage.getItem('corrillo:night')).Ana, 2);
  assert.deepEqual(plain(C.store.get('last')), ['Luis']);
  C.setGuest(false);
  assert.deepEqual(plain(C.store.get('last')), ['Ana']);
  assert.equal(C.nightRows().has('luis'), false);
});

test('el historial factual migra hashes antiguos, une paráfrasis y permite reiniciar sin reimportar', () => {
  const old = loadApp().C;
  const pair = Object.values(old.content.cifras).flat().find((item) => item[0].includes('municipios'));
  const previous = old.cardAliases.find(([before, after]) => Array.isArray(before) && before.length === 8 && JSON.stringify(after) === JSON.stringify(pair))[0];
  const { C } = loadApp({ 'corrillo:used:cifras': JSON.stringify([old.legacyId(previous)]) });
  const everest = Object.values(C.content.cifras).flat().flatMap((item) => [[item[0], item[1], item[2], item[6], item[7]], [item[3], item[4], item[5], item[6], item[7]]]).filter((item) => item[0].includes('Everest'));
  assert.equal(C.unplayed('subasta', everest), 0, 'el dato visto con otra redacción también se reconoce');
  C.forget('subasta'); C.resetDeckMemory();
  assert.equal(C.unplayed('subasta', everest), 2, 'el reinicio expreso no importa otra vez el historial anterior');
  C.draw('aojo', [everest[0]]); C.commit();
  assert.equal(C.unplayed('cifras', [pair]), 0);
  C.store.set('sharedFacts', false);
  assert.equal(C.unplayed('subasta', [everest[1]]), 1, 'la alternativa independiente se conserva');
});

test('la exportación invitada recoge su sesión y conserva las nuevas claves al restaurar', () => {
  const { C, storage } = loadApp();
  C.store.set('last', ['NombreAnterior']); C.setGuest(true);
  C.store.set('last', ['Invitado']); C.store.set('vibration', false); C.store.set('sharedFacts', false);
  C.store.set('filters', ['materials']); C.store.set('hiddenCards', ['c00001']);
  C.store.set('groups', [{ name: 'Grupo', players: ['Invitado'] }]);
  C.store.set('feedback', [{ id: 'c00001', game: 'Juego', reason: 'Error', comment: '', date: new Date().toISOString() }]);
  const backup = C.exportData(), restored = loadApp().C;
  assert.equal(JSON.stringify(backup).includes('NombreAnterior'), false);
  restored.importData(backup);
  assert.deepEqual(plain(restored.store.get('last')), ['Invitado']);
  assert.deepEqual(plain(restored.store.get('groups')), [{ name: 'Grupo', players: ['Invitado'] }]);
  assert.equal(restored.store.get('vibration'), false);
  assert.equal(restored.store.get('feedback').length, 1);
  assert.equal(JSON.parse(storage.getItem('corrillo:last'))[0], 'NombreAnterior');
});

test('los filtros y tarjetas ocultas no se ignoran al agotar el mazo', () => {
  const { C } = loadApp();
  const safe = 'Reto inventado|0', contact = 'Abraza a alguien|0';
  C.content.apuesto.prueba = [safe, contact]; C.invalidateCatalogue();
  C.store.set('filters', ['contact']);
  assert.equal(C.draw('apuesto', [safe, contact]), safe); C.commit();
  assert.equal(C.draw('apuesto', [safe, contact]), safe);
  C.store.set('hiddenCards', [C.cardId(safe)]);
  assert.throws(() => C.draw('apuesto', [safe, contact]), C.NoCards);
});

test('reservar un mazo especial no consume cartas sin mostrar ni repite elementos', () => {
  const { C } = loadApp();
  const cards = C.selectCards('ranking', ['A', 'B', 'C', 'D'], 4);
  assert.equal(new Set(cards).size, 4);
  C.commit();
  assert.equal(C.unplayed('ranking', cards), 4);
  C.offer('ranking', cards[0]); C.commit();
  assert.equal(C.unplayed('ranking', cards), 3);
  C.store.set('hiddenCards', [C.cardId(cards[1])]);
  assert.equal(C.selectCards('ranking', cards, 4).includes(cards[1]), false);
});
