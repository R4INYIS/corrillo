/* Modo fiesta: encadena rondas cortas de varios juegos con una única lista de jugadores. */
(function (C) {
  const { h, btn } = C;
  const formatLabel = (g, s) => s.format === 'full' ? 'Partida completa con sus ajustes guardados' :
    ['cinco', 'invento', 'charadas', 'prohibidas', 'contrasena', 'onda', 'apuesto'].includes(g.id) || g.id === 'quienlodijo' && C.loadCfg(g).s.competitive || g.id === 'bomba' && C.loadCfg(g).s.format !== 'open'
      ? 'Ciclo completo con oportunidades equilibradas' : g.party ? 'Hasta ' + s.limit + ' tarjetas o turnos' : g.id === 'azar' ? 'Herramienta libre: salta cuando terminéis' : 'Ronda o partida completa';
  C.register({
    id: 'fiesta', name: 'Modo fiesta', emoji: '🎉', color: '#ffc93c', group: 'especial', hidden: true, min: 2,
    tag: 'Mezcla todo el catálogo sin volver al menú.',
    how: [
      'Apunta a los jugadores una sola vez y elige qué juegos entran en la rotación.',
      'Los juegos rápidos cambian tras los turnos elegidos. Los demás se juegan hasta terminar su ronda o partida.',
      'Cada juego usa sus ajustes guardados. El interruptor de picante se aplica a toda esta fiesta.',
      'Puedes saltar al siguiente juego en cualquier momento.',
      'Elige una sesión abierta, un número de juegos o ciclos completos. Al terminar verás un resumen.',
    ],
    catsTitle: 'Juegos de la fiesta',
    get cats() { return C.games.filter((g) => !g.hidden).map((g) => ({ id: g.id, label: g.emoji + ' ' + g.name, optional: !g.party })); },
    get categoryPresets() { return [
      { label: 'Todos compatibles', select: (s, n) => C.games.filter((g) => !g.hidden && C.canPlay(g, n, s.spicy)).map((g) => g.id) },
      { label: 'Solo rápidos', select: (s, n) => C.games.filter((g) => g.party && C.canPlay(g, n, s.spicy)).map((g) => g.id) },
      { label: 'Quitar todos', select: () => [] },
    ]; },
    settings: [
      { key: 'format', label: 'Formato', type: 'select', def: 'quick', options: [['quick', 'Fiesta rápida'], ['full', 'Partidas completas']] },
      { key: 'phone', label: 'Uso del móvil', type: 'select', def: 'default', options: [['default', 'Predeterminado'], ['minimal', 'Usarlo lo menos posible']] },
      { key: 'interaction', label: 'Modalidades compatibles', type: 'select', def: 'default', options: [['default', 'Según cada juego'], ['public', 'Públicas y orales'], ['private', 'Privadas']] },
      { key: 'ending', label: 'Final de la sesión', type: 'select', def: 'open', options: [['open', 'Abierta'], ['games', 'Número de juegos'], ['cycles', 'Ciclos completos']] },
      { key: 'length', label: 'Cantidad', type: 'step', def: 5, min: 1, max: 50, show: (s) => s.ending !== 'open' },
      { key: 'limit', label: 'Turnos por juego rápido', type: 'step', def: 5, min: 2, max: 15, help: 'En los demás juegos se completa la ronda o partida con sus ajustes guardados. Siempre puedes saltar al siguiente.' },
      { key: 'order', label: 'Orden', type: 'select', def: 'azar', options: [['azar', 'Al azar'], ['lista', 'En orden']] },
      { key: 'spicy', label: 'Contenido picante 🌶️ +18', type: 'toggle', def: false, help: 'Activa las categorías picantes en todos los juegos de esta fiesta. Desactivado también evita la regla y los castigos de beber. Las tarjetas propias conservan el tono que hayáis escrito.' },
    ],
    validate: (s, n) => (s.cats.filter((id) => C.canPlay(C.games.find((g) => g.id === id), n, s.spicy)).length < 2 ? 'Elige al menos dos juegos disponibles con ' + n + ' jugadores y estas categorías.' : null),
    preview(s, n) {
      return h('details', { class: 'party-preview how' }, h('summary', null, 'Así será la fiesta (' + s.cats.length + ' juegos)'),
        h('p', { class: 'muted small' }, s.spicy ? 'Picante activado 🌶️ +18' : 'Categorías picantes y beber desactivados'),
        h('ul', null, s.cats.map((id) => {
          const g = C.games.find((it) => it.id === id), ok = C.canPlay(g, n, s.spicy), settings = C.partySettings(g, n, s.spicy, s);
          const labels = (g.cats || []).concat(C.hasCustom(g) ? [{ id: 'custom', label: '✏️ Propias' }] : []).filter((cat) => (settings.cats || []).includes(cat.id)).map((cat) => cat.label);
          const format = formatLabel(g, s);
          return h('li', { class: ok ? '' : 'muted' }, g.emoji + ' ' + g.name + (ok ? '' : ' · No disponible'), ok && h('small', null, format), ok && labels.length > 0 && h('small', null, labels.join(' · ')));
        })));
    },

    play(ctx) {
      const s = ctx.s;
      C.partySpicy = s.spicy;
      ctx.onExit(() => { delete C.partySpicy; });
      let list = s.cats.map((id) => C.games.find((g) => g.id === id)).filter((g) => C.canPlay(g, ctx.players.length, s.spicy));
      if (s.order === 'azar') list = C.shuffle(list);
      let i = 0, completed = 0, previous = null;
      ctx.partyLog = [];
      ctx.endParty = () => {
        ctx.setTools(); ctx.setTitle('🎉 Resumen de la fiesta', '#ffc93c');
        ctx.show(h('div', { class: 'center' }, h('h2', null, 'Así ha ido la fiesta'),
          h('p', { class: 'lead' }, ctx.partyLog.length + ' juegos · las partidas incompletas no conceden victorias'),
          ctx.partyLog.map((entry) => h('div', { class: 'card stack' }, h('h3', null, entry.game), h('p', { class: 'muted' }, entry.complete ? 'Completado' : 'Incompleto · resultado parcial'),
            entry.progress && C.scores(entry.progress.names, entry.progress.points, entry.progress.unit))),
          C.shareBtn('Fiesta', ctx.partyLog.map((entry) => entry.game + ' · ' + (entry.complete ? 'completado' : 'incompleto')), '#ffc93c'), ctx.endBar('Otra fiesta')));
      };
      (function next() {
        if (!ctx.alive) return;
        if ((s.ending === 'games' && completed >= s.length) || (s.ending === 'cycles' && completed >= s.length * list.length)) return ctx.endParty();
        if (i === list.length) {
          i = 0;
          if (s.order === 'azar') {
            list = C.shuffle(list);
            if (list[0] === previous && list.length > 1) [list[0], list[1]] = [list[1], list[0]];
          }
        }
        const g = list[i++]; previous = g;
        ctx.setTitle('🎉 Modo fiesta', g.color);
        const format = formatLabel(g, s) + '.';
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, 'Siguiente juego'), h('div', { class: 'big-emoji' }, g.emoji), h('h2', null, g.name), h('p', { class: 'lead' }, g.tag), h('p', { class: 'muted' }, format),
          s.phone === 'minimal' && h('p', { class: 'muted' }, 'Menos móvil: se priorizan las opciones orales. Los secretos y respuestas anónimas siguen necesitando interacción.'),
          btn('¡Vamos!', () => C.sub(ctx, g, s.limit, () => { completed++; next(); }), 'primary big')));
      })();
    },
  });
})(Corrillo);
