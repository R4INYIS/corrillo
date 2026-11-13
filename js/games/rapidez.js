/* Juegos contrarreloj: «La Bomba», «Charadas» y «Palabras prohibidas». */
(function (C) {
  const { h, btn } = C;
  const durations = [[30, '30 s'], [60, '60 s'], [90, '90 s'], [120, '2 min']];

  /* ---------- La Bomba ---------- */
  C.register({
    id: 'bomba', party: true, custom: { bank: 'bomba', hint: 'Una categoría por línea. Ej.: Profesores de la facultad' }, name: 'La Bomba', emoji: '💣', color: '#ff6b5e', group: 'palabras', min: 2,
    tag: 'Di algo de la categoría y pasa el móvil antes de que explote.',
    how: [
      'Sale una categoría, por ejemplo «Marcas de coches».',
      'Quien tiene el móvil dice un elemento válido, pulsa el botón y lo pasa.',
      'No vale repetir. Nadie sabe cuándo explotará la bomba.',
      'Pierde la ronda quien tenga el móvil cuando explote.',
    ],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'facil', label: 'Para calentar' }, { id: 'cultura', label: 'Cultura' }, { id: 'ocio', label: 'Ocio' }, { id: 'ingenio', label: 'Ingenio' }, { id: 'fiesta', label: '🎉 De fiesta' }, { id: 'picante', label: 'Picante', spicy: true }],
    settings: [
      { key: 'fuse', label: 'Mecha', type: 'select', def: 'media', options: [['corta', 'Corta (10–25 s)'], ['media', 'Media (20–45 s)'], ['larga', 'Larga (40–75 s)']], help: 'El momento exacto de la explosión es aleatorio.' },
      { key: 'tick', label: 'Tictac sonoro', type: 'toggle', def: true },
    ],

    play(ctx) {
      const P = ctx.players, s = ctx.s, booms = P.map(() => 0);
      const range = { corta: [10, 25], media: [20, 45], larga: [40, 75] }[s.fuse];
      let cur = C.rnd(P.length), to = null;
      ctx.onExit(() => clearTimeout(to));

      function ready() {
        if (ctx.turn()) return;
        const cat = C.draw('bomba', C.pool(C.content.bomba, s.cats));
        ctx.show(h('div', { class: 'center' }, h('div', { class: 'card q' }, h('small', null, 'Categoría'), cat), h('p', { class: 'lead' }, 'Empieza ' + P[cur]),
          btn('Encender la mecha', () => run(cat), 'primary big')));
      }
      function run(cat) {
        const total = (range[0] + Math.random() * (range[1] - range[0])) * 1000, t0 = Date.now();
        const bomb = h('div', { class: 'bomb' }, '💣'), who = h('h2', { class: 'name' }, P[cur]);
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, cat), bomb, who,
          btn('¡Dicho! Pasa el móvil', () => { cur = (cur + 1) % P.length; who.textContent = P[cur]; }, 'primary big')));
        (function tick() {
          if (!ctx.alive) return;
          const el = Date.now() - t0;
          if (el >= total) return boom();
          if (s.tick) C.sound.beep(900, 0.04);
          bomb.classList.add('tick');
          setTimeout(() => bomb.classList.remove('tick'), 90);
          to = setTimeout(tick, Math.min(total - el, 850 - 620 * (el / total)));
        })();
      }
      function boom() {
        C.sound.boom();
        booms[cur]++;
        ctx.show(h('div', { class: 'center' }, h('div', { class: 'bomb' }, '💥'), h('h2', null, 'Le ha explotado a ' + P[cur]), C.penalty(P[cur]),
          h('div', { class: 'list' }, P.map((p, i) => h('div', { class: 'item' + (i === cur ? ' miss' : '') }, h('span', null, p), h('b', null, '💥 ' + booms[i])))),
          btn('Otra bomba', ready, 'primary big'), h('div', { class: 'row2', style: 'width:100%' }, btn('Ajustes', ctx.setup), btn('Menú', ctx.menu))));
      }
      ready();
    },
  });

  /* ---------- Charadas ---------- */
  C.register({
    id: 'charadas', custom: { bank: 'charadas', hint: 'Una palabra o expresión por línea.' }, name: 'Charadas', emoji: '🙆', color: '#5cb8ff', group: 'palabras', min: 2,
    tag: 'Móvil en la frente: los demás te ayudan a adivinar.',
    how: [
      'Quien adivina se pone el móvil en la frente, con la pantalla hacia el grupo.',
      'Los demás describen o hacen mímica de la palabra, según el modo elegido.',
      'Con cada acierto, alguien del grupo toca «Correcto»; si se atasca, «Pasar».',
      'Cuando acaba el tiempo se cuentan los aciertos y le toca al siguiente.',
    ],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'animales', label: 'Animales' }, { id: 'acciones', label: 'Acciones' }, { id: 'oficios', label: 'Oficios' }, { id: 'objetos', label: 'Objetos' }, { id: 'famosos', label: 'Personajes' }, { id: 'peliculas', label: '🎬 Películas y series' }, { id: 'picante', label: 'Picante', spicy: true }],
    settings: [
      { key: 'duration', label: 'Duración del turno', type: 'select', def: 60, options: durations },
      { key: 'mode', label: 'Pistas permitidas', type: 'select', def: 'libre', options: [['libre', 'Describir y gestos'], ['mimica', 'Solo mímica'], ['palabra', 'Una sola palabra']] },
      { key: 'rounds', label: 'Turnos por jugador', type: 'step', def: 1, min: 1, max: 5 },
      { key: 'tilt', label: 'Marcar inclinando el móvil', type: 'toggle', def: false, help: 'Hacia abajo = correcto; hacia arriba = pasar. Los botones siguen funcionando.' },
    ],

    play(ctx) {
      const P = ctx.players, s = ctx.s, pts = P.map(() => 0), total = s.rounds * P.length;
      let onTilt = null;
      const tilt = (e) => onTilt && onTilt(e);
      window.addEventListener('deviceorientation', tilt);
      ctx.onExit(() => window.removeEventListener('deviceorientation', tilt));
      const rule = { libre: 'Vale describir y hacer gestos, sin decir la palabra.', mimica: 'Solo mímica: ni una palabra.', palabra: 'Cada pista es una única palabra.' }[s.mode];
      let t = 0, to = null;
      ctx.onExit(() => clearTimeout(to));
      (function turn() {
        if (t >= total) return ctx.show(ctx.finish(P, pts, ' aciertos'));
        const cur = t % P.length, log = [];
        t++;
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'lead' }, 'Adivina'), h('h2', { class: 'name' }, P[cur]),
          h('p', { class: 'muted' }, 'Ponte el móvil en la frente con la pantalla hacia los demás. ' + rule), btn('¡Listo!', () => {
            /* iOS exige pedir permiso para leer el giroscopio, y solo tras un toque del usuario. */
            try { if (s.tilt && window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().catch(() => {}); } catch (e) {}
            count(3);
          }, 'primary big')));

        function count(n) {
          if (!ctx.alive) return;
          if (!n) return go();
          C.sound.beep(500, 0.1, 'sine', 0.2);
          ctx.show(h('div', { class: 'word' }, n));
          to = setTimeout(() => count(n - 1), 800);
        }
        function go() {
          const clock = C.clock(ctx, s.duration, end), word = h('div', { class: 'card word' });
          const pool = C.pool(C.content.charadas, s.cats);
          let w;
          const draw = () => { w = C.draw('charadas', pool); word.textContent = w; };
          const mark = (ok) => { log.push([w, ok]); ok ? C.sound.ok() : C.sound.beep(300, 0.08); draw(); };
          draw();
          /* Móvil vertical en la frente: beta ≈ 90°. Pantalla hacia el suelo → correcto; hacia el techo → pasar. */
          let armed = true;
          onTilt = !s.tilt ? null : (e) => {
            if (e.beta == null) return;
            const b = Math.abs(e.beta);
            if (b > 60 && b < 120) armed = true;
            else if (armed && (b > 140 || b < 35)) { armed = false; mark(b > 140); }
          };
          ctx.show(h('div', { class: 'center' }, clock.el, word, h('div', { class: 'row2', style: 'width:100%' }, btn('Pasar', () => mark(false), 'mid big'), btn('Correcto', () => mark(true), 'yes big'))));
        }
        function end() {
          onTilt = null;
          const hits = log.filter((x) => x[1]).length;
          pts[cur] += hits;
          ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, P[cur]), h('h2', null, hits + (hits === 1 ? ' acierto' : ' aciertos')),
            h('div', { class: 'list' }, log.map(([w, ok]) => h('div', { class: 'item ' + (ok ? 'hit' : 'miss') }, h('span', null, w), h('b', null, ok ? '✓' : '—')))),
            btn(t >= total ? 'Ver clasificación' : 'Siguiente jugador', turn, 'primary big')));
        }
      })();
    },
  });

  /* ---------- Palabras prohibidas ---------- */
  C.register({
    id: 'prohibidas', name: 'Palabras prohibidas', emoji: '🚫', color: '#b79cff', group: 'palabras', min: 2,
    tag: 'Describe la palabra sin usar las cinco que tienes vetadas.',
    how: [
      'Quien describe ve una palabra principal y cinco palabras prohibidas.',
      'Debe conseguir que su equipo (o el grupo) la adivine sin decir ninguna de ellas.',
      'Alguien vigila la pantalla: si se escapa una prohibida, falta y un punto menos.',
      'Cuantos más aciertos antes de que acabe el tiempo, mejor.',
    ],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'facil', label: 'Fáciles' }, { id: 'media', label: 'Intermedias' }, { id: 'dificil', label: 'Difíciles' }],
    settings: [
      { key: 'teams', label: 'Jugar por equipos', type: 'toggle', def: false, help: 'Los jugadores se reparten en dos equipos alternos.' },
      { key: 'duration', label: 'Duración del turno', type: 'select', def: 60, options: durations },
      { key: 'rounds', label: 'Turnos por jugador', type: 'step', def: 1, min: 1, max: 5 },
      { key: 'penalty', label: 'Las faltas restan un punto', type: 'toggle', def: true },
    ],
    validate: (s, n) => (s.teams && n < 4 ? 'Para jugar por equipos hacen falta al menos 4 jugadores.' : null),

    play(ctx) {
      const P = ctx.players, s = ctx.s, total = s.rounds * P.length;
      const sides = s.teams ? ['Equipo A', 'Equipo B'] : P, pts = sides.map(() => 0);
      const side = (i) => (s.teams ? i % 2 : i);
      let t = 0;
      (function turn() {
        if (t >= total) return ctx.show(ctx.finish(sides, pts, ' pts', s.teams));
        const cur = t % P.length, tally = { ok: 0, bad: 0, skip: 0 };
        t++;
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'lead' }, 'Describe'), h('h2', { class: 'name' }, P[cur]),
          s.teams && h('p', { class: 'pill' }, sides[side(cur)] + ': ' + P.filter((_, i) => side(i) === side(cur) && i !== cur).join(', ') + ' adivinan'),
          h('p', { class: 'muted' }, 'Alguien del otro bando vigila la pantalla para cazar las palabras prohibidas.'), btn('Empezar', go, 'primary big')));

        function go() {
          const clock = C.clock(ctx, s.duration, end), card = h('div', { class: 'card tabu' }), pool = C.pool(C.content.prohibidas, s.cats);
          const draw = () => { const [w, f] = C.draw('prohibidas', pool).split('|'); card.replaceChildren(h('h2', null, w), h('ul', null, f.split(',').map((x) => h('li', null, '🚫 ' + x)))); };
          const mark = (k) => { tally[k]++; k === 'ok' ? C.sound.ok() : k === 'bad' ? C.sound.bad() : 0; draw(); };
          draw();
          ctx.show(h('div', { class: 'center' }, clock.el, card,
            h('div', { class: 'row2', style: 'width:100%;grid-template-columns:1fr 1fr 1fr' }, btn('Falta', () => mark('bad'), 'no'), btn('Pasar', () => mark('skip'), 'mid'), btn('Acierto', () => mark('ok'), 'yes'))));
        }
        function end() {
          const got = tally.ok - (s.penalty ? tally.bad : 0);
          pts[side(cur)] += got;
          ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, P[cur]), h('h2', null, (got > 0 ? '+' : '') + got + (Math.abs(got) === 1 ? ' punto' : ' puntos')),
            h('p', { class: 'lead' }, 'Aciertos: ' + tally.ok + ' · Faltas: ' + tally.bad + ' · Pases: ' + tally.skip), C.scores(sides, pts, ' pts'),
            btn(t >= total ? 'Ver clasificación' : 'Siguiente turno', turn, 'primary big')));
        }
      })();
    },
  });
})(Corrillo);
