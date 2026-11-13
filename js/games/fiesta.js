/* Modo fiesta: encadena rondas cortas de varios juegos con una única lista de jugadores. */
(function (C) {
  const { h, btn } = C;
  C.register({
    id: 'fiesta', name: 'Modo fiesta', emoji: '🎉', color: '#ffc93c', group: 'especial', hidden: true, min: 2,
    tag: 'Mezcla los 26 juegos sin volver al menú.',
    how: [
      'Apunta a los jugadores una sola vez y elige qué juegos entran en la rotación.',
      'Los juegos rápidos cambian tras los turnos elegidos. Los demás se juegan hasta terminar su ronda o partida.',
      'Cada juego usa sus ajustes guardados. El interruptor de picante se aplica a toda esta fiesta.',
      'Puedes saltar al siguiente juego en cualquier momento.',
      'La fiesta sigue hasta que salgáis.',
    ],
    catsTitle: 'Juegos de la fiesta',
    get cats() { return C.games.filter((g) => !g.hidden).map((g) => ({ id: g.id, label: g.emoji + ' ' + g.name, optional: !g.party })); },
    get categoryPresets() { return [
      { label: 'Todos compatibles', select: (s, n) => C.games.filter((g) => !g.hidden && C.canPlay(g, n, s.spicy)).map((g) => g.id) },
      { label: 'Solo rápidos', select: (s, n) => C.games.filter((g) => g.party && C.canPlay(g, n, s.spicy)).map((g) => g.id) },
      { label: 'Quitar todos', select: () => [] },
    ]; },
    settings: [
      { key: 'limit', label: 'Turnos por juego rápido', type: 'step', def: 5, min: 2, max: 15, help: 'En los demás juegos se completa la ronda o partida con sus ajustes guardados. Siempre puedes saltar al siguiente.' },
      { key: 'order', label: 'Orden', type: 'select', def: 'azar', options: [['azar', 'Al azar'], ['lista', 'En orden']] },
      { key: 'spicy', label: 'Contenido picante 🌶️ +18', type: 'toggle', def: false, help: 'Activa las categorías picantes en todos los juegos de esta fiesta. Desactivado también evita la regla y los castigos de beber. Las tarjetas propias conservan el tono que hayáis escrito.' },
    ],
    validate: (s, n) => (s.cats.filter((id) => C.canPlay(C.games.find((g) => g.id === id), n, s.spicy)).length < 2 ? 'Elige al menos dos juegos disponibles con ' + n + ' jugadores y estas categorías.' : null),
    preview(s, n) {
      return h('details', { class: 'party-preview how' }, h('summary', null, 'Así será la fiesta (' + s.cats.length + ' juegos)'),
        h('p', { class: 'muted small' }, s.spicy ? 'Picante activado 🌶️ +18' : 'Categorías picantes y beber desactivados'),
        h('ul', null, s.cats.map((id) => {
          const g = C.games.find((it) => it.id === id), ok = C.canPlay(g, n, s.spicy), settings = C.partySettings(g, n, s.spicy);
          const labels = (g.cats || []).concat(C.hasCustom(g) ? [{ id: 'custom', label: '✏️ Propias' }] : []).filter((cat) => (settings.cats || []).includes(cat.id)).map((cat) => cat.label);
          const format = g.party ? 'Hasta ' + s.limit + ' turnos' : g.id === 'azar' ? 'Herramienta libre: salta cuando terminéis' : 'Ronda o partida completa';
          return h('li', { class: ok ? '' : 'muted' }, g.emoji + ' ' + g.name + (ok ? '' : ' · No disponible'), ok && h('small', null, format), ok && labels.length > 0 && h('small', null, labels.join(' · ')));
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
        const format = g.party ? 'Hasta ' + s.limit + ' tarjetas o turnos.' : g.id === 'azar' ? 'Usad la herramienta y pulsad «Saltar al siguiente juego» cuando terminéis.' : 'Completad la ronda o partida; después podréis pasar al siguiente juego.';
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, 'Siguiente juego'), h('div', { class: 'big-emoji' }, g.emoji), h('h2', null, g.name), h('p', { class: 'lead' }, g.tag), h('p', { class: 'muted' }, format),
          btn('¡Vamos!', () => C.sub(ctx, g, s.limit, next), 'primary big')));
      })();
    },
  });
})(Corrillo);
