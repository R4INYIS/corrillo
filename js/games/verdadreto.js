(function (C) {
  const { h, btn } = C;
  C.register({
    id: 'verdadreto', party: true, name: 'Verdad o Reto', emoji: '🎭', color: '#ff8fc7', group: 'preguntas', min: 2,
    tag: 'Confiesa o cumple. No hay tercera opción.',
    how: [
      'La app indica a quién le toca.',
      'Esa persona elige «Verdad» o «Reto».',
      'Responde con sinceridad o cumple el desafío delante de todos.',
      'Pulsad «Continuar» para pasar al siguiente jugador.',
    ],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'clasico', label: 'Clásico' }, { id: 'divertido', label: 'Divertido' }, { id: 'profundo', label: 'Profundo' }, { id: 'picante', label: 'Picante', spicy: true }],
    custom: { bank: 'verdadreto', dual: true, hint: 'Una verdad o un reto por línea en su apartado. Puedes escribir {j} para mencionar a otro jugador.' },
    settings: [
      { key: 'order', label: 'Orden de turnos', type: 'select', def: 'orden', options: [['orden', 'Por orden'], ['azar', 'Al azar']] },
      { key: 'skip', label: 'Permitir cambiar de tarjeta', type: 'toggle', def: true },
    ],
    validate: (s) => (['verdad', 'reto'].every((k) => C.pool(C.content.verdadreto[k], s.cats).length) ? null : 'Con solo esa categoría no hay retos. Añade otra.'),

    play(ctx) {
      const P = ctx.players, s = ctx.s;
      let cur = -1;
      function turn() {
        if (ctx.turn()) return;
        if (s.order === 'azar') { let nx; do nx = C.rnd(P.length); while (P.length > 1 && nx === cur); cur = nx; }
        else cur = (cur + 1) % P.length;
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'lead' }, 'Le toca a'), h('h2', { class: 'name' }, P[cur]),
          h('div', { class: 'stack' }, h('button', { type: 'button', class: 'opt', onclick: () => card('verdad') }, '🤔 Verdad'), h('button', { type: 'button', class: 'opt b', onclick: () => card('reto') }, '🔥 Reto'))));
      }
      function card(kind) {
        const others = P.filter((_, i) => i !== cur);
        const text = C.draw('vr-' + kind, C.pool(C.content.verdadreto[kind], s.cats)).replace('{j}', C.pick(others));
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, P[cur]),
          h('div', { class: 'card q' }, h('small', null, kind === 'verdad' ? 'Verdad' : 'Reto'), text),
          btn('Continuar', turn, 'primary big'), s.skip && btn('Cambiar tarjeta', () => card(kind), 'small')));
      }
      turn();
    },
  });
})(Corrillo);
