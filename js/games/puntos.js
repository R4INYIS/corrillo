/* Juegos de preguntas con turnos y puntuación: «¿Verdad o invento?» y «Apuesto a que…». */
(function (C) {
  const { h, btn } = C;

  C.register({
    id: 'invento', name: '¿Verdad o invento?', emoji: '🧐', color: '#3dd6a3', group: 'preguntas', min: 1,
    tag: 'Datos increíbles. Algunos son ciertos; otros, puro cuento.',
    how: [
      'Por turnos, cada jugador recibe una afirmación.',
      'Decide si es verdad o un invento.',
      'La app revela la respuesta con una breve explicación.',
      'Cada acierto suma un punto. Gana quien más tenga al final.',
    ],
    cats: [{ id: 'internet', label: '📱 Internet y uni' }, { id: 'naturaleza', label: 'Naturaleza' }, { id: 'historia', label: 'Historia' }, { id: 'cuerpo', label: 'Cuerpo y ciencia' }, { id: 'mitos', label: 'Mitos populares' }],
    settings: [{ key: 'rounds', label: 'Preguntas por jugador', type: 'step', def: 3, min: 1, max: 10 }],

    play(ctx) {
      const P = ctx.players, s = ctx.s, pts = P.map(() => 0), total = s.rounds * P.length;
      let t = 0;
      (function next() {
        if (t >= total) return ctx.show(ctx.finish(P, pts, ' pts'));
        const cur = t % P.length, [v, text, why] = C.draw('invento', C.pool(C.content.invento, s.cats)).split('|');
        t++;
        const answer = (said) => {
          C.commit();
          const ok = said === v;
          if (ok) pts[cur]++;
          ok ? C.sound.ok() : C.sound.bad();
          ctx.show(h('div', { class: 'center' }, h('div', { class: 'big-emoji' }, ok ? '✅' : '❌'),
            h('h2', null, v === 'V' ? 'Es verdad' : 'Es un invento'), h('div', { class: 'card' }, h('p', { class: 'muted small' }, text), h('p', { class: 'lead' }, why)),
            C.sourceNote(text), btn(t >= total ? 'Ver clasificación' : 'Siguiente', next, 'primary big')));
        };
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, P[cur] + ' · ' + t + ' de ' + total), h('div', { class: 'card q' }, text),
          h('div', { class: 'row2', style: 'width:100%' }, btn('✅ Verdad', () => answer('V'), 'yes big'), btn('🤥 Invento', () => answer('F'), 'no big')),
          btn('⏭️ Ya me la sé: otra', () => { C.skip('invento'); t--; next(); }, 'small')));
      })();
    },
  });

  C.register({
    id: 'apuesto', name: 'Apuesto a que…', emoji: '🎲', color: '#ff9a3d', group: 'preguntas', min: 2,
    tag: 'Uno hace el reto; otro predice si lo logrará.',
    how: [
      'La app elige a quien hace la prueba y a quien apuesta.',
      'Se muestra el reto y el apostador predice si lo conseguirá.',
      'El jugador intenta la prueba, con cuenta atrás si la tiene.',
      'Punto para quien supera el reto y punto para quien acierta la predicción.',
    ],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'mente', label: 'Mente rápida' }, { id: 'habilidad', label: 'Habilidad' }, { id: 'teatro', label: 'Teatro' }, { id: 'picante', label: 'Picante', spicy: true }],
    settings: [{ key: 'rounds', label: 'Retos por jugador', type: 'step', def: 2, min: 1, max: 6 }],

    play(ctx) {
      const P = ctx.players, s = ctx.s, pts = P.map(() => 0), total = s.rounds * P.length;
      let t = 0;
      (function next() {
        if (t >= total) return ctx.show(ctx.finish(P, pts, ' pts'));
        const doer = t % P.length, bettor = C.pick(P.map((_, i) => i).filter((i) => i !== doer));
        const [text, sec] = C.draw('apuesto', C.pool(C.content.apuesto, s.cats)).split('|');
        t++;
        const q = () => h('div', { class: 'card q' }, h('small', null, 'Reto para ' + P[doer]), text);
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, 'Reto ' + t + ' de ' + total), q(), h('p', { class: 'lead' }, P[bettor] + ', ¿lo conseguirá?'),
          h('div', { class: 'row2', style: 'width:100%' }, btn('Sí', () => attempt(true), 'yes big'), btn('No', () => attempt(false), 'no big')),
          btn('⏭️ Cambiar de reto', () => { C.skip('apuesto'); t--; next(); }, 'small')));

        function attempt(bet) {
          const slot = h('div');
          const verdict = h('div', { class: 'row2', style: 'width:100%' }, btn('Conseguido', () => result(bet, true), 'yes big'), btn('Fallado', () => result(bet, false), 'no big'));
          if (+sec) slot.append(btn('Iniciar ' + sec + ' segundos', () => slot.replaceChildren((ck = C.clock(ctx, +sec)).el), 'primary'));
          ctx.show(h('div', { class: 'center' }, q(), h('p', { class: 'muted' }, P[bettor] + ' apuesta que ' + (bet ? 'sí' : 'no') + '.'), slot, h('p', { class: 'lead' }, '¿Cómo ha ido?'), verdict));
        }
        let ck = null;
        function result(bet, done) {
          if (ck) ck.stop();
          C.commit();
          if (done) pts[doer]++;
          if (bet === done) pts[bettor]++;
          ctx.show(h('div', { class: 'center' }, h('div', { class: 'big-emoji' }, done ? '🏆' : '🙈'),
            h('h2', null, P[doer] + (done ? ' lo ha conseguido' : ' ha fallado')),
            h('p', { class: 'lead' }, P[bettor] + (bet === done ? ' acierta la apuesta.' : ' pierde la apuesta.')),
            C.scores(P, pts, ' pts'), btn(t >= total ? 'Ver clasificación' : 'Siguiente reto', next, 'primary big')));
        }
      })();
    },
  });
})(Corrillo);
