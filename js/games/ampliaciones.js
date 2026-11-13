/* Ranking a ciegas, Pista única y Cuatro rondas (modalidad de Charadas). */
(function (C) {
  'use strict';
  const { h, btn } = C;
  C.register({
    id: 'ranking', name: 'Ranking a ciegas', emoji: '🏅', color: '#ff9a3d', group: 'preguntas', min: 1,
    tag: 'Coloca cada elemento sin saber lo que viene después.',
    how: ['Sale un elemento y hay que colocarlo en una posición libre.', 'Las posiciones elegidas quedan bloqueadas.', 'No hay puntuación: comentad vuestras decisiones.', 'En privado todos reciben el mismo orden y se comparan al terminar. En público cada persona recibe elementos distintos.'],
    cats: [{ id: 'planes', label: 'Planes' }, { id: 'comida', label: 'Comida' }, { id: 'uni', label: '🎓 Universidad' }, { id: 'poderes', label: 'Superpoderes' }, { id: 'convivencia', label: 'Convivencia' }, { id: 'absurdos', label: 'Absurdo' }],
    custom: { bank: 'ranking', hint: 'Un elemento por línea. Añade suficientes para completar las posiciones.' },
    settings: [
      { key: 'mode', label: 'Modalidad', type: 'select', def: 'consensus', options: [['consensus', 'Consenso del grupo'], ['public', 'Individual público'], ['private', 'Individual privado']] },
      { key: 'slots', label: 'Posiciones', type: 'select', def: 5, options: [[5, '5'], [10, '10']] },
    ],
    validate(s, n) {
      const needed = s.slots * (s.mode === 'public' ? n : 1), size = C.filterCards(C.pool(C.content.ranking, s.cats)).length;
      return size < needed ? 'Se necesitan ' + needed + ' elementos distintos; hay ' + size + '. Activa más categorías o añade contenido propio.' : null;
    },
    play(ctx) {
      const P = ctx.players, s = ctx.s, count = s.mode === 'consensus' ? 1 : P.length;
      const deck = C.selectCards('ranking', C.pool(C.content.ranking, s.cats), s.slots * (s.mode === 'public' ? count : 1)), rankings = Array.from({ length: count }, () => Array(s.slots).fill(null));
      if (deck.length < s.slots * (s.mode === 'public' ? count : 1)) throw new C.NoCards('No hay suficientes elementos distintos para el ranking.');
      const cards = (i) => s.mode === 'public' ? deck.slice(i * s.slots, (i + 1) * s.slots) : deck.slice(0, s.slots);
      function ranking(index, next) {
        const node = h('div', { class: 'stack' }), order = cards(index);
        let turn = 0;
        function draw() {
          const text = order[turn];
          if (C.offer) C.offer('ranking', text);
          node.replaceChildren(h('p', { class: 'pill' }, 'Elemento ' + (turn + 1) + ' de ' + s.slots), h('div', { class: 'card q' }, text),
            h('div', { class: 'rank-slots' }, rankings[index].map((placed, position) => h('button', { type: 'button', class: 'btn', disabled: placed != null, onclick: () => {
              if (rankings[index][position] != null) return;
              rankings[index][position] = text; C.commit(); turn++;
              turn === s.slots ? next() : draw();
            } }, (position + 1) + '. ' + (placed || 'Colocar aquí')))));
        }
        draw(); return node;
      }
      function results() {
        ctx.private = false;
        ctx.show(h('div', { class: 'center' }, h('h2', null, 'Vuestros rankings'),
          rankings.map((rows, i) => h('div', { class: 'card' }, h('h3', null, s.mode === 'consensus' ? 'Consenso del grupo' : P[i]), h('ol', null, rows.map((text) => h('li', null, text))))),
          C.shareBtn('Ranking a ciegas', rankings.flatMap((rows, i) => [s.mode === 'consensus' ? 'Grupo' : P[i]].concat(rows.map((text, j) => (j + 1) + '. ' + text))), '#ff9a3d'), ctx.endBar()));
      }
      if (s.mode === 'private') return C.pass(ctx, P, (_, i, forward) => ({ node: ranking(i, forward), noBtn: true }), results, { verb: 'Hacer mi ranking' });
      function publicTurn(i) {
        if (i === count) return results();
        const node = ranking(i, () => publicTurn(i + 1));
        ctx.show(h('div', { class: 'center' }, h('h2', null, s.mode === 'consensus' ? 'Decidid entre todos' : 'Decide ' + P[i]), node));
      }
      publicTurn(0);
    },
  });
  C.clueKey = (value) => value.trim().toLocaleLowerCase('es-ES').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  C.cancelClues = (clues, target) => {
    const keys = clues.map(C.clueKey), word = C.clueKey(target);
    return keys.map((key) => key === word || keys.filter((other) => other === key).length > 1);
  };
  C.content.pistaunica = Object.assign({}, C.content.charadas);
  C.register({
    id: 'pistaunica', name: 'Pista única', emoji: '💡', color: '#3dd6a3', group: 'palabras', min: 2, teamBased: true,
    tag: 'Ayudad a adivinar con pistas que no se repitan.',
    how: ['Una persona adivina; el resto de su grupo ve la palabra y escribe una pista de una palabra en privado.', 'Todas las pistas repetidas se anulan. Revisad familias de palabras y equivalencias sin que mire quien adivina.', 'Quien adivina ve solo las pistas válidas y tiene una respuesta. Puede intentarlo aunque no quede ninguna pista.', 'Un acierto suma uno; un fallo cero. En equipos se alternan palabras y todos reciben la misma cantidad.'],
    get cats() { return C.games.find((g) => g.id === 'charadas').cats; },
    custom: { bank: 'pistaunica', hint: 'Una palabra o expresión por línea.' },
    settings: [
      { key: 'mode', label: 'Modalidad', type: 'select', def: 'coop', options: [['coop', 'Cooperativo'], ['equipos', 'Competir por equipos']] },
      { key: 'rounds', label: 'Turnos como adivinador por persona', type: 'step', def: 1, min: 1, max: 5, show: (s) => s.mode === 'coop' },
      { key: 'words', label: 'Palabras por equipo', type: 'step', def: 5, min: 1, max: 50, show: (s) => s.mode === 'equipos' },
    ].concat(C.teamSettings()),
    validate: (s, n) => s.mode === 'equipos' && n < 4 ? 'Hacen falta al menos cuatro personas para dos equipos.' : null,
    play(ctx) {
      const P = ctx.players, s = ctx.s, teams = s.mode === 'equipos' ? C.teamsOf(P, s) : null;
      const sides = teams ? teams.map((team) => team.name) : ['Grupo'], points = sides.map(() => 0), total = teams ? teams.length * s.words : P.length * s.rounds;
      let turn = 0;
      function next() {
        ctx.private = false;
        if (turn >= total) return ctx.show(ctx.finish(sides, points, ' aciertos', teams || { type: 'cooperative' }));
        const role = teams ? C.teamTurn(teams, turn) : { side: 0, player: turn % P.length };
        const guesser = role.player, helpers = (teams ? teams[role.side].indices : P.map((_, i) => i)).filter((i) => i !== guesser);
        const target = C.draw('pistaunica', C.pool(C.content.pistaunica, s.cats)), clues = [];
        turn++;
        ctx.show(h('div', { class: 'center' }, h('h2', null, 'Adivina ' + P[guesser]),
          h('p', { class: 'muted' }, 'Quien adivina no mira hasta que se hayan revisado las pistas.'),
          helpers.length === 1 && h('p', { class: 'muted' }, 'Con una sola pista no habrá coincidencias. Recomendado: tres o más por grupo.'),
          btn('Recoger pistas', () => C.pass(ctx, helpers.map((i) => P[i]), (_, i) => {
            const input = h('input', { class: 'textin', maxLength: 40, placeholder: 'Una palabra', autocomplete: 'off', 'aria-label': 'Tu pista' });
            return { node: h('div', { class: 'stack' }, C.secret('💡', 'La palabra es', target), input), before: () => {
              const clue = input.value.trim(); if (!clue || /\s/.test(clue)) return 'Escribe una única palabra, sin espacios.';
              clues[i] = clue;
            } };
          }, review, { verb: 'Escribir mi pista' }), 'primary big')));
        function review() {
          const cancelled = C.cancelClues(clues, target);
          C.pass(ctx, [P[helpers[0]]], (_, i, forward) => ({ noBtn: true, node: h('div', { class: 'stack' }, C.secret('📝', 'Revisión sin el adivinador', target),
            h('p', { class: 'muted' }, 'Las coincidencias se anulan todas. Marca también pistas inválidas, equivalentes o de la misma familia.'),
            clues.map((clue, j) => h('label', { class: 'srow' }, clue + (cancelled[j] ? ' · anulada' : ''), h('input', { type: 'checkbox', checked: cancelled[j], disabled: cancelled[j], 'aria-label': 'Anular ' + clue, onchange: (e) => cancelled[j] = e.target.checked }))),
            btn('Confirmar pistas válidas', forward, 'primary big')) }), () => {
            const valid = clues.filter((_, i) => !cancelled[i]);
            C.pass(ctx, [P[guesser]], () => ({ noBtn: true, node: h('div', { class: 'stack' }, h('h2', null, 'Tus pistas'),
              valid.length ? valid.map((clue) => h('div', { class: 'card q' }, clue)) : h('p', { class: 'lead' }, 'Se han anulado todas. Puedes intentar adivinar a ciegas.'),
              h('p', { class: 'muted' }, 'Di una sola respuesta en voz alta.'), btn('Ya he dicho mi respuesta', verdict, 'primary big')) }), () => {}, { verb: 'Ver mis pistas' });
          }, { verb: 'Revisar pistas' });
        }
        function verdict() {
          ctx.private = false;
          let settled = false;
          const mark = (correct) => {
            if (settled) return; settled = true; C.commit(); if (correct) points[role.side]++;
            ctx.progress = { names: sides.slice(), points: points.slice(), unit: ' aciertos', type: teams ? 'competitive' : 'cooperative', complete: false };
            ctx.show(h('div', { class: 'center' }, h('h2', null, correct ? '¡Acertada!' : 'Esta no ha salido'), C.scores(sides, points, ' aciertos'), btn('Continuar', next, 'primary big')));
          };
          ctx.show(h('div', { class: 'center' }, C.secret('✅', 'La palabra era', target), h('p', { class: 'muted' }, 'El grupo valida la respuesta.'),
            btn('Ha acertado', () => mark(true), 'yes big'), btn('Ha fallado', () => mark(false), 'no big')));
        }
      }
      next();
    },
  });
  C.catalog.ranking = ['conversacion', 5]; C.catalog.pistaunica = ['deduccion', 15];
  C.playCuatro = (ctx) => {
    const P = ctx.players, s = ctx.s, teams = C.teamsOf(P, s), points = teams.map(() => 0), turns = teams.map(() => 0);
    const extra = h('textarea', { class: 'textin', rows: 4, placeholder: 'Una palabra o frase por línea', 'aria-label': 'Aportaciones de esta partida' });
    const error = h('p', { class: 'warn', role: 'status' });
    const save = h('input', { type: 'checkbox', 'aria-label': 'Guardar también las aportaciones en el dispositivo' });
    const phases = ['Descripción libre, sin decir la palabra ni su familia.', 'Una única palabra como pista.', 'Solo mímica: sin palabras ni sonidos.', 'Solo sonidos: sin palabras ni gestos.'];
    let deck = [], pending = [], phase = 0, side = s.startTeam ? s.startTeam - 1 : C.rnd(teams.length);
    ctx.show(h('div', { class: 'center' }, h('h2', null, 'Preparad el mazo de Cuatro rondas'),
      h('p', { class: 'muted' }, 'Podéis añadir palabras, nombres y bromas antes de jugar. Las aportaciones solo se conservan en esta partida salvo que marquéis guardar.'), extra,
      h('label', { class: 'srow' }, 'Guardar también estas aportaciones', save), error,
      btn('Crear mazo y empezar', () => {
        const additions = C.unique(extra.value.split('\n').map((line) => line.trim()).filter(Boolean));
        const factory = C.pool(C.content.charadas, s.cats.filter((id) => id !== 'custom')), custom = C.content.charadas.custom || [];
        const pool = C.filterCards(C.unique((s.deckSource === 'custom' ? custom : s.deckSource === 'catalog' ? factory : factory.concat(custom)).concat(additions)));
        if (!pool.length) { error.textContent = 'Añade al menos una palabra o activa contenido del catálogo.'; return; }
        if (additions.some((word) => word.length > 100)) { error.textContent = 'Cada aportación puede tener hasta 100 caracteres.'; return; }
        if (save.checked) {
          const value = C.unique(custom.concat(additions)); C.explicitSet('custom:charadas', value); C.content.charadas.custom = value;
        }
        deck = C.selectCards('cuatro', pool, s.deckSize); pending = C.shuffle(deck); prepare();
      }, 'primary big')));
    function prepare() {
      ctx.private = false;
      const speaker = teams[side].indices[turns[side] % teams[side].indices.length];
      ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, 'Fase ' + (phase + 1) + ' de 4 · ' + pending.length + ' cartas pendientes'),
        h('h2', null, teams[side].name), h('p', { class: 'lead' }, 'Da pistas ' + P[speaker]), h('p', { class: 'muted' }, phases[phase]),
        h('p', { class: 'muted' }, '60 segundos. Pasar no resta; la carta vuelve a pendientes.'), btn('Empezar turno', () => run(speaker), 'primary big')));
    }
    function run(speaker) {
      ctx.private = true; turns[side]++;
      const card = h('div', { class: 'card word' }), log = [];
      let current, settled = false;
      const clock = C.clock(ctx, 60, () => finishTurn(false));
      function draw() { current = pending.pop(); card.textContent = current; if (C.offer) C.offer('cuatro', current); }
      function mark(correct) {
        if (settled || clock.paused) return;
        log.push([current, correct]);
        if (correct) { points[side]++; C.commit(); } else { C.skip('cuatro'); pending.unshift(current); }
        if (!pending.length) { clock.stop(); finishTurn(true); } else draw();
      }
      function finishTurn(exhausted) {
        if (settled) return; settled = true; ctx.private = false;
        if (!exhausted && current != null) { pending.unshift(current); C.skip('cuatro'); }
        ctx.progress = { names: teams.map((team) => team.name), points: points.slice(), unit: ' pts', type: 'competitive', complete: false };
        const nextSide = (side + 1) % teams.length;
        ctx.show(h('div', { class: 'center' }, h('h2', null, teams[side].name + ': ' + log.filter((row) => row[1]).length + ' aciertos'),
          C.scores(teams.map((team) => team.name), points, ' pts'),
          exhausted && h('p', { class: 'lead' }, phase === 3 ? '¡Mazo completado en las cuatro fases!' : 'Mazo agotado. Empieza la siguiente fase ' + teams[nextSide].name + ', con 60 segundos nuevos.'),
          btn(exhausted && phase === 3 ? 'Ver clasificación' : 'Continuar', () => {
            if (exhausted && phase === 3) return ctx.show(ctx.finish(teams.map((team) => team.name), points, ' pts', teams));
            side = nextSide;
            if (exhausted) { phase++; pending = C.shuffle(deck); }
            prepare();
          }, 'primary big')));
      }
      draw();
      ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, P[speaker] + ' · fase ' + (phase + 1)), clock.el, card,
        h('div', { class: 'row2' }, btn('Pasar', () => mark(false), 'mid big'), btn('Correcto', () => mark(true), 'yes big'))));
    }
  };
})(Corrillo);
