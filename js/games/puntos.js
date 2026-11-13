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
    cats: [{ id: 'internet', label: '📱 Internet y tecnología' }, { id: 'naturaleza', label: 'Naturaleza' }, { id: 'historia', label: 'Historia y monumentos' }, { id: 'cuerpo', label: 'Cuerpo y ciencia' }, { id: 'espacio', label: 'Astronomía' }, { id: 'mitos', label: 'Mitos populares' }],
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
    settings: [
      { key: 'rounds', label: 'Mínimo de intentos en cada papel', type: 'step', def: 2, min: 1, max: 6, help: 'Termina cuando todos han hecho y apostado al menos esta cantidad. El número de retos puede variar.' },
      { key: 'scoring', label: 'Puntuación', type: 'select', def: 'percent', options: [['percent', 'Media de porcentajes'], ['classic', 'Puntos clásicos']] },
    ],
    play(ctx) {
      const P = ctx.players, s = ctx.s, attempts = P.map(() => 0), bets = P.map(() => 0), hits = P.map(() => 0), predictions = P.map(() => 0);
      let t = 0;
      const points = () => s.scoring === 'classic' ? hits.map((n, i) => n + predictions[i]) : C.apuestoScore(attempts, bets, hits, predictions);
      const unit = s.scoring === 'classic' ? ' pts' : ' %';
      const finished = () => attempts.every((n) => n >= s.rounds) && bets.every((n) => n >= s.rounds);
      function next() {
        if (finished()) return ctx.show(ctx.finish(P, points(), unit));
        const doer = C.weightedRole(attempts), bettor = C.weightedRole(bets, doer);
        const [text, sec] = C.draw('apuesto', C.pool(C.content.apuesto, s.cats)).split('|');
        const q = () => h('div', { class: 'card q' }, h('small', null, 'Reto para ' + P[doer]), text);
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, 'Reto ' + (t + 1)), q(),
          C.cardLabels && C.cardLabels(text + '|' + sec),
          h('p', { class: 'lead' }, P[bettor] + ', ¿lo conseguirá?'),
          h('div', { class: 'row2' }, btn('Sí', () => attempt(true), 'yes big'), btn('No', () => attempt(false), 'no big')),
          btn('Cambiar de reto', () => { C.skip('apuesto'); next(); }, 'small')));
        function attempt(bet) {
          let ck = null, settled = false;
          const timer = h('div');
          function result(done) {
            if (settled) return; settled = true; if (ck) ck.stop(); C.commit(); t++;
            attempts[doer]++; bets[bettor]++;
            if (done) hits[doer]++;
            if (bet === done) predictions[bettor]++;
            ctx.progress = { names: P.slice(), points: points(), unit, type: 'competitive', complete: false };
            ctx.show(h('div', { class: 'center' }, h('h2', null, P[doer] + (done ? ' lo ha conseguido' : ' ha fallado')),
              h('p', { class: 'lead' }, P[bettor] + (bet === done ? ' acierta la apuesta.' : ' pierde la apuesta.')),
              C.scores(P, points(), unit), h('details', { class: 'how' }, h('summary', null, 'Intentos y porcentajes'),
                P.map((p, i) => h('p', { class: 'muted' }, p + ': retos ' + hits[i] + '/' + attempts[i] + ' · apuestas ' + predictions[i] + '/' + bets[i]))),
              btn(finished() ? 'Ver clasificación' : 'Siguiente reto', next, 'primary big')));
          }
          if (+sec) timer.append(btn('Iniciar ' + sec + ' segundos', () => timer.replaceChildren((ck = C.clock(ctx, +sec)).el), 'primary'));
          ctx.show(h('div', { class: 'center' }, q(), h('p', { class: 'muted' }, P[bettor] + ' apuesta que ' + (bet ? 'sí' : 'no') + '.'), timer,
            h('p', { class: 'lead' }, '¿Cómo ha ido?'), h('div', { class: 'row2' }, btn('Conseguido', () => result(true), 'yes big'), btn('Fallado', () => result(false), 'no big'))));
        }
      }
      next();
    },
  });
})(Corrillo);
