(function (C) {
  const { h, btn } = C;
  const ROLES = {
    lobo: ['🐺', 'Hombre lobo', 'Cada noche eliges una víctima junto al resto de lobos.'],
    vidente: ['🔮', 'Vidente', 'Cada noche descubres si un jugador es lobo.'],
    protector: ['🛡️', 'Protector', 'Cada noche proteges a un jugador del ataque de los lobos.'],
    bruja: ['🧪', 'Bruja', 'Tienes una poción de vida y otra de muerte. Cada una sirve una sola vez.'],
    cazador: ['🏹', 'Cazador', 'Si mueres, disparas y te llevas a alguien contigo.'],
    cupido: ['💘', 'Cupido', 'La primera noche enamoras a dos jugadores: si muere uno, muere el otro.'],
    aldeano: ['🧑‍🌾', 'Aldeano', 'No tienes poderes: observa, debate y vota bien.'],
  };
  const SPECIAL = [['seer', 'vidente'], ['guard', 'protector'], ['witch', 'bruja'], ['hunter', 'cazador'], ['cupid', 'cupido']];
  C.register({
    id: 'lobos', name: 'Hombres Lobo', emoji: '🐺', color: '#5cb8ff', group: 'deduccion', min: 4,
    tag: 'De noche atacan los lobos; de día, el pueblo vota.',
    how: [
      'Cada noche el móvil pasa por todos los jugadores vivos. Cada uno ve su papel y toca un nombre.',
      'Los lobos eligen víctima y los papeles especiales usan su poder. Los aldeanos también tocan un nombre para disimular.',
      'Al amanecer se anuncia qué ha pasado. El pueblo debate y vota a quién expulsar.',
      'Gana el pueblo si expulsa a todos los lobos; ganan los lobos si igualan en número al resto.',
    ],
    settings: [
      { key: 'wolves', label: 'Lobos', type: 'step', def: 1, min: 1, max: (n) => Math.max(1, Math.ceil(n / 2) - 1) },
      { key: 'seer', label: '🔮 Vidente', type: 'toggle', def: true },
      { key: 'guard', label: '🛡️ Protector', type: 'toggle', def: false },
      { key: 'witch', label: '🧪 Bruja', type: 'toggle', def: false },
      { key: 'hunter', label: '🏹 Cazador', type: 'toggle', def: false },
      { key: 'cupid', label: '💘 Cupido', type: 'toggle', def: false },
      { key: 'reveal', label: 'Mostrar el papel de los eliminados', type: 'toggle', def: true },
      { key: 'voice', label: 'Narración por voz', type: 'toggle', def: true, help: 'El móvil anuncia en voz alta la noche, el amanecer y el final.' },
      { key: 'debate', label: 'Tiempo de debate', type: 'select', def: 0, options: [[0, 'Sin límite'], [120, '2 min'], [180, '3 min'], [300, '5 min']] },
    ],
    validate(s, n) {
      if (s.wolves * 2 >= n) return 'Demasiados lobos para ' + n + ' jugadores.';
      if (s.wolves + SPECIAL.filter(([k]) => s[k]).length > n) return 'No hay jugadores suficientes para tantos papeles.';
      return null;
    },

    play(ctx) {
      const P = ctx.players, s = ctx.s, n = P.length;
      const deck = Array(s.wolves).fill('lobo').concat(SPECIAL.filter(([k]) => s[k]).map((x) => x[1]));
      while (deck.length < n) deck.push('aldeano');
      const role = C.shuffle(deck), alive = P.map(() => true), potion = { life: true, death: true };
      let nightNo = 0, lovers = null;
      const living = () => P.map((_, i) => i).filter((i) => alive[i]);
      const wolvesOf = (list) => list.filter((i) => role[i] === 'lobo');
      const say = (t) => s.voice && C.say(t);
      const was = (i) => (s.reveal ? 'Era ' + ROLES[role[i]][1].toLowerCase() + '.' : null);
      const names = (list) => list.map((i) => P[i]).join(' y ');

      function winner() {
        const l = living(), w = wolvesOf(l).length;
        return w === 0 ? 'pueblo' : w * 2 >= l.length ? 'lobos' : null;
      }
      /* Mata a los jugadores indicados y resuelve las muertes en cadena (enamorados, disparo del cazador). */
      function die(list, done) {
        const dead = [];
        (function step(queue) {
          queue = queue.filter((i) => alive[i]);
          if (!queue.length) return done(dead);
          const i = queue.shift();
          alive[i] = false;
          dead.push(i);
          if (lovers && lovers.includes(i)) queue.push(lovers[0] === i ? lovers[1] : lovers[0]);
          const L = living().filter((x) => !queue.includes(x));
          if (role[i] !== 'cazador' || !L.length) return step(queue);
          ctx.show(h('div', { class: 'center' }, C.secret('🏹', P[i] + ' era el cazador', 'Último disparo', 'Antes de morir, elige a quién se lleva.'),
            C.pickGrid(L.map((x) => P[x]), (k) => step(queue.concat(L[k])))));
        })(list.slice());
      }

      function night() {
        nightNo++;
        const L = living(), wolfVotes = [];
        let guarded = -1, saved = -1, poison = -1;
        say('Noche ' + nightNo + '. El pueblo duerme. Pasad el móvil en silencio.');
        ctx.show(h('div', { class: 'center' }, h('div', { class: 'big-emoji' }, '🌙'), h('h2', null, 'Noche ' + nightNo),
          h('p', { class: 'muted' }, 'El móvil pasa por todos los jugadores vivos. Todos tocan un nombre, así nadie sabe quién hace qué.'),
          btn('Empezar la noche', turns, 'primary big')));

        function turns() {
          C.pass(ctx, L.map((i) => P[i]), (p, j, fwd) => {
            const me = L[j], r = role[me], [em, title, desc] = ROLES[r];
            const others = L.filter((i) => i !== me);
            const box = h('div', { class: 'stack' });
            const love = lovers && lovers.includes(me) ? h('p', { class: 'note' }, '💘 Estás enamorado de ' + P[lovers[0] === me ? lovers[1] : lovers[0]] + ': si muere, mueres.') : null;
            const ask = (text, targets, onPick, extra) => box.replaceChildren(...[C.secret(em, 'Tu papel', title, desc), love, extra, h('p', { class: 'lead' }, text),
              C.pickGrid(targets.map((i) => P[i]), (k) => onPick(targets[k]))].filter(Boolean));
            const decoy = (extra) => ask('Toca a quien más sospeches (no tiene efecto).', others, fwd, extra);

            if (r === 'lobo') {
              const mates = wolvesOf(others);
              ask('¿A quién atacáis esta noche?', others.filter((i) => role[i] !== 'lobo'), (t) => { wolfVotes.push(t); fwd(); },
                h('p', { class: 'note' }, (mates.length ? 'Tu manada: ' + names(mates) + '. ' : 'Cazas en solitario. ') + (wolfVotes.length ? 'Ya han votado a: ' + names(wolfVotes) + '.' : '')));
            } else if (r === 'vidente') {
              ask('¿A quién quieres investigar?', others, (t) => box.replaceChildren(C.secret(role[t] === 'lobo' ? '🐺' : '😇', P[t], role[t] === 'lobo' ? 'Es un lobo' : 'No es un lobo'), btn('Ocultar y pasar el móvil', fwd, 'primary big')));
            } else if (r === 'protector') {
              ask('¿A quién proteges esta noche?', L, (t) => { guarded = t; fwd(); });
            } else if (r === 'cupido' && !lovers) {
              ask('Elige al primer enamorado.', L, (a) => ask('Elige al segundo enamorado.', L.filter((i) => i !== a), (b) => { lovers = [a, b]; fwd(); }));
            } else if (r === 'bruja' && (potion.life || potion.death)) {
              box.replaceChildren(...[C.secret(em, 'Tu papel', title, desc), love, h('p', { class: 'lead' }, '¿Usas una poción esta noche?'),
                potion.life && btn('🧪 Poción de vida: salvar a alguien', () => ask('¿A quién salvas si lo atacan?', L, (t) => { saved = t; potion.life = false; fwd(); })),
                potion.death && btn('☠️ Poción de muerte: eliminar a alguien', () => ask('¿A quién envenenas?', others, (t) => { poison = t; potion.death = false; fwd(); })),
                btn('No usar ninguna', fwd)].filter(Boolean));
            } else decoy(r === 'bruja' ? h('p', { class: 'note' }, 'Ya no te quedan pociones.') : null);
            return { node: box, noBtn: true };
          }, dawn, { verb: 'Abrir mi turno' });
        }
        function dawn() {
          const count = {};
          wolfVotes.forEach((v) => (count[v] = (count[v] || 0) + 1));
          const top = Math.max(...Object.values(count));
          const victim = +C.pick(Object.keys(count).filter((k) => count[k] === top));
          const list = victim === guarded || victim === saved ? [] : [victim];
          if (poison >= 0 && !list.includes(poison)) list.push(poison);
          die(list, day);
        }
      }
      function day(dead) {
        const w = winner();
        const clock = !w && s.debate ? C.clock(ctx, s.debate) : null;
        say('Amanece en el pueblo. ' + (dead.length ? 'Esta noche ' + (dead.length > 1 ? 'han muerto ' : 'ha muerto ') + names(dead) + '.' : 'Esta noche no ha muerto nadie.'));
        ctx.show(h('div', { class: 'center' }, h('div', { class: 'big-emoji' }, '🌅'), h('h2', null, 'Amanece en el pueblo'),
          dead.length ? dead.map((i) => C.secret('💀', 'Esta noche ha muerto', P[i], was(i))) : h('p', { class: 'lead' }, 'Nadie ha muerto esta noche.'),
          w ? btn('Ver el final', () => end(w), 'primary big') : [
            h('p', { class: 'muted' }, 'Debatid, acusaos y votad a mano alzada a quién expulsáis.'), clock && clock.el,
            btn('Ir a la votación', () => { clock && clock.stop(); vote(); }, 'primary big')]));
      }
      function vote() {
        const L = living();
        ctx.show(h('div', { class: 'center' }, h('h2', null, '¿A quién expulsa el pueblo?'),
          C.pickGrid(L.map((i) => P[i]), (k) => die([L[k]], (dead) => {
            const w = winner();
            ctx.show(h('div', { class: 'center' },
              dead.map((i, j) => C.secret(j ? '💔' : '⚖️', j ? 'También cae' : 'El pueblo expulsa a', P[i], was(i))),
              btn(w ? 'Ver el final' : 'Cae la noche', () => (w ? end(w) : night()), 'primary big')));
          }), btn('Nadie (empate)', night, 'wide'))));
      }
      function end(w) {
        const title = w === 'lobos' ? 'Ganan los lobos' : 'Gana el pueblo';
        say(title + '.');
        ctx.show(h('div', { class: 'center' }, h('div', { class: 'big-emoji' }, w === 'lobos' ? '🐺' : '🎉'), h('h2', null, title),
          h('div', { class: 'list' }, P.map((p, i) => h('div', { class: 'item' + (alive[i] ? '' : ' miss') }, h('span', null, (alive[i] ? '' : '💀 ') + p), h('b', null, ROLES[role[i]][0] + ' ' + ROLES[role[i]][1])))),
          C.shareBtn('Hombres Lobo', [title].concat(P.map((p, i) => ROLES[role[i]][0] + ' ' + p)), '#5cb8ff'), ctx.endBar()));
      }
      night();
    },
  });
})(Corrillo);
