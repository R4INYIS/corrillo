(function (C) {
  const { h, btn } = C;
  C.register({
    id: 'espia', custom: { bank: 'espia', hint: 'Un lugar por línea. Ej.: La cafetería de Ciencias' }, name: 'El Espía', emoji: '🕶️', color: '#ff9a3d', group: 'deduccion', min: 3,
    tag: 'Todos saben dónde están, excepto el espía.',
    how: [
      'Cada jugador mira su carta en privado: todos ven el mismo lugar, salvo el espía.',
      'Por turnos, haceos preguntas sobre el lugar («¿vienes aquí a menudo?», «¿qué llevas puesto?»).',
      'El espía intenta deducir el lugar sin delatarse; los demás intentan descubrirlo sin dar demasiadas pistas.',
      'Al acabar el tiempo, votad. El espía puede salvarse si adivina el lugar.',
    ],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'ciudad', label: 'En la ciudad' }, { id: 'viajes', label: 'Viajes y ocio' }, { id: 'trabajo', label: 'Trabajo y estudios' }, { id: 'espana', label: '🇪🇸 Muy de España' }, { id: 'fantasia', label: 'Sitios raros' }],
    settings: [
      { key: 'spies', label: 'Espías', type: 'step', def: 1, min: 1, max: (n) => Math.max(1, Math.floor((n - 1) / 2)) },
      { key: 'duration', label: 'Tiempo de partida', type: 'select', def: 300, options: [[0, 'Sin límite'], [180, '3 min'], [300, '5 min'], [480, '8 min']] },
    ].concat(C.infiltratorSettings(true)),
    validate: (s, n) => (s.spies * 2 >= n ? 'Demasiados espías para ' + n + ' jugadores.' : null),

    play(ctx) {
      const P = ctx.players, s = ctx.s;
      const pool = C.pool(C.content.espia, s.cats), place = C.draw('espia', pool);
      const spies = C.shuffle(P.map((_, i) => i)).slice(0, s.spies);
      const options = C.shuffle(C.shuffle(pool.filter((x) => x !== place)).slice(0, 15).concat(place));
      return C.playInfiltrators(ctx, { spy: true, word: place, infiltrators: spies, options });
    },
  });
})(Corrillo);
