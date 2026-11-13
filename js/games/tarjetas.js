/* Juegos de tarjetas secuenciales: comparten el mismo patrón (mostrar, opinar, siguiente),
   pero cada uno se registra como minijuego independiente con sus jugadores y ajustes. */
(function (C) {
  const { h, btn } = C;

  /* ---------- ¿Quién es más probable…? ---------- */
  C.register({
    id: 'probable', party: true, custom: { bank: 'probable', hint: 'Una situación por línea, sin el encabezado. Ej.: se duerma en clase de Derecho Romano' }, name: '¿Quién es más probable…?', emoji: '👉', color: '#5cb8ff', group: 'preguntas', min: 3,
    tag: 'Señalad a quien mejor encaje en cada situación.',
    how: [
      'Sale una situación que empieza por «¿Quién es más probable que…?».',
      'A la de tres, todos señalan a la persona que mejor encaja.',
      'Con la votación secreta, cada uno vota en el móvil y se muestra el recuento.',
      'Comentad el resultado y pasad a la siguiente.',
    ],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'clasico', label: 'Clásico' }, { id: 'amigos', label: 'Entre amigos' }, { id: 'fiesta', label: '🎉 De fiesta' }, { id: 'absurdo', label: 'Absurdo' }, { id: 'picante', label: 'Picante', spicy: true }],
    settings: [{ key: 'mode', label: 'Modo de votación', type: 'select', def: 'oral', options: [['oral', 'Señalando'], ['voto', 'Voto secreto en el móvil']] }],

    play(ctx) {
      const P = ctx.players, s = ctx.s;
      (function next() {
        if (ctx.turn()) return;
        const text = C.draw('probable', C.pool(C.content.probable, s.cats));
        const q = () => h('div', { class: 'card q' }, h('small', null, '¿Quién es más probable que…'), text + '?');
        if (s.mode === 'oral') return ctx.show(h('div', { class: 'center' }, q(), h('p', { class: 'muted' }, 'Una, dos y tres… ¡señalad!'), btn('Siguiente', next, 'primary big')));
        const votes = P.map(() => 0);
        ctx.show(h('div', { class: 'center' }, q(), btn('Votar en secreto', () =>
          C.pass(ctx, P, (p, i, fwd) => ({ node: h('div', { class: 'stack' }, q(), C.pickGrid(P, (k) => { votes[k]++; fwd(); })), noBtn: true }), () => {
            const top = Math.max(...votes);
            ctx.show(h('div', { class: 'center' }, q(),
              h('div', { class: 'list' }, P.map((p, i) => [p, votes[i]]).sort((a, b) => b[1] - a[1]).map(([p, v]) =>
                h('div', { class: 'item' + (v === top ? ' hit' : '') }, h('span', null, p), h('b', null, v + (v === 1 ? ' voto' : ' votos'))))),
              btn('Siguiente', next, 'primary big')));
          }, { verb: 'Votar', note: 'Tu voto es secreto.' }), 'primary big')));
      })();
    },
  });

  /* ---------- Rompehielos ---------- */
  C.register({
    id: 'rompehielos', party: true, custom: { bank: 'rompehielos', hint: 'Una pregunta por línea.' }, name: 'Rompehielos', emoji: '💬', color: '#3dd6a3', group: 'preguntas', min: 2,
    tag: 'Preguntas para conoceros mejor y hablar sin parar.',
    how: [
      'Sale una pregunta en pantalla.',
      'Responde quien indique la app, o todos por turnos.',
      'Sin prisa: lo importante es la conversación.',
      'Cuando se agote el tema, pasad a la siguiente.',
    ],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'ligero', label: 'Para empezar' }, { id: 'recuerdos', label: 'Recuerdos' }, { id: 'suenos', label: 'Sueños y planes' }, { id: 'profundo', label: 'A fondo' }, { id: 'picante', label: 'Picante', spicy: true }],
    settings: [{ key: 'who', label: 'Quién responde', type: 'select', def: 'todos', options: [['todos', 'Todos'], ['azar', 'Un jugador al azar'], ['orden', 'Por turnos']] }],

    play(ctx) {
      const P = ctx.players, s = ctx.s;
      let cur = -1;
      (function next() {
        if (ctx.turn()) return;
        cur = s.who === 'azar' ? C.rnd(P.length) : (cur + 1) % P.length;
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, s.who === 'todos' ? 'Responden todos' : 'Responde ' + P[cur]),
          h('div', { class: 'card q' }, C.draw('rompehielos', C.pool(C.content.rompehielos, s.cats))), btn('Siguiente', next, 'primary big')));
      })();
    },
  });

  /* ---------- ¿Qué prefieres? ---------- */
  C.register({
    id: 'prefieres', party: true, custom: { bank: 'prefieres', hint: 'Un dilema por línea: opción A|opción B', fix: (x) => (x.includes('|') ? x : null) }, name: '¿Qué prefieres?', emoji: '⚖️', color: '#ffc93c', group: 'preguntas', min: 2,
    tag: 'Dos opciones, ninguna cómoda. Hay que elegir.',
    how: [
      'Aparecen dos opciones incompatibles.',
      'Cada jugador elige una y toca su tarjeta para sumar su voto.',
      'Defended vuestra elección: no hay respuesta correcta.',
      'Pasad al siguiente dilema.',
    ],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'clasico', label: 'Clásico' }, { id: 'absurdo', label: 'Absurdo' }, { id: 'dificil', label: 'Difíciles' }, { id: 'fiesta', label: '🎉 De fiesta' }, { id: 'picante', label: 'Picante', spicy: true }],

    play(ctx) {
      const s = ctx.s;
      (function next() {
        if (ctx.turn()) return;
        const [a, b] = C.draw('prefieres', C.pool(C.content.prefieres, s.cats)).split('|');
        const opt = (text, cls) => {
          let n = 0;
          const t = h('span', { class: 'tally' });
          return h('button', { type: 'button', class: 'opt ' + cls, onclick: () => { t.textContent = '✋ ' + ++n; } }, text, t);
        };
        ctx.show(h('div', { class: 'stack' }, h('p', { class: 'lead', style: 'text-align:center' }, '¿Qué prefieres?'), opt(a, ''), h('div', { class: 'vs' }, 'o'), opt(b, 'b'),
          h('p', { class: 'muted small', style: 'text-align:center' }, 'Toca una opción por cada voto.'), btn('Siguiente dilema', next, 'primary big')));
      })();
    },
  });

  /* ---------- Es un 10, pero… ---------- */
  C.register({
    id: 'diez', party: true, custom: { bank: 'diez', hint: 'Una pega por línea. Ej.: ronca como un tractor.' }, name: 'Es un 10, pero…', emoji: '💯', color: '#b79cff', group: 'preguntas', min: 2,
    tag: 'La persona perfecta, con una pega. ¿Qué nota le queda?',
    how: [
      'Imaginad a alguien que es un 10 en todo.',
      'La tarjeta añade un «pero» inesperado.',
      'Cada jugador dice qué nota le pondría ahora, del 0 al 10.',
      'Con puntuación en el móvil se calcula la media del grupo.',
    ],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'clasico', label: 'Clásico' }, { id: 'manias', label: 'Manías' }, { id: 'absurdo', label: 'Absurdo' }, { id: 'picante', label: 'Picante', spicy: true }],
    settings: [{ key: 'mode', label: 'Valoración', type: 'select', def: 'oral', options: [['oral', 'En voz alta'], ['nota', 'Puntuar en el móvil']] }],

    play(ctx) {
      const P = ctx.players, s = ctx.s;
      (function next() {
        if (ctx.turn()) return;
        const text = C.draw('diez', C.pool(C.content.diez, s.cats));
        const q = () => h('div', { class: 'card q' }, h('small', null, 'Es un 10, pero…'), text);
        if (s.mode === 'oral') return ctx.show(h('div', { class: 'center' }, q(), h('p', { class: 'muted' }, '¿Qué nota le queda? Decidla en voz alta.'), btn('Siguiente', next, 'primary big')));
        const notes = [];
        (function rate(i) {
          if (i < P.length)
            return ctx.show(h('div', { class: 'center' }, q(), h('p', { class: 'lead' }, 'Nota de ' + P[i]),
              h('div', { class: 'tens' }, Array.from({ length: 11 }, (_, v) => btn(v, () => { notes.push(v); rate(i + 1); })))));
          const avg = notes.reduce((a, b) => a + b, 0) / notes.length;
          ctx.show(h('div', { class: 'center' }, q(), C.secret(avg >= 7 ? '😍' : avg >= 4 ? '🤨' : '🚩', 'Para este grupo se queda en un', avg.toLocaleString('es-ES', { maximumFractionDigits: 1 })),
            h('div', { class: 'list' }, P.map((p, k) => h('div', { class: 'item' }, h('span', null, p), h('b', null, notes[k])))), btn('Siguiente', next, 'primary big')));
        })(0);
      })();
    },
  });

  /* ---------- ¿Detallazo o lo mínimo? ---------- */
  C.register({
    id: 'detallazo', party: true, custom: { bank: 'detallazo', hint: 'Una situación por línea.' }, name: '¿Detallazo o lo mínimo?', emoji: '👑', color: '#ff8fc7', group: 'preguntas', min: 2,
    tag: '¿Eso es un gesto especial o lo mínimo que se espera?',
    how: [
      'Sale una situación de pareja, amistad o convivencia.',
      'Cada jugador decide: ¿es un detallazo o lo mínimo exigible?',
      'La app muestra qué porcentaje del grupo opina cada cosa.',
      'Discutid las diferencias (que las habrá) y seguid.',
    ],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'clasico', label: 'Clásico' }, { id: 'emocional', label: 'Emocional' }, { id: 'convivencia', label: 'Convivencia' }, { id: 'picante', label: 'Picante', spicy: true }],
    settings: [{ key: 'mode', label: 'Modo', type: 'select', def: 'voto', options: [['voto', 'Vota cada jugador'], ['debate', 'Solo debatir']] }],

    play(ctx) {
      const P = ctx.players, s = ctx.s;
      (function next() {
        if (ctx.turn()) return;
        const text = C.draw('detallazo', C.pool(C.content.detallazo, s.cats));
        const q = () => h('div', { class: 'card q' }, text);
        if (s.mode === 'debate') return ctx.show(h('div', { class: 'center' }, q(), h('p', { class: 'lead' }, '👑 ¿Detallazo o lo mínimo? 🤷'), btn('Siguiente', next, 'primary big')));
        let yes = 0;
        (function vote(i) {
          if (i < P.length)
            return ctx.show(h('div', { class: 'center' }, q(), h('p', { class: 'lead' }, 'Vota ' + P[i]),
              h('div', { class: 'row2', style: 'width:100%' }, btn('👑 Detallazo', () => { yes++; vote(i + 1); }, 'yes big'), btn('🤷 Lo mínimo', () => vote(i + 1), 'no big'))));
          const pct = Math.round((yes / P.length) * 100);
          ctx.show(h('div', { class: 'center' }, q(), h('h2', null, pct === 50 ? 'Empate total' : pct > 50 ? 'Detallazo' : 'Lo mínimo'),
            h('div', { class: 'meter' }, h('i', { style: 'width:' + pct + '%' })),
            h('p', { class: 'lead' }, '👑 ' + pct + ' %  ·  🤷 ' + (100 - pct) + ' %'), btn('Siguiente', next, 'primary big')));
        })(0);
      })();
    },
  });
})(Corrillo);
