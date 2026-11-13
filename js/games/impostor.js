(function (C) {
  const { h, btn } = C;
  C.register({
    id: 'impostor', name: 'Impostor', emoji: '🕵️', color: '#ff6b5e', group: 'deduccion', min: 3,
    tag: 'Todos conocen la palabra secreta… menos alguien.',
    how: [
      'El móvil pasa de mano en mano y cada jugador mira su carta en privado.',
      'Modo clásico: todos ven la misma palabra, salvo los impostores, que solo saben que lo son.',
      'Modo palabra parecida: el impostor recibe otra palabra muy similar y no sabe que es él.',
      'Por turnos, cada uno dice una palabra relacionada con la suya. Después debatid, votad y descubrid a los impostores.',
    ],
    cats: [
      { id: 'uni', label: '🎓 Universidad' }, { id: 'internet', label: '📱 Internet' }, { id: 'famosos', label: '⭐ Famosos' },
      { id: 'cotidiano', label: 'Objetos' }, { id: 'comida', label: 'Comida' }, { id: 'lugares', label: 'Lugares' },
      { id: 'animales', label: 'Animales' }, { id: 'ocio', label: 'Ocio y deporte' }, { id: 'oficios', label: 'Oficios' }, { id: 'cine', label: '🎬 Películas y series' }, { id: 'viajes', label: '🌍 Países y ciudades' },
      { id: 'picante', label: 'Picante', spicy: true },
    ],
    custom: { bank: 'impostor', hint: 'Una por línea, con pista opcional: palabra|pista. Ej.: El profe de Estadística|Clase', fix: (x) => (x.includes('|') ? x : x + '|Sin pista') },
    settings: [
      { key: 'mode', label: 'Modo', type: 'select', def: 'clasico', options: [['clasico', 'Clásico'], ['parecida', 'Palabra parecida']], help: 'En «palabra parecida» se usa un banco propio de parejas y las categorías no se aplican.' },
      { key: 'random', label: 'Número de impostores al azar', type: 'toggle', def: false, help: 'Nadie sabrá cuántos hay.' },
      { key: 'impostors', label: 'Impostores', type: 'step', def: 1, min: 1, max: (n) => Math.max(1, n - 2), show: (s) => !s.random },
      { key: 'hints', label: 'Pista para el impostor', type: 'toggle', def: false, help: 'Recibe una pista vaga sobre la palabra.', show: (s) => s.mode === 'clasico' },
      { key: 'guess', label: 'El impostor puede salvarse adivinando', type: 'toggle', def: true, help: 'Si lo pillan, gana igualmente si acierta la palabra.', show: (s) => s.mode === 'clasico' },
      { key: 'timer', label: 'Límite de tiempo', type: 'toggle', def: false },
      { key: 'duration', label: 'Duración', type: 'select', def: 180, options: [[60, '1 min'], [120, '2 min'], [180, '3 min'], [300, '5 min']], show: (s) => s.timer },
    ],
    validate: (s, n) => (!s.random && s.impostors > n - 2 ? 'Demasiados impostores: tienen que quedar al menos dos jugadores normales.' : null),

    play(ctx) {
      const P = ctx.players, s = ctx.s, n = P.length, similar = s.mode === 'parecida';
      const k = Math.min(n - 2, s.random ? 1 + C.rnd(Math.max(1, Math.floor((n - 1) / 2))) : s.impostors);
      const [word, other] = similar ? C.shuffle(C.draw('impostor-pares', C.content.impostorPares).split('|')) : C.draw('impostor', C.pool(C.content.impostor, s.cats)).split('|');
      const imp = C.shuffle(P.map((_, i) => i)).slice(0, k);
      const impNames = imp.map((i) => P[i]).join(', ');

      C.pass(ctx, P, (p, i) => similar
        ? C.secret('🔑', 'Tu palabra es', imp.includes(i) ? other : word, 'Ojo: puede que seas el impostor y tu palabra sea distinta a la del resto.')
        : imp.includes(i)
          ? C.secret('🕵️', 'Tu papel', 'Eres impostor', s.hints ? 'Pista: ' + other : 'No conoces la palabra. Escucha y disimula.')
          : C.secret('🔑', 'La palabra secreta es', word, 'Da pistas sin ponérselo fácil al impostor.'), discuss, { lastLabel: 'Ocultar y empezar' });

      function discuss() {
        const clock = s.timer ? C.clock(ctx, s.duration) : null;
        ctx.show(h('div', { class: 'center' },
          h('div', { class: 'big-emoji' }, '🗣️'),
          h('p', { class: 'lead' }, 'Empieza ' + C.pick(P) + ' y seguid en orden.'),
          h('p', { class: 'muted' }, 'Cada uno dice una palabra o frase relacionada con su palabra. Después, debatid quién no encaja.'),
          clock && clock.el,
          btn('Ir a la votación', () => { clock && clock.stop(); vote(); }, 'primary big')));
      }
      function vote() {
        ctx.show(h('div', { class: 'center' },
          h('h2', null, '¿A quién acusa el grupo?'),
          h('p', { class: 'muted' }, 'Votad a mano alzada y marcad al más votado.'),
          C.pickGrid(P, (i) => (imp.includes(i) && s.guess && !similar ? lastChance(i) : reveal(i, false)), btn('Revelar sin votar', () => reveal(-1, false), 'wide'))));
      }
      function lastChance(acc) {
        ctx.show(h('div', { class: 'center' }, h('div', { class: 'big-emoji' }, '🎯'), h('h2', null, '¡Pillado! ' + P[acc] + ' era impostor'),
          h('p', { class: 'lead' }, 'Última oportunidad: si dice la palabra secreta, gana igualmente.'),
          h('div', { class: 'row2', style: 'width:100%' }, btn('La ha adivinado', () => reveal(acc, true), 'yes big'), btn('Ha fallado', () => reveal(acc, false), 'no big'))));
      }
      function reveal(acc, guessed) {
        const hit = imp.includes(acc) && !guessed;
        const title = acc < 0 ? null : guessed ? P[acc] + ' adivina la palabra' : hit ? '¡Pillado! ' + P[acc] + ' era impostor' : P[acc] + ' era inocente';
        const verdict = acc < 0 ? null : hit ? 'Gana el grupo.' : 'Ganan los impostores.';
        ctx.show(h('div', { class: 'center' },
          title && h('h2', null, title), verdict && h('p', { class: 'lead' }, verdict),
          C.secret('🕵️', k > 1 ? 'Los impostores eran' : 'El impostor era', impNames, similar ? 'Palabra del grupo: ' + word + ' · Palabra del impostor: ' + other : 'La palabra era: ' + word),
          acc >= 0 && C.penalty(hit ? P[acc] : imp.includes(acc) ? C.pick(P.filter((_, i) => !imp.includes(i))) : P[acc]),
          C.shareBtn('Impostor', [k > 1 ? 'Impostores: ' + impNames : impNames + ' era impostor', 'Palabra: ' + word].concat(verdict ? [verdict] : []), '#ff6b5e'),
          ctx.endBar('Otra ronda')));
      }
    },
  });
})(Corrillo);
