/* Juegos de estimación numérica que comparten banco de preguntas y la barra logarítmica:
   «Impostor de cifras», «A ojo», «Precio justo» y «Subasta de cifras». */
(function (C) {
  const { h, btn } = C;
  const cats = [{ id: 'general', label: 'Cultura general' }, { id: 'ciencia', label: 'Ciencia y cuerpo' }, { id: 'records', label: 'Récords y extremos' }, { id: 'cotidiano', label: 'Vida cotidiana' }];
  const allCats = [{ id: 'internet', label: '📱 Internet y redes' }, { id: 'pop', label: '🎬 Series, fiesta y uni' }].concat(cats);
  /* Una pregunta suelta es [pregunta, respuesta, unidad, mínimo, máximo]. Las parejas del banco «cifras» llevan dos. */
  const sol = (a, u) => C.big(a) + (u ? ' ' + u : '');
  const isYear = (it) => !it[2] && it[3] >= 500;
  const singles = (s) => C.pool(C.content.cifras, s.cats).flatMap((x) => [[x[0], x[1], x[2], x[6], x[7]], [x[3], x[4], x[5], x[6], x[7]]]).concat(C.pool(C.content.estimaciones, s.cats));
  const dialFor = (it) => C.dial(isYear(it) ? { min: it[3], max: it[4] } : { unit: it[2] });
  /* Tarjeta de pregunta. Los artículos de «Precio justo» traen además emoji, subtítulo y foto opcional. */
  const qCard = (it, small) => (it[5]
    ? h('div', { class: 'card q' }, it[7] ? h('img', { class: 'pic', src: it[7], alt: '' }) : h('div', { class: 'pic' }, it[5]), it[0], h('p', { class: 'muted small', style: 'font-weight:500;margin-top:6px' }, it[6]))
    : h('div', { class: 'card q' }, small && h('small', null, small), it[0]));
  /* Distancia entre una estimación y la respuesta: diferencia simple. Gana siempre quien más cerca se queda. */
  const gap = (it, a) => Math.abs(a - it[1]);
  const fmtN = (it) => (isYear(it) ? String : C.big);

  function collect(ctx, P, qFor, done) {
    const ans = [];
    C.pass(ctx, P, (p, i) => {
      const it = qFor(i), inp = dialFor(it);
      return { node: h('div', { class: 'stack' }, qCard(it, 'Tu pregunta'), inp.el),
        before: () => (inp.value() == null ? 'Desliza la barra para marcar tu cifra.' : void (ans[i] = inp.value())) };
    }, () => done(ans), { verb: 'Ver mi pregunta' });
  }
  /* Al final se amplía la barra a escala lineal entre la cifra más baja y la más alta (con margen) para ver las distancias reales. */
  function zoomOf(it, ans) {
    const vals = ans.concat(it[1]);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = (hi - lo) * 0.08 || Math.max(1, hi * 0.1);
    lo = isYear(it) ? Math.floor(lo - pad) : Math.max(0, lo - pad); hi = isYear(it) ? Math.ceil(hi + pad) : hi + pad;
    return { min: lo, max: hi, fmt: fmtN(it) };
  }
  const plot = (it, P, ans) => C.plot(P.map((p, i) => [p, ans[i]]), it[1], isYear(it) ? { min: it[3], max: it[4] } : null, zoomOf(it, ans));

  C.register({
    id: 'cifras', name: 'Impostor de cifras', emoji: '🔢', color: '#3dd6a3', group: 'deduccion', min: 3,
    tag: 'Todos estiman una cifra, pero alguien responde a otra pregunta.',
    how: [
      'Cada jugador lee en privado una pregunta de respuesta numérica y marca su estimación.',
      'El impostor recibe una pregunta distinta, de magnitud parecida.',
      'Se muestran la pregunta común y todas las cifras con nombre.',
      'Deducid qué cifra no cuadra, descubrid al impostor y comprobad la solución.',
    ],
    cats,
    settings: [{ key: 'impostors', label: 'Impostores', type: 'step', def: 1, min: 1, max: (n) => Math.max(1, Math.floor((n - 1) / 2)) }],
    validate: (s, n) => (s.impostors * 2 >= n ? 'Demasiados impostores para ' + n + ' jugadores.' : null),

    play(ctx) {
      const P = ctx.players, s = ctx.s;
      const it = C.draw('cifras', C.pool(C.content.cifras, s.cats)), flip = Math.random() < 0.5;
      const one = [it[0], it[1], it[2], it[6], it[7]], two = [it[3], it[4], it[5], it[6], it[7]];
      const A = flip ? two : one, B = flip ? one : two;
      const imp = C.shuffle(P.map((_, i) => i)).slice(0, s.impostors);

      collect(ctx, P, (i) => (imp.includes(i) ? B : A), (ans) => {
        const extra = h('div', { class: 'stack' });
        const step = (label, fn) => btn(label, fn, 'primary big');
        ctx.show(h('div', { class: 'center' }, qCard(A, 'La pregunta era'),
          h('div', { class: 'list' }, P.map((p, i) => h('div', { class: 'item' }, h('span', null, p), h('b', null, C.big(ans[i]))))),
          h('p', { class: 'muted' }, '¿Qué cifra no cuadra? Debatid antes de revelar.'), extra));
        extra.append(step('Descubrir al impostor', () => {
          extra.replaceChildren(C.secret('🕵️', s.impostors > 1 ? 'Los impostores eran' : 'El impostor era', imp.map((i) => P[i]).join(', '), 'Su pregunta: ' + B[0] + ' (' + sol(B[1], B[2]) + ')'),
            step('Ver la solución', () => extra.lastChild.replaceWith(C.secret('✅', 'La respuesta correcta', sol(A[1], A[2])), plot(A, P, ans), ctx.endBar('Otra ronda'))));
        }));
      });
    },
  });

  /* Partida por rondas en la que todos estiman la misma cifra. La comparten «A ojo» y «Precio justo». */
  function estimate(ctx, key, items) {
    const P = ctx.players, s = ctx.s, pts = P.map(() => 0);
    let round = 0;
    (function next() {
      round++;
      const it = C.draw(key, items);
      ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, 'Ronda ' + round + ' de ' + s.rounds), qCard(it),
        btn('Empezar a estimar', () => collect(ctx, P, () => it, result), 'primary big'),
        btn('⏭️ Ya la conocemos: otra pregunta', () => { C.skip(key); round--; next(); }, 'small')));
      function result(ans) {
        C.commit();
        const diff = ans.map((a) => gap(it, a)), best = Math.min(...diff), worst = Math.max(...diff);
        diff.forEach((d, i) => { if (d === best) pts[i]++; });
        const order = P.map((_, i) => i).sort((a, b) => diff[a] - diff[b]);
        const last = round >= s.rounds;
        ctx.show(h('div', { class: 'center' }, h('div', { class: 'card q' }, h('small', null, it[0]), sol(it[1], it[2])), plot(it, P, ans),
          h('div', { class: 'list' }, order.map((i) => h('div', { class: 'item' + (diff[i] === best ? ' hit' : '') }, h('span', null, (diff[i] === best ? '🎯 ' : '') + P[i]), h('b', null, fmtN(it)(ans[i]) + (it[2] && !isYear(it) ? ' ' + it[2] : ''), h('small', { class: 'dist' }, diff[i] ? (ans[i] > it[1] ? '+' : '−') + fmtN(it)(diff[i]) : '¡exacto!'))))),
          !last && worst !== best && C.penalty(P[order[order.length - 1]]),
          last ? ctx.finish(P, pts, ' pts') : btn('Siguiente ronda', next, 'primary big')));
      }
    })();
  }
  const rounds = { key: 'rounds', label: 'Rondas', type: 'step', def: 5, min: 1, max: 15 };

  C.register({
    id: 'aojo', name: 'A ojo', emoji: '📏', color: '#ffc93c', group: 'palabras', min: 2,
    tag: 'Cada uno apuesta su cifra. Gana quien más se acerque.',
    how: [
      'Sale una pregunta cuya respuesta es un número.',
      'El móvil pasa de mano en mano y cada jugador marca su estimación en secreto.',
      'Se muestran todas las cifras sobre la misma barra, junto a la solución.',
      'Quien más se acerque gana un punto. Al final de las rondas, gana quien tenga más.',
    ],
    cats: allCats, settings: [rounds],
    play: (ctx) => estimate(ctx, 'aojo', singles(ctx.s)),
  });

  C.register({
    id: 'precio', name: 'Precio justo', emoji: '🏷️', color: '#3dd6a3', group: 'palabras', min: 2,
    tag: '¿Cuánto costó? De una consola a un fichaje millonario.',
    how: [
      'Aparece un objeto, un fichaje o una compra famosa.',
      'Cada jugador marca en secreto cuánto cree que costó.',
      'Se comparan todas las cifras con el precio real.',
      'Quien más se acerque gana un punto.',
    ],
    cats: [{ id: 'tecno', label: '📱 Tecnología' }, { id: 'lujo', label: '💎 Caprichos y subastas' }, { id: 'historia', label: '🏛️ Historia y ciencia' },{ id: 'negocios', label: '💼 Fichajes y compras' }],
    settings: [rounds],
    play: (ctx) => estimate(ctx, 'precio', C.pool(C.content.precios, ctx.s.cats)),
  });

  C.register({
    id: 'subasta', name: 'Subasta de cifras', emoji: '🔨', color: '#ff9a3d', group: 'palabras', min: 2,
    tag: 'Sube la apuesta sin pasarte… o acusa al anterior de haberse pasado.',
    how: [
      'Sale una pregunta de respuesta numérica.',
      'Por turnos, cada jugador sube la apuesta: «son al menos…» una cifra mayor que la anterior.',
      'En vez de subir, puedes desafiar: afirmas que el jugador anterior se ha pasado.',
      'Si la cifra real llega a la apuesta, gana quien apostó; si no, gana quien desafió.',
    ],
    cats: allCats, settings: [rounds],

    play(ctx) {
      const P = ctx.players, s = ctx.s, n = P.length, pts = P.map(() => 0);
      const pool = singles(s).filter((x) => !isYear(x));
      let round = 0, cur = C.rnd(n);
      (function next() {
        round++;
        const it = C.draw('subasta', pool);
        let bid = null, bidder = -1;
        (function turn() {
          const d = C.dial({ unit: it[2] }), err = h('p', { class: 'warn' });
          ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, 'Ronda ' + round + ' de ' + s.rounds), qCard(it),
            bid == null ? h('p', { class: 'lead' }, 'Abre la subasta ' + P[cur] + '.') : h('div', { class: 'card pen' }, h('small', null, 'Apuesta de ' + P[bidder]), 'Al menos ' + sol(bid, it[2])),
            bid != null && h('h2', null, 'Le toca a ' + P[cur]), d.el, err,
            bid == null && btn('⏭️ Ya la conocemos: otra pregunta', () => { C.skip('subasta'); round--; next(); }, 'small'),
            btn(bid == null ? 'Apostar' : 'Subir la apuesta', () => {
              const v = d.value();
              if (v == null || (bid != null && v <= bid)) { err.textContent = bid == null ? 'Marca tu apuesta en la barra.' : 'Tu cifra tiene que superar ' + C.big(bid) + '.'; return; }
              bid = v; bidder = cur; cur = (cur + 1) % n;
              turn();
            }, 'primary big'),
            bid != null && btn('¡Te has pasado! Desafiar a ' + P[bidder], () => {
              C.commit();
              const ok = it[1] >= bid, win = ok ? bidder : cur, lose = ok ? cur : bidder, last = round >= s.rounds;
              pts[win]++;
              cur = lose;
              ctx.show(h('div', { class: 'center' }, h('div', { class: 'card q' }, h('small', null, it[0]), sol(it[1], it[2])),
                h('h2', null, ok ? P[win] + ' no se había pasado' : P[lose] + ' se había pasado'),
                h('p', { class: 'lead' }, 'La apuesta era de al menos ' + sol(bid, it[2]) + '. Punto para ' + P[win] + '.'),
                !last && C.penalty(P[lose]), last ? ctx.finish(P, pts, ' pts') : btn('Siguiente ronda', next, 'primary big')));
            }, 'no big')));
        })();
      })();
    },
  });
})(Corrillo);
