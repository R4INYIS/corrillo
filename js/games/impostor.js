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
      { key: 'impostors', label: 'Impostores', type: 'step', def: 1, min: 1, max: (n, s) => Math.max(1, s.variant === 'survival' ? Math.floor((n - 1) / 2) : n - 2), show: (s) => !s.random },
      { key: 'hints', label: 'Pista para el impostor', type: 'toggle', def: false, help: 'Recibe una pista vaga sobre la palabra.', show: (s) => s.mode === 'clasico' },
      { key: 'guess', label: 'El impostor puede salvarse adivinando', type: 'toggle', def: true, help: 'Si lo pillan, solo él gana si acierta la palabra.', show: (s) => s.mode === 'clasico' && s.variant !== 'survival' },
      { key: 'timer', label: 'Límite de tiempo', type: 'toggle', def: false },
      { key: 'duration', label: 'Duración', type: 'select', def: 180, options: [[60, '1 min'], [120, '2 min'], [180, '3 min'], [300, '5 min']], show: (s) => s.timer },
    ].concat(C.infiltratorSettings(false)),
    validate: (s, n) => (!s.random && s.impostors > n - 2 ? 'Demasiados impostores: tienen que quedar al menos dos jugadores normales.' : null),

    play(ctx) {
      const P = ctx.players, s = ctx.s, n = P.length, similar = s.mode === 'parecida';
      const k = Math.min(n - 2, s.random ? 1 + C.rnd(Math.max(1, Math.floor((n - 1) / 2))) : s.impostors);
      const [word, other] = similar ? C.shuffle(C.draw('impostor-pares', C.content.impostorPares).split('|')) : C.draw('impostor', C.pool(C.content.impostor, s.cats)).split('|');
      const imp = C.shuffle(P.map((_, i) => i)).slice(0, k);
      return C.playInfiltrators(ctx, { word, other, similar, infiltrators: imp });
    },
  });
})(Corrillo);
