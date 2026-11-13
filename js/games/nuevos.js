/* Yo nunca · 5 segundos · ¿Quién lo dijo? · ¿Cuánto nos conocemos? · En la misma onda · Contraseña */
(function (C) {
  const { h, btn } = C;
  const UNI = { id: 'uni', label: '🎓 Universidad' }, HOT = { id: 'picante', label: 'Picante', spicy: true };

  /* ---------- Yo nunca ---------- */
  C.register({
    id: 'yonunca', name: 'Yo nunca', emoji: '🙅', color: '#ff8fc7', group: 'preguntas', min: 2, party: true,
    tag: 'Quien lo haya hecho, se delata.',
    how: ['Sale una frase que empieza por «Yo nunca…».', 'Quien SÍ lo haya hecho, lo paga según la regla elegida.', 'Si solo cae una persona, le toca contar la historia.', 'Pasad a la siguiente.'],
    cats: [UNI, { id: 'clasico', label: 'Clásico' }, { id: 'aventuras', label: 'Aventuras' }, { id: 'fiesta', label: '🎉 De fiesta' }, HOT],
    custom: { bank: 'yonunca', hint: 'Una frase por línea, sin «Yo nunca» delante. Ej.: he copiado en un examen' },
    settings: [{ key: 'rule', label: 'Quien lo haya hecho…', type: 'select', def: 'dedo', options: [['dedo', 'Baja un dedo'], ['beber', 'Bebe un trago'], ['nada', 'Solo confiesa']] }],
    play(ctx) {
      const rule = { dedo: 'Si lo has hecho, baja un dedo. Pierde quien se quede sin dedos.', beber: 'Si lo has hecho, bebe un trago.', nada: 'Si lo has hecho, levanta la mano y cuéntalo.' }[ctx.s.rule];
      (function next() {
        if (ctx.turn()) return;
        ctx.show(h('div', { class: 'center' }, h('div', { class: 'card q' }, h('small', null, 'Yo nunca…'), C.draw('yonunca', C.pool(C.content.yonunca, ctx.s.cats))),
          h('p', { class: 'muted' }, rule), btn('Siguiente', next, 'primary big')));
      })();
    },
  });

  /* ---------- 5 segundos ---------- */
  C.register({
    id: 'cinco', name: '5 segundos', emoji: '⏱️', color: '#5cb8ff', group: 'palabras', min: 2, party: true,
    tag: 'Di tres cosas antes de que se acabe el tiempo.',
    how: ['Le toca a un jugador y sale una consigna: «Di tres…».', 'Tiene cinco segundos para decir tres respuestas válidas.', 'El grupo decide si lo ha conseguido.', 'Cada acierto es un punto.'],
    cats: [UNI, { id: 'facil', label: 'Fáciles' }, { id: 'ingenio', label: 'Con ingenio' }, { id: 'fiesta', label: '🎉 De fiesta' }, HOT],
    custom: { bank: 'cinco', hint: 'Una consigna por línea, sin «Di tres» delante. Ej.: bares cerca de la facultad' },
    settings: [
      { key: 'secs', label: 'Tiempo', type: 'select', def: 5, options: [[5, '5 s'], [7, '7 s'], [10, '10 s']] },
      { key: 'rounds', label: 'Turnos por jugador', type: 'step', def: 3, min: 1, max: 8 },
    ],
    play(ctx) {
      const P = ctx.players, s = ctx.s, pts = P.map(() => 0), total = s.rounds * P.length;
      let t = 0;
      (function next() {
        if (t >= total) return ctx.show(ctx.finish(P, pts, ' pts'));
        if (ctx.turn()) return;
        const cur = t++ % P.length, text = C.draw('cinco', C.pool(C.content.cinco, s.cats));
        const q = () => h('div', { class: 'card q' }, h('small', null, 'Di tres…'), text);
        const verdict = (ok) => { if (ok) pts[cur]++; ok ? C.sound.ok() : C.sound.bad(); next(); };
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'lead' }, 'Le toca a'), h('h2', { class: 'name' }, P[cur]), btn('Ver la consigna y empezar', () => {
          const clock = C.clock(ctx, s.secs, () => ctx.show(h('div', { class: 'center' }, h('div', { class: 'big-emoji' }, '⏰'), h('h2', null, '¡Tiempo!'), q(),
            h('div', { class: 'row2', style: 'width:100%' }, btn('Llegó a tiempo', () => verdict(true), 'yes big'), btn('No llegó', () => verdict(false), 'no big')))));
          ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, P[cur]), clock.el, q(), btn('¡Dichas las tres!', () => { clock.stop(); verdict(true); }, 'yes big')));
        }, 'primary big')));
      })();
    },
  });

  /* ---------- ¿Quién lo dijo? ---------- */
  C.register({
    id: 'quienlodijo', name: '¿Quién lo dijo?', emoji: '🗯️', color: '#b79cff', group: 'preguntas', min: 3, party: true,
    tag: 'Respuestas anónimas. ¿Sabéis de quién es cada una?',
    how: ['Sale una pregunta.', 'El móvil pasa de mano en mano y cada uno escribe su respuesta en secreto.', 'Las respuestas aparecen mezcladas, de una en una.', 'Debatid de quién es cada una antes de revelar al autor.'],
    cats: [UNI, { id: 'clasico', label: 'Para reírse' }, { id: 'grupo', label: 'Sobre el grupo' }, HOT],
    custom: { bank: 'quienlodijo', hint: 'Una pregunta por línea.' },
    play(ctx) {
      const P = ctx.players;
      (function next() {
        if (ctx.turn()) return;
        const q = C.draw('quienlodijo', C.pool(C.content.quienlodijo, ctx.s.cats)), ans = [];
        ctx.show(h('div', { class: 'center' }, h('div', { class: 'card q' }, q), btn('Empezar a escribir', () => C.pass(ctx, P, (p, i) => {
          const inp = h('input', { type: 'text', class: 'textin', maxLength: 60, placeholder: 'Tu respuesta', autocomplete: 'off' });
          return { node: h('div', { class: 'stack' }, h('div', { class: 'card q' }, q), inp), before: () => (inp.value.trim() ? void (ans[i] = inp.value.trim()) : 'Escribe una respuesta.') };
        }, () => reveal(C.shuffle(P.map((_, i) => i)), 0), { verb: 'Escribir mi respuesta' }), 'primary big')));

        function reveal(order, k) {
          const i = order[k], slot = h('div', { class: 'stack' });
          const go = btn(k + 1 < order.length ? 'Siguiente respuesta' : 'Otra pregunta', () => (k + 1 < order.length ? reveal(order, k + 1) : next()), 'primary big');
          slot.append(h('p', { class: 'muted' }, '¿Quién ha escrito esto?'), btn('Revelar autor', () => slot.replaceChildren(h('h2', null, '✍️ ' + P[i]), go), 'primary big'));
          ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, 'Respuesta ' + (k + 1) + ' de ' + order.length), h('p', { class: 'muted small' }, q), h('div', { class: 'card q' }, '«' + ans[i] + '»'), slot));
        }
      })();
    },
  });

  /* ---------- ¿Cuánto nos conocemos? ---------- */
  C.register({
    id: 'conocemos', name: '¿Cuánto nos conocemos?', emoji: '🫶', color: '#3dd6a3', group: 'preguntas', min: 3,
    tag: 'Uno elige en secreto; los demás intentan acertar qué ha elegido.',
    how: ['En cada ronda hay un protagonista.', 'Sale una pregunta sobre él con dos opciones y elige en secreto.', 'El resto, uno a uno, apuesta qué ha elegido.', 'Punto para quien acierte; el protagonista puntúa si lo conoce al menos la mitad.'],
    cats: [UNI, { id: 'gustos', label: 'Gustos' }, { id: 'caracter', label: 'Carácter' }, HOT],
    settings: [{ key: 'rounds', label: 'Rondas por jugador', type: 'step', def: 2, min: 1, max: 5 }],
    play(ctx) {
      const P = ctx.players, s = ctx.s, pts = P.map(() => 0), total = s.rounds * P.length;
      let t = 0;
      (function next() {
        if (t >= total) return ctx.show(ctx.finish(P, pts, ' pts'));
        const pro = t++ % P.length, [q, a, b] = C.draw('conocemos', C.pool(C.content.conocemos, s.cats)).split('|');
        const others = P.map((_, i) => i).filter((i) => i !== pro), text = q.replace('{n}', P[pro]);
        const choose = (who, fwd, set) => ({ noBtn: true, node: h('div', { class: 'stack' }, h('div', { class: 'card q' }, h('small', null, who), text),
          h('button', { type: 'button', class: 'opt', onclick: () => { set(0); fwd(); } }, a), h('button', { type: 'button', class: 'opt b', onclick: () => { set(1); fwd(); } }, b)) });
        let truth = 0;
        const guess = [];
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, 'Ronda ' + t + ' de ' + total), h('p', { class: 'lead' }, 'Protagonista'), h('h2', { class: 'name' }, P[pro]),
          btn('Empezar', () => C.pass(ctx, [P[pro]], (p, i, fwd) => choose('Elige con sinceridad', fwd, (v) => (truth = v)),
            () => C.pass(ctx, others.map((i) => P[i]), (p, j, fwd) => choose('¿Qué ha elegido ' + P[pro] + '?', fwd, (v) => (guess[j] = v)), result, { verb: 'Apostar' }), { verb: 'Responder en secreto' }), 'primary big')));

        function result() {
          const hits = others.filter((_, j) => guess[j] === truth);
          hits.forEach((i) => pts[i]++);
          if (hits.length * 2 >= others.length) pts[pro]++;
          ctx.show(h('div', { class: 'center' }, h('div', { class: 'card q' }, h('small', null, text), [a, b][truth]),
            h('div', { class: 'list' }, others.map((i, j) => h('div', { class: 'item ' + (guess[j] === truth ? 'hit' : 'miss') }, h('span', null, P[i]), h('b', null, guess[j] === truth ? '✓' : '✗')))),
            h('p', { class: 'lead' }, hits.length + ' de ' + others.length + ' conocen bien a ' + P[pro] + '.'),
            btn(t >= total ? 'Ver clasificación' : 'Siguiente ronda', next, 'primary big')));
        }
      })();
    },
  });

  /* ---------- En la misma onda ---------- */
  /* Rueda de frecuencia: semicírculo de 0 (izquierda) a 100 (derecha).
     band = centro de la franja objetivo o null; value = posición de la aguja o null; onChange la hace arrastrable; reveal anima la franja. */
  const ZONES = [[15, 2], [9, 3], [3, 4]];            // [semianchura, puntos], de fuera a dentro
  const ondaPts = (d) => (d <= 3 ? 4 : d <= 9 ? 3 : d <= 15 ? 2 : 0);
  function scale(L, R, band, value, onChange, reveal) {
    const NS = 'http://www.w3.org/2000/svg', CX = 110, CY = 112, RAD = 100;
    const el = (tag, at) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); return e; };
    const pt = (v, r) => { const a = Math.PI * (1 - v / 100); return [CX + r * Math.cos(a), CY - r * Math.sin(a)]; };
    const wedge = (a, b) => { a = Math.max(0, a); b = Math.min(100, b); const p = pt(a, RAD), q = pt(b, RAD); return 'M' + CX + ' ' + CY + 'L' + p + 'A' + RAD + ' ' + RAD + ' 0 0 1 ' + q + 'Z'; };
    const svg = el('svg', { viewBox: '0 0 220 122', class: 'wl' + (onChange ? ' live' : '') + (reveal ? ' reveal' : ''), role: onChange ? 'slider' : 'img',
      'aria-label': L + ' a ' + R, tabindex: onChange ? 0 : -1 });
    svg.append(el('path', { d: wedge(0, 100), class: 'wl-face' }));
    if (band != null) {
      const g = el('g', { class: 'wl-band' });
      ZONES.forEach(([w, p]) => {
        g.append(el('path', { d: wedge(band - w, band + w), class: 'wl-z z' + p }));
        if (p < 4) [band - w + 3, band + w - 3].forEach((v) => { if (v > 1 && v < 99) { const [x, y] = pt(v, RAD - 12); const t = el('text', { x, y, class: 'wl-n' }); t.textContent = p; g.append(t); } });
      });
      const [x, y] = pt(band, RAD - 12), t = el('text', { x, y, class: 'wl-n' }); t.textContent = 4; g.append(t);
      svg.append(g);
    }
    for (let i = 0; i <= 20; i++) { const [x1, y1] = pt(i * 5, RAD), [x2, y2] = pt(i * 5, RAD - (i % 5 ? 5 : 9)); svg.append(el('line', { x1, y1, x2, y2, class: 'wl-tick' })); }
    svg.append(el('path', { d: wedge(0, 100), class: 'wl-rim' }));
    const needle = el('g', { class: 'wl-needle' }), line = el('line', { x1: CX, y1: CY, x2: CX, y2: CY - RAD + 6 });
    needle.append(line, el('circle', { cx: CX, cy: CY, r: 9 }));
    const set = (v) => { value = Math.max(0, Math.min(100, Math.round(v * 2) / 2)); needle.setAttribute('transform', 'rotate(' + (value / 100 * 180 - 90) + ' ' + CX + ' ' + CY + ')'); svg.setAttribute('aria-valuenow', value); };
    if (value != null) { svg.append(needle); set(value); }
    if (onChange) {
      let drag = false;
      const move = (e) => {
        const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 220 - CX, y = CY - (e.clientY - r.top) / r.height * 122;
        const a = y < 0 ? (x < 0 ? Math.PI : 0) : Math.atan2(y, x);
        set((1 - a / Math.PI) * 100); onChange(value);
      };
      svg.addEventListener('pointerdown', (e) => { drag = true; try { svg.setPointerCapture(e.pointerId); } catch (x) {} move(e); });
      svg.addEventListener('pointermove', (e) => drag && move(e));
      ['pointerup', 'pointercancel'].forEach((ev) => svg.addEventListener(ev, () => (drag = false)));
      svg.addEventListener('keydown', (e) => { const d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0; if (d) { e.preventDefault(); set(value + d); onChange(value); } });
    }
    return h('div', { class: 'mm' }, svg, h('div', { class: 'mm-ends' }, h('span', null, '← ' + L), h('span', null, R + ' →')));
  }
  C.register({
    id: 'onda', name: 'En la misma onda', emoji: '📡', color: '#b79cff', group: 'deduccion', min: 2,
    tag: 'Una escala, una pista y un grupo intentando leerte la mente.',
    how: [
      'Sale una rueda entre dos extremos, por ejemplo «sobrevalorado ↔ infravalorado».',
      'Quien da la pista ve en secreto dónde está la franja y escribe algo que, para él, caiga justo ahí.',
      'El resto debate y gira la aguja hasta donde cree que está la franja.',
      'Se destapa la rueda: el centro vale 4 puntos, los lados 3 y los bordes 2. Puntuáis todos juntos.',
    ],
    cats: [UNI, { id: 'clasico', label: 'Clásico' }, { id: 'absurdo', label: 'Absurdo' }, HOT],
    custom: { bank: 'onda', hint: 'Una escala por línea: extremo izquierdo|extremo derecho', fix: (x) => (x.includes('|') ? x : null) },
    settings: [{ key: 'rounds', label: 'Rondas por jugador', type: 'step', def: 1, min: 1, max: 4 }],
    play(ctx) {
      const P = ctx.players, s = ctx.s, total = s.rounds * P.length;
      let t = 0, score = 0;
      (function next() {
        if (t >= total) {
          const max = total * 4, pct = score / max;
          return ctx.show(h('div', { class: 'center' }, C.secret(pct >= 0.75 ? '🧠' : pct >= 0.45 ? '📡' : '📵', 'Puntuación del grupo', score + ' de ' + max, pct >= 0.75 ? 'Compartís cerebro.' : pct >= 0.45 ? 'Buena sintonía, con interferencias.' : 'Sin cobertura.'),
            C.shareBtn('En la misma onda', ['Sintonía del grupo', score + ' de ' + max + ' puntos'], '#b79cff'), ctx.endBar()));
        }
        const giver = t++ % P.length, [L, R] = C.draw('onda', C.pool(C.content.onda, s.cats)).split('|'), target = 5 + C.rnd(91);
        let clue = '';
        C.pass(ctx, [P[giver]], () => {
          const inp = h('input', { type: 'text', class: 'textin', maxLength: 40, placeholder: 'Tu pista (una persona, cosa, situación…)', autocomplete: 'off' });
          return { node: h('div', { class: 'stack' }, h('p', { class: 'muted' }, 'Piensa algo que, entre estos dos extremos, caiga justo en el 4. No digas números ni posiciones.'), scale(L, R, target, null), inp),
            before: () => (inp.value.trim() ? void (clue = inp.value.trim()) : 'Escribe una pista.') };
        }, () => {
          let v = 50;
          ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, 'Ronda ' + t + ' de ' + total + ' · pista de ' + P[giver]), h('div', { class: 'card q' }, '«' + clue + '»'),
            scale(L, R, null, 50, (x) => (v = x)), h('p', { class: 'muted' }, 'Debatid y girad la aguja. ' + P[giver] + ' no puede dar más pistas.'),
            btn('Destapar la rueda', () => {
              const got = ondaPts(Math.abs(v - target));
              score += got;
              got >= 3 ? C.sound.ok() : got ? 0 : C.sound.bad();
              ctx.show(h('div', { class: 'center' }, h('div', { class: 'card q' }, '«' + clue + '»'), scale(L, R, target, v, null, true),
                h('h2', null, ['Fuera de la franja', '', 'Rozando: +2', 'Muy cerca: +3', '¡En el centro! +4'][got]), h('p', { class: 'lead' }, 'Lleváis ' + score + ' puntos.'),
                btn(t >= total ? 'Ver resultado' : 'Siguiente ronda', next, 'primary big')));
            }, 'primary big')));
        }, { verb: 'Ver la franja', note: 'Solo ' + P[giver] + ' puede mirar.', lastLabel: 'Ocultar y enseñar la pista' });
      })();
    },
  });

  /* ---------- Contraseña (tabú inverso) ---------- */
  C.register({
    id: 'contrasena', name: 'Contraseña', emoji: '🔐', color: '#ffc93c', group: 'palabras', min: 2,
    tag: 'Pistas de una sola palabra. Cuantas menos gastes, más puntos.',
    how: [
      'Quien da las pistas ve una palabra secreta.',
      'Solo puede decir UNA palabra como pista; los demás tienen un intento para adivinarla.',
      'Si fallan, da otra pista de una sola palabra, y así hasta agotar las pistas.',
      'Acertar a la primera vale el máximo; cada pista extra resta un punto.',
    ],
    cats: [UNI, { id: 'animales', label: 'Animales' }, { id: 'acciones', label: 'Acciones' }, { id: 'oficios', label: 'Oficios' }, { id: 'objetos', label: 'Objetos' }, { id: 'famosos', label: 'Personajes' }, HOT],
    settings: [
      { key: 'teams', label: 'Jugar por equipos', type: 'toggle', def: false, help: 'Dos equipos alternos; adivina solo el equipo de quien da la pista.' },
      { key: 'max', label: 'Pistas máximas', type: 'select', def: 5, options: [[3, '3'], [5, '5']] },
      { key: 'rounds', label: 'Turnos por jugador', type: 'step', def: 2, min: 1, max: 5 },
    ],
    validate: (s, n) => (s.teams && n < 4 ? 'Para jugar por equipos hacen falta al menos 4 jugadores.' : null),
    play(ctx) {
      const P = ctx.players, s = ctx.s, total = s.rounds * P.length;
      const sides = s.teams ? ['Equipo A', 'Equipo B'] : P, pts = sides.map(() => 0), side = (i) => (s.teams ? i % 2 : i);
      let t = 0;
      (function next() {
        if (t >= total) return ctx.show(ctx.finish(sides, pts, ' pts', s.teams));
        const cur = t++ % P.length, word = C.draw('contrasena', C.pool(C.content.charadas, s.cats));
        let used = 1;
        const done = (got) => {
          pts[side(cur)] += got;
          got ? C.sound.ok() : C.sound.bad();
          ctx.show(h('div', { class: 'center' }, h('div', { class: 'card q' }, h('small', null, 'La palabra era'), word), h('h2', null, got ? '+' + got + (got === 1 ? ' punto' : ' puntos') : 'Sin puntos'),
            C.scores(sides, pts, ' pts'), btn(t >= total ? 'Ver clasificación' : 'Siguiente turno', next, 'primary big')));
        };
        const round = () => ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, P[cur] + ' · pista ' + used + ' de ' + s.max), h('div', { class: 'card word' }, word),
          h('p', { class: 'muted' }, 'Di una sola palabra. No valen gestos ni palabras de la misma familia.'),
          btn('¡Acertada!', () => done(s.max - used + 1), 'yes big'),
          used < s.max ? btn('Han fallado: otra pista', () => { used++; round(); }, 'mid') : btn('No la han adivinado', () => done(0), 'no')));
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'lead' }, 'Da las pistas'), h('h2', { class: 'name' }, P[cur]),
          s.teams && h('p', { class: 'pill' }, sides[side(cur)] + ' adivina'), h('p', { class: 'muted' }, 'Que solo ' + P[cur] + ' vea la pantalla.'), btn('Ver la palabra', round, 'primary big')));
      })();
    },
  });
})(Corrillo);
