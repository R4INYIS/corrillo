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
    ],
    validate: (s, n) => (s.spies * 2 >= n ? 'Demasiados espías para ' + n + ' jugadores.' : null),

    play(ctx) {
      const P = ctx.players, s = ctx.s;
      const pool = C.pool(C.content.espia, s.cats), place = C.draw('espia', pool);
      const spies = C.shuffle(P.map((_, i) => i)).slice(0, s.spies);
      const options = C.shuffle(C.shuffle(pool.filter((x) => x !== place)).slice(0, 15).concat(place));

      C.pass(ctx, P, (p, i) => spies.includes(i)
        ? C.secret('🕶️', 'Tu papel', 'Eres el espía', 'No sabes dónde estáis. Averígualo sin que se note.')
        : C.secret('📍', 'Estáis en', place, 'Hay un espía entre vosotros.'), talk, { lastLabel: 'Ocultar y empezar' });

      function talk() {
        const clock = s.duration ? C.clock(ctx, s.duration) : null;
        ctx.show(h('div', { class: 'center' }, clock ? clock.el : h('div', { class: 'big-emoji' }, '❓'),
          h('p', { class: 'lead' }, 'Empieza preguntando ' + C.pick(P) + '.'),
          h('p', { class: 'muted' }, 'Quien responde hace la siguiente pregunta a otro jugador.'),
          h('details', { class: 'card how' }, h('summary', null, 'Lugares posibles'), h('p', { class: 'muted small' }, options.join(' · '))),
          btn('Terminar y votar', () => { clock && clock.stop(); vote(); }, 'primary big')));
      }
      function vote() {
        ctx.show(h('div', { class: 'center' }, h('h2', null, '¿Quién es el espía?'), h('p', { class: 'muted' }, 'Votad a mano alzada y marcad al más votado.'),
          C.pickGrid(P, (i) => reveal(i), btn('Revelar sin votar', () => reveal(-1), 'wide'))));
      }
      function reveal(acc) {
        const hit = spies.includes(acc);
        ctx.show(h('div', { class: 'center' },
          acc >= 0 && h('h2', null, hit ? '¡Descubierto!' : P[acc] + ' no era el espía'),
          acc >= 0 && h('p', { class: 'lead' }, hit ? 'Al espía le queda una bala: si adivina el lugar, gana.' : 'Gana el espía.'),
          C.secret('🕶️', s.spies > 1 ? 'Los espías eran' : 'El espía era', spies.map((i) => P[i]).join(', '), 'El lugar era: ' + place),
          acc >= 0 && C.penalty(hit ? P[acc] : P[acc]),
          ctx.endBar('Otra ronda')));
      }
    },
  });
})(Corrillo);
