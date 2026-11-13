/* Reglas compartidas: resultados, equipos, azar ponderado y votaciones. */
(function (C) {
  'use strict';
  const { h, btn } = C;
  C.parseNumber = (text) => {
    let value = String(text).trim().replace(/\s/g, '');
    if (!value || !/^[+-]?[\d.,]+$/.test(value)) return NaN;
    if (/^[+-]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(value)) value = value.replace(/\./g, '');
    if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(value)) return NaN;
    return Number(value.replace(',', '.'));
  };
  C.ranking = (names, points, lower) => {
    const values = points.map((v) => Number.isFinite(v) ? v : 0);
    const top = (lower ? Math.min : Math.max)(...values), bottom = (lower ? Math.max : Math.min)(...values);
    return { tied: top === bottom, winners: top === bottom ? [] : names.filter((_, i) => values[i] === top),
      losers: top === bottom ? [] : names.filter((_, i) => values[i] === bottom),
      order: names.map((name, i) => [name, values[i]]).sort((a, b) => lower ? a[1] - b[1] : b[1] - a[1]) };
  };
  C.weightedRole = (counts, except) => {
    const candidates = counts.map((count, i) => [i, 1 / Math.pow(count + 1, 3)]).filter(([i]) => i !== except);
    let draw = Math.random() * candidates.reduce((sum, row) => sum + row[1], 0);
    return (candidates.find((row) => (draw -= row[1]) < 0) || candidates[candidates.length - 1])[0];
  };
  C.apuestoScore = (attempts, bets, hits, predictions) => attempts.map((n, i) =>
    Math.round(((n ? hits[i] / n : 0) + (bets[i] ? predictions[i] / bets[i] : 0)) * 5000) / 100);
  C.lobosWinner = (living, wolves) => living === 0 ? 'none' : wolves === 0 ? 'pueblo' : wolves * 2 >= living ? 'lobos' : null;
  C.choiceRound = (ctx, question, options, mode, next) => {
    const choices = [], counts = options.map(() => 0);
    const card = () => h('div', { class: 'card q' }, question);
    if (mode === 'public') return ctx.show(h('div', { class: 'center' }, card(), options.map((text) => h('div', { class: 'opt' }, text)),
      h('p', { class: 'muted' }, 'Elegid y comentad en voz alta. No hace falta registrar los votos.'), btn('Siguiente', next, 'primary big')));
    if (mode === 'manual') return ctx.show(h('div', { class: 'center' }, card(), options.map((text, i) => {
      const tally = h('span', { class: 'tally' });
      return btn([text, tally], () => { counts[i]++; tally.textContent = '✋ ' + counts[i]; }, 'opt');
    }), h('p', { class: 'muted small' }, 'Recuento manual libre: una pulsación por voto, sin límite.'), btn('Siguiente dilema', next, 'primary big')));
    C.pass(ctx, ctx.players, (_, i, forward) => ({ noBtn: true, node: h('div', { class: 'stack' }, card(), options.map((text, j) =>
      btn(text, () => { choices[i] = j; counts[j]++; forward(); }, 'opt'))) }), () => {
      C.commit();
      ctx.show(h('div', { class: 'center' }, card(), h('h2', null, 'Así piensa el grupo'),
        options.map((text, i) => h('div', { class: 'card' }, h('strong', null, text), h('p', { class: 'lead' }, counts[i] + ' votos · ' + Math.round(counts[i] / ctx.players.length * 100) + ' %'))),
        ctx.s.detail && h('details', { class: 'how' }, h('summary', null, 'Detalle por participante'), ctx.players.map((p, i) => h('p', null, p + ': ' + options[choices[i]]))),
        btn('Siguiente', next, 'primary big')));
    }, { verb: 'Elegir en privado', note: 'Una elección por persona. Los resultados aparecen al terminar.' });
  };
  C.teamSettings = () => [
    { key: 'teamCount', label: 'Número de equipos', type: 'step', def: 2, min: 2, max: (n) => Math.max(2, Math.floor(n / 2)), show: (s) => s.teams || s.mode === 'equipos' || s.format === 'cuatro' },
  ];
  C.teamsOf = (players, s) => {
    const count = Math.max(2, Math.min(Math.floor(players.length / 2), s.teamCount || 2));
    const map = Array.isArray(s.teamMap) && s.teamMap.length === players.length && s.teamMap.every((v) => Number.isInteger(v) && v >= 0 && v < count)
      ? s.teamMap : players.map((_, i) => i % count);
    return Array.from({ length: count }, (_, k) => ({ name: 'Equipo ' + (k + 1), members: players.filter((_, i) => map[i] === k), indices: players.map((_, i) => i).filter((i) => map[i] === k) }));
  };
  C.teamProblem = (players, s) => C.teamsOf(players, s).some((t) => t.members.length < 2) ? 'Cada equipo necesita al menos dos personas. Revisa el reparto.' : null;
  C.teamTurn = (teams, turn) => {
    const side = turn % teams.length, team = teams[side];
    return { side, player: team.indices[Math.floor(turn / teams.length) % team.indices.length] };
  };
  C.teamEditor = (players, s, changed) => {
    const teams = C.teamsOf(players, s);
    if (!Array.isArray(s.teamMap) || s.teamMap.length !== players.length || s.teamMap.some((v) => v >= teams.length)) s.teamMap = players.map((_, i) => i % teams.length);
    return h('details', { class: 'how' }, h('summary', null, 'Reparto de equipos'),
      players.map((name, i) => h('label', { class: 'srow' }, name,
        h('select', { 'aria-label': 'Equipo de ' + name, onchange: (e) => { s.teamMap[i] = Number(e.target.value); changed(); } },
          teams.map((t, k) => h('option', { value: k, selected: s.teamMap[i] === k }, t.name))))),
      btn('Repartir automáticamente', () => { s.teamMap = players.map((_, i) => i % teams.length); changed(); }, 'small'));
  };
  C.recordOutcome = (ctx, names, points, options) => {
    options = options || {};
    const rank = C.ranking(names, points, options.lower);
    const type = options.type || 'competitive', complete = options.complete !== false;
    ctx.progress = { names: names.slice(), points: points.slice(), unit: options.unit || '', type, complete };
    if (complete && !ctx.resultRecorded) {
      if (type === 'competitive') {
        const winners = options.teams ? options.teams.filter((t) => rank.winners.includes(t.name)).flatMap((t) => t.members) : rank.winners;
        C.nightAdd(winners);
      }
      ctx.resultRecorded = true;
    }
    return rank;
  };
  C.roleResult = (ctx, winners, title, solution) => {
    const points = ctx.players.map((p) => winners.includes(p) ? 1 : 0);
    C.recordOutcome(ctx, ctx.players, points);
    ctx.show(h('div', { class: 'center' }, h('h2', null, title), solution,
      winners.length ? h('p', { class: 'lead' }, 'Victoria: ' + winners.join(', ')) : h('p', { class: 'muted' }, 'Sin ganador'),
      winners.length > 0 && winners.length < ctx.players.length && C.penalty(C.pick(ctx.players.filter((name) => !winners.includes(name)))),
      C.shareBtn(ctx.game.name, [title].concat(winners.length ? ['Victoria: ' + winners.join(', ')] : []), ctx.game.color), ctx.endBar('Otra ronda')));
  };
  /* Votos secretos: cada persona vota una vez; nunca a sí misma. Un único desempate. */
  C.accusation = (ctx, alive, options, done, tiedAgain) => {
    const P = ctx.players;
    function ballot(candidates, runoff) {
      const votes = new Map(candidates.map((i) => [i, 0]));
      C.pass(ctx, alive.map((i) => P[i]), (name, j, next) => ({ noBtn: true,
        node: h('div', { class: 'stack' }, h('h2', null, runoff ? 'Desempate' : 'Tu voto'),
          candidates.filter((i) => i !== alive[j]).map((i) => btn(P[i], () => { votes.set(i, votes.get(i) + 1); next(); })),
          btn('Abstenerme', next, 'small')),
      }), () => {
        const top = Math.max(...votes.values());
        const tied = candidates.filter((i) => votes.get(i) === top);
        if (top === 0 || (tied.length > 1 && runoff)) return tiedAgain();
        if (tied.length > 1) return ballot(tied, true);
        done(tied[0]);
      }, { verb: 'Votar en secreto' });
    }
    if (options.secret) return ballot(alive, false);
    function publicVote(candidates, runoff) {
      ctx.show(h('div', { class: 'center' }, h('h2', null, runoff ? 'Votación de desempate' : '¿A quién acusa el grupo?'),
        h('p', { class: 'muted' }, 'Podéis absteneros. No vale votarse a uno mismo. Marcad a quien reciba más votos.'),
        candidates.map((i) => btn(P[i], () => done(i))),
        runoff ? btn('Sigue el empate / abstención', tiedAgain, 'small') : btn('Hay empate', () => {
          const selected = new Set(), box = h('div', { class: 'chips' });
          candidates.forEach((i) => box.append(h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: (e) => {
            selected.has(i) ? selected.delete(i) : selected.add(i); e.currentTarget.classList.toggle('on', selected.has(i)); e.currentTarget.setAttribute('aria-pressed', selected.has(i));
          } }, P[i])));
          const error = h('p', { class: 'warn', role: 'status' });
          ctx.show(h('div', { class: 'center' }, h('h2', null, 'Marca a quienes han empatado'), box, error,
            btn('Desempatar', () => selected.size < 2 ? error.textContent = 'Selecciona al menos dos personas.' : publicVote(Array.from(selected), true), 'primary big')));
        }, 'small'), btn('Nadie acusa / abstención', tiedAgain, 'small')));
    }
    publicVote(alive, false);
  };
  C.infiltratorSettings = (spy) => [
    { key: 'variant', label: 'Partida', type: 'select', def: 'quick', options: [['quick', 'Rápida'], ['survival', 'Supervivencia']], help: 'Supervivencia: se elimina una persona por votación; no se puede ganar adivinando.' },
    { key: 'tracking', label: 'Uso del móvil', type: 'select', def: 'auto', options: [['auto', 'Predeterminado'], ['deal', 'Solo reparto'], ['track', 'Seguir eliminaciones']], help: 'Por defecto: reparto en rápida y seguimiento en supervivencia.' },
    { key: 'secretVotes', label: 'Votos secretos en el móvil', type: 'toggle', def: false },
    { key: 'reveal', label: 'Revelar el rol de quien sale', type: 'toggle', def: true, show: (s) => s.variant === 'survival' },
  ].concat(spy ? [{ key: 'guess', label: 'Última oportunidad de adivinar', type: 'toggle', def: true, show: (s) => s.variant !== 'survival' }] : []);
  C.playInfiltrators = (ctx, opt) => {
    const P = ctx.players, s = ctx.s, infiltrators = opt.infiltrators, survival = s.variant === 'survival';
    const alive = P.map((_, i) => i), noun = opt.spy ? 'espía' : 'impostor';
    const normals = P.filter((_, i) => !infiltrators.includes(i));
    const solution = () => C.secret(opt.spy ? '🕶️' : '🕵️', 'Revelación final', infiltrators.map((i) => P[i]).join(', '),
      (opt.spy ? 'Lugar: ' : 'Palabra del grupo: ') + opt.word + (opt.similar ? ' · Palabra alternativa: ' + opt.other : ''));
    const end = (winners, title) => { ctx.private = false; C.commit(); C.roleResult(ctx, winners, title, solution()); };
    const tracked = () => s.tracking === 'track' || (s.tracking !== 'deal' && survival);
    C.pass(ctx, P, (_, i) => opt.similar ? C.secret('🔑', 'Tu palabra', infiltrators.includes(i) ? opt.other : opt.word, 'Puede que tu palabra sea distinta. Nadie conoce a los demás infiltrados.') :
      infiltrators.includes(i) ? C.secret(opt.spy ? '🕶️' : '🕵️', 'Tu papel', 'Eres ' + noun, !opt.spy && s.hints ? 'Pista inicial: ' + opt.other : 'Escucha y disimula. No conoces a los demás infiltrados.') :
        C.secret(opt.spy ? '📍' : '🔑', opt.spy ? 'Estáis en' : 'Tu palabra', opt.word), discuss, { lastLabel: 'Ocultar y empezar' });
    function discuss() {
      ctx.private = false;
      const seconds = opt.spy ? s.duration : s.timer ? s.duration : 0;
      const clock = seconds ? C.clock(ctx, seconds) : null;
      ctx.show(h('div', { class: 'center' }, h('h2', null, 'Hablad y buscad a quien no encaja'),
        h('p', { class: 'lead' }, 'Empieza ' + C.pick(alive.map((i) => P[i])) + '.'),
        h('p', { class: 'muted' }, survival ? 'Quien ha sido eliminado ya no da pistas ni vota. No hay intentos de adivinar.' : 'Una acusación decide la partida. Los infiltrados no se conocen entre sí.'),
        survival && h('p', { class: 'muted' }, 'Siguen: ' + alive.map((i) => P[i]).join(', ')), clock && clock.el,
        opt.options && h('details', { class: 'card how' }, h('summary', null, 'Lugares posibles'), h('p', { class: 'muted' }, opt.options.join(' · '))),
        tracked() ? btn('Ir a la votación', () => { clock && clock.stop(); vote(); }, 'primary big') : [
          h('p', { class: 'muted' }, 'Jugad y votad en voz alta. El móvil puede quedarse en la mesa.'),
          btn('Indicar el resultado', () => { clock && clock.stop(); manual(); }, 'primary big'),
          btn('Registrar una acusación en el móvil', () => { clock && clock.stop(); vote(); }, 'small')],
        btn('Revelar sin puntuar', () => { clock && clock.stop(); end([], 'Revelación sin ganador'); }, 'small')));
    }
    function manual() {
      ctx.show(h('div', { class: 'center' }, h('h2', null, '¿Cómo ha terminado?'),
        btn('Ganan los jugadores normales', () => end(normals, 'Ganan los jugadores normales'), 'yes big'),
        btn('Ganan los infiltrados', () => {
          if (!survival) return end(infiltrators.map((i) => P[i]), 'Ganan los infiltrados');
          const selected = new Set(infiltrators), box = h('div', { class: 'stack' });
          infiltrators.forEach((i) => box.append(h('label', { class: 'srow' }, P[i], h('input', { type: 'checkbox', checked: true, onchange: (e) => e.target.checked ? selected.add(i) : selected.delete(i) }))));
          const error = h('p', { class: 'warn' });
          ctx.show(h('div', { class: 'center' }, h('h2', null, 'Marca solo a los infiltrados que sobrevivieron'), box, error,
            btn('Confirmar victoria', () => selected.size ? end(Array.from(selected, (i) => P[i]), 'Ganan los infiltrados supervivientes') : error.textContent = 'Debe sobrevivir al menos un infiltrado.', 'primary big')));
        }, 'no big'),
        !survival && s.guess && !opt.similar && btn('Un infiltrado ha adivinado', () => ctx.show(h('div', { class: 'center' }, h('h2', null, '¿Quién ha adivinado?'),
          infiltrators.map((i) => btn(P[i], () => end([P[i]], P[i] + ' adivina y gana'), 'primary'))))),
        btn('Sin ganador', () => end([], 'Sin ganador'), 'small')));
    }
    function vote() {
      C.accusation(ctx, alive, { secret: s.secretVotes }, (accused) => {
        if (!survival) {
          if (!infiltrators.includes(accused)) return end(infiltrators.map((i) => P[i]), P[accused] + ' era inocente: ganan los infiltrados');
          if (!s.guess || opt.similar) return end(normals, '¡Descubierto! Ganan los jugadores normales');
          return ctx.show(h('div', { class: 'center' }, h('h2', null, P[accused] + ' era ' + noun),
            h('p', { class: 'lead' }, 'Última oportunidad: di ' + (opt.spy ? 'el lugar' : 'la palabra') + ' sin mirar la solución.'),
            btn('Ha adivinado', () => end([P[accused]], P[accused] + ' adivina y gana'), 'yes big'),
            btn('Ha fallado', () => end(normals, 'Ganan los jugadores normales'), 'no big')));
        }
        alive.splice(alive.indexOf(accused), 1);
        const remaining = alive.filter((i) => infiltrators.includes(i));
        if (!remaining.length) return end(normals, 'No quedan infiltrados: ganan los jugadores normales');
        if (remaining.length * 2 >= alive.length) return end(remaining.map((i) => P[i]), 'Ganan los infiltrados supervivientes');
        ctx.show(h('div', { class: 'center' }, h('h2', null, 'Sale ' + P[accused]),
          s.reveal && h('p', { class: 'lead' }, infiltrators.includes(accused) ? 'Era ' + noun + '.' : 'Era un jugador normal.'),
          h('p', { class: 'muted' }, 'Ya no participa ni vota. Se mantienen las mismas palabras y roles.'), btn('Seguir hablando', discuss, 'primary big')));
      }, () => ctx.show(h('div', { class: 'center' }, h('h2', null, 'Nadie sale'), h('p', { class: 'muted' }, 'Empate o abstención: otra ronda de conversación.'), btn('Continuar', discuss, 'primary big'))));
    }
  };
})(Corrillo);
