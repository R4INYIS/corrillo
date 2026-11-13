/* Modo fiesta: encadena rondas cortas de varios juegos con una única lista de jugadores. */
(function (C) {
  const { h, btn } = C;
  C.register({
    id: 'fiesta', name: 'Modo fiesta', emoji: '🎉', color: '#ffc93c', group: 'especial', hidden: true, min: 2,
    tag: 'Una ronda de cada juego, sin volver al menú.',
    how: [
      'Apunta a los jugadores una sola vez y elige qué juegos entran en la rotación.',
      'Se juegan unas pocas tarjetas o turnos de un juego y se pasa al siguiente automáticamente.',
      'Cada juego usa sus ajustes guardados. El interruptor de picante se aplica a toda esta fiesta.',
      'Puedes saltar al siguiente juego en cualquier momento.',
      'La fiesta sigue hasta que salgáis.',
    ],
    catsTitle: 'Juegos de la fiesta',
    get cats() { return C.games.filter((g) => g.party).map((g) => ({ id: g.id, label: g.emoji + ' ' + g.name })); },
    settings: [
      { key: 'limit', label: 'Tarjetas o turnos por juego', type: 'step', def: 5, min: 2, max: 15 },
      { key: 'order', label: 'Orden', type: 'select', def: 'azar', options: [['azar', 'Al azar'], ['lista', 'En orden']] },
      { key: 'spicy', label: 'Contenido picante 🌶️ +18', type: 'toggle', def: false, help: 'Activa las categorías picantes en todos los juegos de esta fiesta. Desactivado también evita la regla y los castigos de beber. Las tarjetas propias conservan el tono que hayáis escrito.' },
    ],
    validate: (s, n) => (s.cats.filter((id) => C.canPlay(C.games.find((g) => g.id === id), n, s.spicy)).length < 2 ? 'Elige al menos dos juegos disponibles con ' + n + ' jugadores y estas categorías.' : null),
    preview(s, n) {
      return h('details', { class: 'party-preview how' }, h('summary', null, 'Así será la fiesta (' + s.cats.length + ' juegos)'),
        h('p', { class: 'muted small' }, s.spicy ? 'Picante activado 🌶️ +18' : 'Categorías picantes y beber desactivados'),
        h('ul', null, s.cats.map((id) => {
          const g = C.games.find((it) => it.id === id), ok = C.canPlay(g, n, s.spicy), settings = C.partySettings(g, n, s.spicy);
          const labels = (g.cats || []).concat(C.hasCustom(g) ? [{ id: 'custom', label: '✏️ Propias' }] : []).filter((cat) => settings.cats.includes(cat.id)).map((cat) => cat.label);
          return h('li', { class: ok ? '' : 'muted' }, g.emoji + ' ' + g.name + (ok ? '' : ' · No disponible'), ok && h('small', null, labels.join(' · ')));
        })));
    },

    play(ctx) {
      const s = ctx.s;
      C.partySpicy = s.spicy;
      ctx.onExit(() => { delete C.partySpicy; });
      let list = s.cats.map((id) => C.games.find((g) => g.id === id)).filter((g) => C.canPlay(g, ctx.players.length, s.spicy));
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
