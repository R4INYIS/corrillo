/* Modo fiesta: encadena rondas cortas de varios juegos con una única lista de jugadores. */
(function (C) {
  const { h, btn } = C;
  C.register({
    id: 'fiesta', name: 'Modo fiesta', emoji: '🎉', color: '#ffc93c', group: 'especial', hidden: true, min: 2,
    tag: 'Una ronda de cada juego, sin volver al menú.',
    how: [
      'Apunta a los jugadores una sola vez y elige qué juegos entran en la rotación.',
      'Se juegan unas pocas tarjetas o turnos de un juego y se pasa al siguiente automáticamente.',
      'Cada juego usa los ajustes y categorías que tenga guardados en su propia pantalla.',
      'La fiesta sigue hasta que salgáis.',
    ],
    catsTitle: 'Juegos de la fiesta',
    get cats() { return C.games.filter((g) => g.party).map((g) => ({ id: g.id, label: g.emoji + ' ' + g.name })); },
    settings: [
      { key: 'limit', label: 'Tarjetas o turnos por juego', type: 'step', def: 5, min: 2, max: 15 },
      { key: 'order', label: 'Orden', type: 'select', def: 'azar', options: [['azar', 'Al azar'], ['lista', 'En orden']] },
    ],
    validate: (s, n) => (s.cats.filter((id) => C.canPlay(C.games.find((g) => g.id === id), n)).length < 2 ? 'Elige al menos dos juegos que admitan ' + n + ' jugadores.' : null),

    play(ctx) {
      const s = ctx.s;
      let list = s.cats.map((id) => C.games.find((g) => g.id === id)).filter((g) => C.canPlay(g, ctx.players.length));
      if (s.order === 'azar') list = C.shuffle(list);
      let i = 0;
      (function next() {
        if (!ctx.alive) return;
        const g = list[i++ % list.length];
        ctx.setTitle('🎉 Modo fiesta', g.color);
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, 'Siguiente juego'), h('div', { class: 'big-emoji' }, g.emoji), h('h2', null, g.name), h('p', { class: 'lead' }, g.tag),
          btn('¡Vamos!', () => C.sub(ctx, g, s.limit, next), 'primary big')));
      })();
    },
  });
})(Corrillo);
