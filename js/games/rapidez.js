/* Juegos contrarreloj: «La Bomba», «Charadas» y «Palabras prohibidas». */
(function (C) {
  const { h, btn } = C;
  const durations = [[30, '30 s'], [60, '60 s'], [90, '90 s'], [120, '2 min']];

  /* ---------- La Bomba ---------- */
  C.register({
    id: 'bomba', party: true, custom: { bank: 'bomba', hint: 'Una categoría por línea. Ej.: Profesores de la facultad' }, name: 'La Bomba', emoji: '💣', color: '#ff6b5e', group: 'palabras', min: 2,
    tag: 'Di algo y pasa el móvil. Al explotar, indicad a quién le tocó.',
    how: ['Leed la categoría y encended la mecha.', 'Decid respuestas sin repetir y pasad el móvil físicamente, sin tocar botones.', 'La duración es aleatoria entre los límites elegidos. El tiempo se oculta por defecto.', 'Al sonar la explosión, marcad a quien tenía el móvil. Podéis jugar sin final, por explosiones o por vidas.'],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'facil', label: 'Para calentar' }, { id: 'cultura', label: 'Cultura' }, { id: 'ocio', label: 'Ocio' }, { id: 'ingenio', label: 'Ingenio' }, { id: 'fiesta', label: '🎉 De fiesta' }, { id: 'picante', label: 'Picante', spicy: true }],
    settings: [
      { key: 'format', label: 'Final de la partida', type: 'select', def: 'open', options: [['open', 'Abierta'], ['explosions', 'Por explosiones'], ['lives', 'Por vidas']] },
      { key: 'explosions', label: 'Explosiones', type: 'step', def: 5, min: 1, max: 100, show: (s) => s.format === 'explosions' },
      { key: 'lives', label: 'Vidas iniciales', type: 'step', def: 3, min: 1, max: 10, show: (s) => s.format === 'lives' },
      { key: 'fuse', label: 'Mecha', type: 'select', def: 'custom', options: [['custom', 'Elegir límites'], ['corta', 'Corta (10–25 s)'], ['media', 'Media (20–45 s)'], ['larga', 'Larga (40–75 s)']] },
      { key: 'minimum', label: 'Mínimo de segundos', type: 'step', def: 15, min: 1, max: 300, show: (s) => s.fuse === 'custom' },
      { key: 'maximum', label: 'Máximo de segundos', type: 'step', def: 45, min: 1, max: 300, show: (s) => s.fuse === 'custom' },
      { key: 'visible', label: 'Mostrar cuánto falta', type: 'toggle', def: false },
      { key: 'tick', label: 'Tictac sonoro', type: 'toggle', def: true },
    ],
    validate: (s) => s.fuse === 'custom' && s.minimum > s.maximum ? 'El mínimo no puede superar al máximo.' : null,
    play(ctx) {
      const P = ctx.players, s = ctx.s, booms = P.map(() => 0);
      const range = s.fuse === 'custom' ? [s.minimum, s.maximum] : { corta: [10, 25], media: [20, 45], larga: [40, 75] }[s.fuse];
      const remaining = () => P.map((_, i) => i).filter((i) => s.format !== 'lives' || booms[i] < s.lives);
      let rounds = 0;
      function ready() {
        if (ctx.turn()) return;
        const cat = C.draw('bomba', C.pool(C.content.bomba, s.cats));
        ctx.show(h('div', { class: 'center' }, h('div', { class: 'card q' }, h('small', null, 'Categoría'), cat),
          h('p', { class: 'lead' }, 'Empieza ' + P[C.pick(remaining())]), h('p', { class: 'muted' }, 'Sin pulsar al pasar. Al explotar, elegid a quién le tocó.'),
          btn('Encender la mecha', run, 'primary big')));
      }
      function run() {
        C.sound.unlock();
        let settled = false, lastTick = -1;
        const seconds = range[0] + Math.random() * (range[1] - range[0]);
        const clock = C.clock(ctx, seconds, () => {
          if (settled) return; settled = true; C.sound.boom(); C.commit();
          ctx.show(h('div', { class: 'center' }, h('div', { class: 'big-emoji' }, '💥'), h('h2', null, '¿A quién le ha explotado?'),
            remaining().map((i) => btn(P[i], () => result(i), 'big'))));
        });
        clock.silent = true;
        clock.onTick = (left) => { if (s.tick && left !== lastTick) C.sound.beep(900, 0.04); lastTick = left; };
        clock.el.hidden = !s.visible;
        ctx.show(h('div', { class: 'center bomb-running' }, s.visible ? clock.el : h('div', { class: 'bomb', 'aria-label': 'La mecha sigue encendida' }, '💣'),
          !s.visible && h('p', { class: 'muted' }, 'Cuenta atrás oculta')));
      }
      function result(i) {
        booms[i]++; rounds++;
        ctx.progress = { names: P.slice(), points: booms.map((n) => -n), unit: ' pts', type: 'competitive', complete: false };
        const finished = s.format === 'explosions' && rounds >= s.explosions || s.format === 'lives' && remaining().length === 1;
        if (finished) return ctx.show(ctx.finish(P, s.format === 'lives' ? booms.map((n) => Math.max(0, s.lives - n)) : booms.map((n) => -n), s.format === 'lives' ? ' vidas' : ' pts'));
        ctx.show(h('div', { class: 'center' }, h('h2', null, 'Le ha explotado a ' + P[i]), C.penalty(P[i]),
          h('div', { class: 'list' }, P.map((name, j) => h('div', { class: 'item' }, name, h('b', null, s.format === 'lives' ? Math.max(0, s.lives - booms[j]) + ' vidas' : booms[j] + ' 💥')))),
          btn('Otra bomba', ready, 'primary big')));
      }
      ready();
    },
  });

  /* ---------- Charadas ---------- */
  C.register({
    id: 'charadas', teamBased: true, custom: { bank: 'charadas', hint: 'Una palabra o expresión por línea.' }, name: 'Charadas', emoji: '🙆', color: '#5cb8ff', group: 'palabras', min: 2,
    tag: 'Móvil en la frente o Cuatro rondas por equipos.', search: '4 fases cuatro fases descripción palabra mímica sonidos',
    how: [
      'Quien adivina se pone el móvil en la frente, con la pantalla hacia el grupo.',
      'Los demás describen o hacen mímica de la palabra, según el modo elegido.',
      'Con cada acierto, alguien del grupo toca «Correcto»; si se atasca, «Pasar».',
      'Cuando acaba el tiempo se cuentan los aciertos y le toca al siguiente.',
      'En Cuatro rondas se juega por equipos con el mismo mazo: descripción, una palabra, mímica y sonidos. Cada turno dura 60 segundos; la fase siguiente empieza el equipo posterior al que agotó el mazo.',
    ],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'animales', label: 'Animales' }, { id: 'acciones', label: 'Acciones' }, { id: 'oficios', label: 'Oficios' }, { id: 'objetos', label: 'Objetos' }, { id: 'famosos', label: 'Personajes' }, { id: 'peliculas', label: '🎬 Películas y series' }, { id: 'picante', label: 'Picante', spicy: true }],
    settings: [
      { key: 'format', label: 'Formato', type: 'select', def: 'classic', options: [['classic', 'Charadas'], ['cuatro', 'Cuatro rondas por equipos']] },
      { key: 'deckSource', label: 'Mazo de Cuatro rondas', type: 'select', def: 'mix', options: [['catalog', 'Catálogo'], ['custom', 'Solo propias y aportaciones'], ['mix', 'Mezclar todo']], show: (s) => s.format === 'cuatro' },
      { key: 'deckSize', label: 'Cartas del mazo', type: 'step', def: 30, min: 1, max: 100, show: (s) => s.format === 'cuatro' },
      { key: 'startTeam', label: 'Equipo que empieza (0 = al azar)', type: 'step', def: 0, min: 0, max: (n, s) => s.teamCount || 2, show: (s) => s.format === 'cuatro' },
      { key: 'duration', label: 'Duración del turno', type: 'select', def: 60, options: durations, show: (s) => s.format !== 'cuatro' },
      { key: 'mode', label: 'Pistas permitidas', type: 'select', def: 'libre', options: [['libre', 'Describir y gestos'], ['mimica', 'Solo mímica'], ['palabra', 'Una sola palabra']], show: (s) => s.format !== 'cuatro' },
      { key: 'rounds', label: 'Turnos por jugador', type: 'step', def: 1, min: 1, max: 5, show: (s) => s.format !== 'cuatro' },
      { key: 'tilt', label: 'Marcar inclinando el móvil', type: 'toggle', def: false, help: 'Calibra la posición al empezar. Los botones siguen funcionando.', show: (s) => s.format !== 'cuatro' },
    ].concat(C.teamSettings()),
    validate: (s, n) => s.format === 'cuatro' && n < 4 ? 'Cuatro rondas necesita al menos dos equipos de dos personas.' : null,

    play(ctx) {
      if (ctx.s.format === 'cuatro') return C.playCuatro(ctx);
      const P = ctx.players, s = ctx.s, pts = P.map(() => 0), total = s.rounds * P.length;
      let onTilt = null, orientation = null, neutral = null, axis = 'beta', tiltEnabled = false;
      const tilt = (e) => { if (Number.isFinite(e.beta) || Number.isFinite(e.gamma)) orientation = { beta: e.beta, gamma: e.gamma }; if (onTilt) C.run(() => onTilt(e), ctx); };
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
          h('p', { class: 'muted' }, 'Ponte el móvil en la frente, también en horizontal si prefieres. ' + rule), btn('¡Listo!', async () => {
            if (!s.tilt) return count(3);
            const note = h('p', { class: 'warn', role: 'status' });
            try {
              if (!window.DeviceOrientationEvent) throw new Error('Este navegador no ofrece sensores de inclinación.');
              if (DeviceOrientationEvent.requestPermission && await DeviceOrientationEvent.requestPermission() !== 'granted') throw new Error('Permiso de inclinación denegado. Puedes seguir usando los botones.');
            } catch (e) { note.textContent = e.message || 'No se pudo acceder al sensor. Puedes usar los botones.'; }
            ctx.show(h('div', { class: 'center' }, h('h2', null, 'Calibrar posición neutral'),
              h('p', { class: 'muted' }, 'Coloca el móvil como lo vas a sostener y mantenlo quieto. La cuenta atrás empieza después de calibrar.'), note,
              btn('Calibrar y empezar', () => {
                if (!orientation) { note.textContent = 'Todavía no hay datos del sensor. Espera un momento o continúa con botones.'; return; }
                axis = Math.abs(orientation.gamma || 0) > Math.abs(orientation.beta || 0) ? 'gamma' : 'beta';
                neutral = orientation[axis]; tiltEnabled = Number.isFinite(neutral); count(3);
              }, 'primary big'), btn('Continuar con botones', () => { tiltEnabled = false; count(3); }, 'small')));
          }, 'primary big')));

        function count(n) {
          if (!ctx.alive) return;
          if (!n) return go();
          C.sound.beep(500, 0.1, 'sine', 0.2);
          ctx.show(h('div', { class: 'word' }, n));
          to = setTimeout(() => C.run(() => count(n - 1), ctx), 800);
        }
        function go() {
          ctx.private = true;
          const clock = C.clock(ctx, s.duration, end), word = h('div', { class: 'card word' });
          const pool = C.pool(C.content.charadas, s.cats);
          let w;
          const draw = () => { w = C.draw('charadas', pool); word.textContent = w; };
          const mark = (ok) => { if (clock.paused || !clock.el.isConnected) return; log.push([w, ok]); ok ? C.sound.ok() : C.sound.beep(300, 0.08); draw(); };
          draw();
          /* Móvil vertical en la frente: beta ≈ 90°. Pantalla hacia el suelo → correcto; hacia el techo → pasar. */
          let armed = false;
          onTilt = !tiltEnabled ? null : (e) => {
            if (!Number.isFinite(e[axis])) return;
            const delta = (e[axis] - neutral + 540) % 360 - 180;
            if (Math.abs(delta) < 12) armed = true;
            else if (armed && Math.abs(delta) > 35) { armed = false; mark(delta > 0); }
          };
          ctx.show(h('div', { class: 'center' }, clock.el, word, h('div', { class: 'row2', style: 'width:100%' }, btn('Pasar', () => mark(false), 'mid big'), btn('Correcto', () => mark(true), 'yes big'))));
        }
        function end() {
          ctx.private = false;
          onTilt = null;
          const hits = log.filter((x) => x[1]).length;
          pts[cur] += hits;
          ctx.progress = { names: P.slice(), points: pts.slice(), unit: ' aciertos', type: 'competitive', complete: false };
          ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, P[cur]), h('h2', null, hits + (hits === 1 ? ' acierto' : ' aciertos')),
            h('div', { class: 'list' }, log.map(([w, ok]) => h('div', { class: 'item ' + (ok ? 'hit' : 'miss') }, h('span', null, w), h('b', null, ok ? '✓' : '—')))),
            btn(t >= total ? 'Ver clasificación' : 'Siguiente jugador', turn, 'primary big')));
        }
      })();
    },
  });

  /* ---------- Palabras prohibidas ---------- */
  C.register({
    id: 'prohibidas', name: 'Palabras prohibidas', emoji: '🚫', color: '#b79cff', group: 'palabras', min: 2, teamBased: true,
    custom: { bank: 'prohibidas', hint: 'Palabra|prohibida 1,prohibida 2,prohibida 3,prohibida 4,prohibida 5', fix: (line) => {
      const parts = line.split('|'); return parts.length === 2 && parts[0].trim() && parts[1].split(',').length === 5 && parts[1].split(',').every((word) => word.trim()) ? line : null;
    } },
    tag: 'Describe la palabra sin usar las cinco que tienes vetadas.',
    how: [
      'Quien describe ve una palabra principal y cinco palabras prohibidas.',
      'Debe conseguir que su equipo (o el grupo) la adivine sin decir ninguna de ellas.',
      'Alguien vigila la pantalla: si se escapa una prohibida, falta y un punto menos.',
      'Cuantos más aciertos antes de que acabe el tiempo, mejor.',
    ],
    cats: [{ id: 'uni', label: '🎓 Universidad' }, { id: 'facil', label: 'Fáciles' }, { id: 'media', label: 'Intermedias' }, { id: 'dificil', label: 'Difíciles' }],
    settings: [
      { key: 'teams', label: 'Jugar por equipos', type: 'toggle', def: false, help: 'Dos o más equipos, con los mismos turnos para cada uno.' },
      { key: 'duration', label: 'Duración del turno', type: 'select', def: 60, options: durations },
      { key: 'rounds', label: 'Turnos por jugador o equipo', type: 'step', def: 1, min: 1, max: 5 },
      { key: 'penalty', label: 'Las faltas restan un punto', type: 'toggle', def: true },
    ].concat(C.teamSettings()),
    validate: (s, n) => (s.teams && n < 4 ? 'Para jugar por equipos hacen falta al menos 4 jugadores.' : null),

    play(ctx) {
      const P = ctx.players, s = ctx.s, teams = s.teams ? C.teamsOf(P, s) : null, total = s.rounds * (teams ? teams.length : P.length);
      const sides = teams ? teams.map((team) => team.name) : P, pts = sides.map(() => 0);
      const side = (i) => teams ? teams.findIndex((team) => team.indices.includes(i)) : i;
      let t = 0;
      (function turn() {
        ctx.private = false;
        if (t >= total) return ctx.show(ctx.finish(sides, pts, ' pts', teams));
        const cur = teams ? C.teamTurn(teams, t).player : t % P.length, tally = { ok: 0, bad: 0, skip: 0 };
        t++;
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'lead' }, 'Describe'), h('h2', { class: 'name' }, P[cur]),
          s.teams && h('p', { class: 'pill' }, sides[side(cur)] + ': ' + P.filter((_, i) => side(i) === side(cur) && i !== cur).join(', ') + ' adivinan'),
          h('p', { class: 'muted' }, 'Alguien del otro bando vigila la pantalla para cazar las palabras prohibidas.'), btn('Empezar', go, 'primary big')));

        function go() {
          ctx.private = true;
          const clock = C.clock(ctx, s.duration, end), card = h('div', { class: 'card tabu' }), pool = C.pool(C.content.prohibidas, s.cats);
          const draw = () => { const [w, f] = C.draw('prohibidas', pool).split('|'); card.replaceChildren(h('h2', null, w), h('ul', null, f.split(',').map((x) => h('li', null, '🚫 ' + x)))); };
          const mark = (k) => { tally[k]++; k === 'ok' ? C.sound.ok() : k === 'bad' ? C.sound.bad() : 0; draw(); };
          draw();
          ctx.show(h('div', { class: 'center' }, clock.el, card,
            h('div', { class: 'row2', style: 'width:100%;grid-template-columns:1fr 1fr 1fr' }, btn('Falta', () => mark('bad'), 'no'), btn('Pasar', () => mark('skip'), 'mid'), btn('Acierto', () => mark('ok'), 'yes'))));
        }
        function end() {
          ctx.private = false;
          const got = tally.ok - (s.penalty ? tally.bad : 0);
          pts[side(cur)] += got;
          ctx.progress = { names: sides.slice(), points: pts.slice(), unit: ' pts', type: 'competitive', complete: false };
          ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, P[cur]), h('h2', null, (got > 0 ? '+' : '') + got + (Math.abs(got) === 1 ? ' punto' : ' puntos')),
            h('p', { class: 'lead' }, 'Aciertos: ' + tally.ok + ' · Faltas: ' + tally.bad + ' · Pases: ' + tally.skip), C.scores(sides, pts, ' pts'),
            btn(t >= total ? 'Ver clasificación' : 'Siguiente turno', turn, 'primary big')));
        }
      })();
    },
  });
})(Corrillo);
