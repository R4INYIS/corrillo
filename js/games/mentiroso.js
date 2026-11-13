(function (C) {
  const { h, btn } = C;
  C.register({
    id: 'mentiroso', custom: { bank: 'mentiroso', hint: 'Una pareja por línea: pregunta normal|pregunta distinta', fix: (x) => (x.includes('|') ? x : null) }, name: '¿Quién miente?', emoji: '🤥', color: '#b79cff', group: 'deduccion', min: 3,
    tag: 'Alguien ha respondido a otra pregunta sin saberlo.',
    how: [
      'Cada jugador lee en privado una pregunta.',
      'Todos reciben la misma, salvo uno, que recibe otra parecida y no lo sabe.',
      'Se comparten las respuestas y después se muestra la pregunta común.',
      'Buscad la respuesta que no encaja y descubrid quién tenía la pregunta distinta.',
    ],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'clasico', label: 'Clásico' }, { id: 'gustos', label: 'Gustos' }, { id: 'personas', label: 'Sobre el grupo' }, { id: 'numeros', label: '🔢 Con números' }, { id: 'picante', label: 'Picante', spicy: true }],
    settings: [
      { key: 'liars', label: 'Preguntas distintas', type: 'step', def: 1, min: 1, max: (n) => Math.max(1, Math.floor((n - 1) / 2)), help: 'Cuántos jugadores reciben la otra pregunta.' },
      { key: 'mode', label: 'Cómo se responde', type: 'select', def: 'oral', options: [['oral', 'En voz alta'], ['escrito', 'Por escrito']] },
    ],
    validate: (s, n) => (s.liars * 2 >= n ? 'Tiene que haber mayoría con la pregunta normal.' : null),

    play(ctx) {
      const P = ctx.players, s = ctx.s;
      const [qa, qb] = C.draw('mentiroso', C.pool(C.content.mentiroso, s.cats)).split('|');
      const liars = C.shuffle(P.map((_, i) => i)).slice(0, s.liars);
      const answers = [];

      C.pass(ctx, P, (p, i) => {
        const q = h('div', { class: 'card q' }, h('small', null, 'Tu pregunta'), liars.includes(i) ? qb : qa);
        if (s.mode === 'oral') return h('div', { class: 'stack' }, q, h('p', { class: 'muted' }, 'Piensa tu respuesta y no digas la pregunta.'));
        const inp = h('input', { type: 'text', class: 'textin', maxLength: 40, placeholder: 'Tu respuesta', autocomplete: 'off' });
        return { node: h('div', { class: 'stack' }, q, inp), before: () => (inp.value.trim() ? void (answers[i] = inp.value.trim()) : 'Escribe una respuesta.') };
      }, s.mode === 'oral' ? aloud : debate, { verb: 'Ver mi pregunta' });

      function aloud() {
        ctx.show(h('div', { class: 'center' },
          h('div', { class: 'big-emoji' }, '🗣️'),
          h('h2', null, 'Decid vuestras respuestas'),
          h('p', { class: 'muted' }, 'Por turnos y sin revelar la pregunta. Empieza ' + C.pick(P) + '.'),
          btn('Mostrar la pregunta', debate, 'primary big')));
      }
      function debate() {
        ctx.show(h('div', { class: 'center' },
          h('div', { class: 'card q' }, h('small', null, 'La pregunta era'), qa),
          s.mode === 'escrito' && h('div', { class: 'list' }, P.map((p, i) => h('div', { class: 'item' }, h('span', null, p), h('b', null, answers[i])))),
          h('p', { class: 'muted' }, '¿Qué respuesta no encaja? Debatid y decidid.'),
          btn('Revelar', reveal, 'primary big')));
      }
      function reveal() {
        ctx.show(h('div', { class: 'center' },
          C.secret('🤥', 'Tenía otra pregunta', liars.map((i) => P[i]).join(', '), 'Su pregunta: ' + qb),
          ctx.endBar('Otra ronda')));
      }
    },
  });
})(Corrillo);
