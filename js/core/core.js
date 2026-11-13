/* Corrillo — núcleo: registro de juegos, navegación, configuración local y utilidades compartidas.
   Sin módulos ES ni compilación: así funciona también abriendo index.html con doble clic. */
(function () {
  'use strict';
  const C = (window.Corrillo = { NAME: 'Corrillo', games: [], content: {} });

  C.groups = [
    ['deduccion', 'Deducción y engaño'],
    ['preguntas', 'Preguntas y decisiones'],
    ['palabras', 'Palabras, rapidez y azar'],
  ];
  C.register = (g) => C.games.push(g);

  /* ---------- DOM ---------- */
  function add(el, kids) {
    for (const k of kids) {
      if (k == null || k === false) continue;
      if (Array.isArray(k)) add(el, k);
      else el.append(k.nodeType ? k : document.createTextNode(String(k)));
    }
  }
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style') el.setAttribute('style', v);
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k in el) el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    add(el, kids);
    return el;
  }
  const btn = (label, fn, cls) => h('button', { type: 'button', class: 'btn ' + (cls || ''), onclick: fn }, label);
  C.h = h;
  C.btn = btn;

  /* ---------- Aleatoriedad ---------- */
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  Object.assign(C, { rnd, pick, shuffle });

  /* ---------- Almacenamiento ---------- */
  const store = (C.store = {
    get(k, d) {
      try {
        const v = localStorage.getItem('corrillo:' + k);
        return v == null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem('corrillo:' + k, JSON.stringify(v));
      } catch (e) {}
    },
  });

  /* ---------- Contenido: categorías y mazo sin repeticiones ---------- */
  C.pool = (byCat, cats) => cats.flatMap((c) => byCat[c] || []);
  function hash(s) {
    let x = 5381;
    for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0;
    return x.toString(36);
  }
  const usedMem = {};
  /* Devuelve un elemento al azar que no haya salido todavía; cuando se agotan, vuelve a barajar. */
  C.draw = function (key, pool) {
    if (!pool.length) return null;
    let used = usedMem[key] || (usedMem[key] = store.get('used:' + key, []));
    const id = (it) => hash(typeof it === 'string' ? it : JSON.stringify(it));
    let free = pool.filter((it) => !used.includes(id(it)));
    if (!free.length) {
      const ids = pool.map(id);
      used = usedMem[key] = used.filter((u) => !ids.includes(u));
      free = pool;
    }
    const it = pick(free);
    used.push(id(it));
    store.set('used:' + key, used);
    return it;
  };

  /* ---------- Sonido y vibración ---------- */
  let actx = null;
  C.sound = {
    on: store.get('sound', true),
    beep(freq, dur, type, vol) {
      if (!this.on) return;
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === 'suspended') actx.resume();
        const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
        o.type = type || 'square';
        o.frequency.value = freq;
        g.gain.setValueAtTime(vol || 0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(actx.destination);
        o.start(t);
        o.stop(t + dur);
      } catch (e) {}
    },
    ok() { this.beep(880, 0.12, 'sine', 0.2); },
    bad() { this.beep(160, 0.25, 'sawtooth', 0.15); },
    alarm() { this.beep(660, 0.15); setTimeout(() => this.beep(660, 0.15), 220); setTimeout(() => this.beep(990, 0.4), 440); C.buzz([120, 80, 120, 80, 300]); },
    boom() {
      C.buzz([500]);
      if (!this.on) return;
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        const len = actx.sampleRate * 1.2, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
        const src = actx.createBufferSource(), f = actx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 700;
        src.buffer = buf;
        src.connect(f).connect(actx.destination);
        src.start();
      } catch (e) {}
    },
  };
  C.buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

  /* ---------- Componentes compartidos ---------- */
  C.fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  C.num = (v) => Number(v).toLocaleString('es-ES');

  C.confirm = function (text, yes, no) {
    return new Promise((res) => {
      const close = (v) => { m.remove(); res(v); };
      const m = h('div', { class: 'modal' },
        h('div', { class: 'card' }, h('p', { class: 'lead' }, text),
          h('div', { class: 'stack' }, btn(no || 'Cancelar', () => close(false), 'primary'), btn(yes || 'Aceptar', () => close(true)))));
      document.body.append(m);
    });
  };

  /* Carta secreta: icono, texto pequeño, texto grande y nota opcional. */
  C.secret = (emoji, small, big, extra) =>
    h('div', { class: 'card secret' }, h('div', { class: 'big-emoji' }, emoji), h('p', { class: 'muted' }, small), h('h2', null, big), extra && h('p', { class: 'note' }, extra));

  /* Reparto privado: el móvil pasa de mano en mano. card(nombre, i, avanzar) devuelve un nodo
     o { node, before() -> error, noBtn } para cartas con entrada de datos o elección directa. */
  C.pass = function (ctx, names, card, done, opt) {
    opt = opt || {};
    let i = 0;
    (function next() {
      if (!ctx.alive) return;
      if (i >= names.length) return done();
      const p = names[i], last = i === names.length - 1;
      const fwd = () => { i++; next(); };
      ctx.show(h('div', { class: 'center' },
        h('div', { class: 'big-emoji' }, '🤫'),
        h('p', { class: 'lead' }, 'Pásale el móvil a'),
        h('h2', { class: 'name' }, p),
        h('p', { class: 'muted' }, opt.note || 'Que nadie más mire la pantalla.'),
        btn(opt.verb || 'Ver mi carta', () => {
          let c = card(p, i, fwd);
          if (c.nodeType) c = { node: c };
          const err = h('p', { class: 'warn' });
          ctx.show(h('div', { class: 'center' }, h('p', { class: 'pill' }, p), c.node, err,
            c.noBtn ? null : btn(last ? opt.lastLabel || 'Ocultar y continuar' : 'Ocultar y pasar el móvil', () => {
              const e = c.before && c.before();
              if (e) { err.textContent = e; return; }
              fwd();
            }, 'primary big')));
        }, 'primary big'),
        h('p', { class: 'muted small' }, i + 1 + ' de ' + names.length)));
    })();
  };

  /* Cuenta atrás visible. */
  C.clock = function (ctx, sec, onEnd) {
    const el = h('div', { class: 'clock' });
    const end = Date.now() + sec * 1000;
    let done = false;
    const stop = () => { done = true; clearInterval(id); };
    function tick() {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      el.textContent = C.fmt(left);
      el.classList.toggle('low', left <= 10);
      if (left <= 0 && !done) { stop(); C.sound.alarm(); onEnd && onEnd(); }
    }
    const id = setInterval(tick, 200);
    tick();
    ctx.onExit(stop);
    return { el, stop };
  };

  /* Rejilla para elegir a un jugador (votaciones, acusaciones, acciones nocturnas). */
  C.pickGrid = (names, onPick, extra) =>
    h('div', { class: 'pgrid' }, names.map((n, i) => btn(n, () => onPick(i, n))), extra);

  C.scores = function (names, pts, unit) {
    const rows = names.map((n, i) => [n, pts[i] || 0]).sort((a, b) => b[1] - a[1]);
    const top = rows[0][1];
    return h('div', { class: 'card scores' }, rows.map(([n, p]) =>
      h('div', { class: 'score' + (p === top && top > 0 ? ' top' : '') }, h('span', null, (p === top && top > 0 ? '👑 ' : '') + n), h('b', null, p + (unit === ' pts' && p === 1 ? ' pt' : unit || '')))));
  };

  /* Cifras grandes en notación compacta: K (mil), M (millón), B (mil millones), T (billón). */
  const UNITS = [[1e12, 'T', 'billón', 'billones'], [1e9, 'B', 'mil millones', 'mil millones'], [1e6, 'M', 'millón', 'millones']];
  C.big = function (v) {
    v = Number(v);
    const u = UNITS.find((x) => v >= x[0]);
    return u ? (v / u[0]).toLocaleString('es-ES', { maximumSignificantDigits: 3 }) + u[1] : v.toLocaleString('es-ES');
  };
  C.bigWords = function (v) {
    const u = UNITS.find((x) => v >= x[0]);
    if (!u) return v >= 1000 ? 'miles' : '';
    const n = v / u[0];
    return n.toLocaleString('es-ES', { maximumSignificantDigits: 3 }) + ' ' + (n === 1 ? u[2] : u[3]);
  };

  /* Dial de estimación. Sin opciones: escala logarítmica de 0 a 1T, con valores cada vez más redondeados.
     Con { min, max }: escala lineal de enteros (se usa para los años). Arrastrar = ajuste grueso; − y + = ajuste fino. */
  C.dial = function (o) {
    o = o || {};
    const lin = o.min != null, MAX = 1e12;
    let v = null;
    const clamp = (x) => (lin ? Math.max(o.min, Math.min(o.max, x)) : Math.max(0, Math.min(MAX, x)));
    function snap(x, sig) {
      x = clamp(x);
      if (x < 100) return Math.round(x);
      const m = Math.pow(10, Math.floor(Math.log10(x)) - (sig - 1));
      return clamp(Math.round(x / m) * m);
    }
    const fromP = (p) => (lin ? Math.round(o.min + p * (o.max - o.min)) : snap(Math.pow(10, 12 * p) - 1, 2));
    const toP = (x) => (lin ? (x - o.min) / (o.max - o.min) : Math.log10(x + 1) / 12);
    const stepOf = (x, dir) => {
      if (lin || x < 1000 || (x === 1000 && dir < 0)) return 1;
      const e = Math.floor(Math.log10(x)) - 2;
      return Math.pow(10, dir < 0 && x === Math.pow(10, e + 2) ? e - 1 : e);
    };

    const num = h('div', { class: 'dial-num' }), words = h('div', { class: 'dial-words' });
    const fill = h('div', { class: 'dial-fill' }), thumb = h('div', { class: 'dial-thumb' });
    const marks = lin ? [0, 0.25, 0.5, 0.75, 1].map((p) => [p, String(fromP(p))]) : [[0, '0'], [0.25, '1K'], [0.5, '1M'], [0.75, '1B'], [1, '1T']];
    const track = h('div', { class: 'dial-track', role: 'slider', tabIndex: 0, 'aria-label': 'Tu estimación' }, h('div', { class: 'dial-rail' }, fill),
      Array.from({ length: lin ? 21 : 37 }, (_, i) => h('i', { class: 'dial-tick' + (i % (lin ? 5 : 3) ? '' : ' major'), style: 'left:' + (i / (lin ? 20 : 36)) * 100 + '%' })), thumb);
    function render() {
      const p = v == null ? 0 : toP(v);
      el.classList.toggle('empty', v == null);
      num.textContent = v == null ? '?' : lin ? String(v) : C.big(v);
      words.textContent = v == null ? 'Desliza para estimar' : lin ? ' ' : C.bigWords(v) || ' ';
      fill.style.width = thumb.style.left = p * 100 + '%';
      track.setAttribute('aria-valuetext', num.textContent);
    }
    function nudge(dir) {
      const base = v == null ? (lin ? Math.round((o.min + o.max) / 2) : 0) : v;
      v = clamp(Math.round(base + dir * stepOf(base, dir)));
      render();
    }
    function hold(dir) {
      let t = null, i = null;
      const stop = () => { clearTimeout(t); clearInterval(i); };
      const b = h('button', { type: 'button', class: 'dial-nudge', 'aria-label': dir < 0 ? 'Bajar un poco' : 'Subir un poco' }, dir < 0 ? '−' : '+');
      b.addEventListener('pointerdown', () => { stop(); nudge(dir); t = setTimeout(() => (i = setInterval(() => (b.isConnected ? nudge(dir) : stop()), 60)), 380); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, stop));
      b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') nudge(dir); });
      return b;
    }
    let drag = false;
    const move = (e) => { const r = track.getBoundingClientRect(); v = fromP(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); render(); };
    track.addEventListener('pointerdown', (e) => { drag = true; try { track.setPointerCapture(e.pointerId); } catch (x) {} move(e); });
    track.addEventListener('pointermove', (e) => { if (drag) move(e); });
    ['pointerup', 'pointercancel'].forEach((ev) => track.addEventListener(ev, () => (drag = false)));
    track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowUp') nudge(1); if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') nudge(-1); });

    const el = h('div', { class: 'dial' },
      h('div', { class: 'dial-read' }, hold(-1), h('div', { class: 'dial-screen' }, num, o.unit && h('div', { class: 'dial-unit' }, o.unit), words), hold(1)),
      track, h('div', { class: 'dial-scale' }, marks.map(([p, t]) => h('span', { style: 'left:' + p * 100 + '%' }, t))));
    render();
    return { el, value: () => v };
  };

  /* Coloca las estimaciones de todos sobre la misma escala, con la respuesta real marcada. */
  C.plot = function (points, answer, lin) {
    const toP = (x) => Math.max(0, Math.min(1, lin ? (x - lin.min) / (lin.max - lin.min) : Math.log10(x + 1) / 12)) * 100;
    const marks = lin ? [lin.min, lin.max].map((x) => [toP(x), String(x)]) : [[0, '0'], [25, '1K'], [50, '1M'], [75, '1B'], [100, '1T']];
    return h('div', { class: 'dial plot' },
      h('div', { class: 'plot-track' }, h('div', { class: 'dial-rail' }),
        h('div', { class: 'plot-ans', style: 'left:' + toP(answer) + '%' }, h('b', null, '✓')),
        points.map(([name, v], i) => h('div', { class: 'plot-dot' + (i % 2 ? ' low' : ''), style: 'left:' + toP(v) + '%' }, h('span', null, name.slice(0, 3))))),
      h('div', { class: 'dial-scale' }, marks.map(([p, t]) => h('span', { style: 'left:' + p + '%' }, t))));
  };

  function stepper(v, min, max, on) {
    return h('div', { class: 'stepper' },
      h('button', { type: 'button', 'aria-label': 'Menos', disabled: v <= min, onclick: () => on(v - 1) }, '−'),
      h('b', null, v),
      h('button', { type: 'button', 'aria-label': 'Más', disabled: v >= max, onclick: () => on(v + 1) }, '+'));
  }

  /* ---------- Configuración local de cada minijuego ---------- */
  /* Categorías de un juego, más «Propias» si el grupo ha escrito contenido suyo. */
  const bankOf = (g) => C.content[g.custom.bank];
  function catsOf(g) {
    const c = g.cats;
    if (!c) return null;
    return g.custom && (bankOf(g).custom || []).length ? c.concat({ id: 'custom', label: '✏️ Propias' }) : c;
  }
  function defaults(g) {
    const s = {};
    (g.settings || []).forEach((o) => (s[o.key] = o.def));
    if (catsOf(g)) s.cats = catsOf(g).filter((c) => !c.spicy).map((c) => c.id);
    const n = g.defPlayers != null ? g.defPlayers : Math.max(g.min || 0, 4);
    return { players: Array(n).fill(''), s };
  }
  function loadCfg(g) {
    const d = defaults(g), c = store.get('cfg:' + g.id, null);
    if (!c) return d;
    const cfg = { players: Array.isArray(c.players) ? c.players.map(String) : d.players, s: Object.assign(d.s, c.s || {}) };
    if (catsOf(g)) {
      const known = c.known || [];
      cfg.s.cats = (cfg.s.cats || []).filter((id) => catsOf(g).some((k) => k.id === id))
        .concat(catsOf(g).filter((k) => !k.spicy && !known.includes(k.id) && !(cfg.s.cats || []).includes(k.id)).map((k) => k.id));
    }
    return cfg;
  }
  function problem(g, cfg) {
    const n = cfg.players.length, min = g.min || 0, max = g.max || 20, what = g.playersWord || 'jugadores';
    if (n < min) return 'Hacen falta al menos ' + min + ' ' + what + '.';
    if (n > max) return 'El máximo es de ' + max + ' ' + what + '.';
    if (catsOf(g) && !cfg.s.cats.length) return 'Elige al menos una categoría.';
    return (g.validate && g.validate(cfg.s, n)) || null;
  }

  const mount = (...nodes) => { const a = document.getElementById('app'); a.replaceChildren(...nodes); window.scrollTo(0, 0); };

  function setup(g) {
    const cfg = loadCfg(g), max = g.max || 20;
    const save = () => store.set('cfg:' + g.id, Object.assign({ known: (catsOf(g) || []).map((k) => k.id) }, cfg));
    const plist = h('div', { class: 'plist' }), phead = h('div'), sbox = h('div'), msg = h('p', { class: 'warn' });
    const go = btn('Empezar', () => { if (!check()) location.hash = '#/j/' + g.id + '/jugar'; }, 'primary big');
    const one = g.playerWord || 'Jugador';

    function check() {
      const e = problem(g, cfg);
      msg.textContent = e || '';
      go.disabled = !!e;
      return e;
    }
    function setCount(n) {
      n = Math.max(0, Math.min(max, n));
      while (cfg.players.length < n) cfg.players.push('');
      cfg.players.length = n;
      changed(true);
    }
    function drawPlayers() {
      const n = cfg.players.length;
      phead.replaceChildren(h('div', { class: 'srow' }, h('div', { class: 'slabel' }, 'Número de ' + (g.playersWord || 'jugadores')), stepper(n, 0, max, setCount)));
      plist.replaceChildren(...cfg.players.map((name, i) =>
        h('div', { class: 'prow' }, h('span', { class: 'pnum' }, i + 1),
          h('input', { type: 'text', maxLength: 16, value: name, placeholder: one + ' ' + (i + 1), autocomplete: 'off', enterKeyHint: 'next', 'aria-label': 'Nombre ' + (i + 1),
            oninput: (e) => { cfg.players[i] = e.target.value; save(); } }),
          h('button', { type: 'button', class: 'x', 'aria-label': 'Quitar', onclick: () => { cfg.players.splice(i, 1); changed(true); } }, '×'))));
    }
    function drawSettings() {
      const n = cfg.players.length, s = cfg.s, rows = [];
      (g.settings || []).forEach((o) => {
        if (o.show && !o.show(s)) return;
        let ctl;
        if (o.type === 'toggle')
          ctl = h('button', { type: 'button', class: 'switch' + (s[o.key] ? ' on' : ''), role: 'switch', 'aria-checked': String(!!s[o.key]), 'aria-label': o.label, onclick: () => { s[o.key] = !s[o.key]; changed(); } }, h('i'));
        else if (o.type === 'step') {
          const mx = Math.max(o.min, typeof o.max === 'function' ? o.max(n, s) : o.max);
          s[o.key] = Math.max(o.min, Math.min(mx, s[o.key]));
          ctl = stepper(s[o.key], o.min, mx, (v) => { s[o.key] = v; changed(); });
        } else
          ctl = h('div', { class: 'chips' }, o.options.map(([v, l]) => h('button', { type: 'button', class: 'chip' + (s[o.key] === v ? ' on' : ''), onclick: () => { s[o.key] = v; changed(); } }, l)));
        rows.push(h('div', { class: 'srow' + (o.type === 'select' ? ' col' : '') }, h('div', null, h('div', { class: 'slabel' }, o.label), o.help && h('div', { class: 'muted small' }, o.help)), ctl));
      });
      if (catsOf(g))
        rows.push(h('div', { class: 'srow col' }, h('div', { class: 'slabel' }, g.catsTitle || 'Categorías'),
          h('div', { class: 'chips' }, catsOf(g).map((c) => {
            const on = s.cats.includes(c.id);
            return h('button', { type: 'button', class: 'chip' + (on ? ' on' : '') + (c.spicy ? ' spicy' : ''), 'aria-pressed': String(on),
              onclick: () => { s.cats = on ? s.cats.filter((x) => x !== c.id) : s.cats.concat(c.id); changed(); } }, c.label + (c.spicy ? ' 🌶️ +18' : ''));
          }))));
      sbox.replaceChildren(...rows);
    }
    function changed(players) {
      save();
      if (players) drawPlayers();
      drawSettings();
      check();
    }

    const favs = () => store.get('fav', []);
    const star = h('button', { type: 'button', class: 'icon', 'aria-label': 'Favorito', onclick: () => { const f = favs(); store.set('fav', f.includes(g.id) ? f.filter((x) => x !== g.id) : f.concat(g.id)); star.textContent = favs().includes(g.id) ? '★' : '☆'; } }, favs().includes(g.id) ? '★' : '☆');
    const last = store.get('last', null);
    const copyBtn = last && last.length && !g.hidePlayers ? btn('Usar los de la última partida (' + last.length + ')', () => { cfg.players = last.slice(0, max); changed(true); }, 'small') : null;
    let customBox = null;
    if (g.custom) {
      const ta = h('textarea', { class: 'textin', rows: 5, value: (bankOf(g).custom || []).join('\n'), placeholder: g.custom.hint });
      const note = h('span', { class: 'muted small' });
      customBox = h('details', { class: 'card how' }, h('summary', null, '✏️ Contenido propio'), h('p', { class: 'muted small', style: 'margin:10px 0' }, g.custom.hint), ta,
        h('div', { class: 'srow' }, note, btn('Guardar', () => {
          const lines = ta.value.split('\n').map((x) => x.trim()).filter(Boolean).map(g.custom.fix || ((x) => x)).filter(Boolean);
          bankOf(g).custom = lines;
          store.set('custom:' + g.id, lines);
          ta.value = lines.join('\n');
          cfg.s.cats = cfg.s.cats.filter((x) => x !== 'custom').concat(lines.length ? ['custom'] : []);
          note.textContent = lines.length + ' guardadas';
          changed();
        }, 'small')));
    }
    drawPlayers();
    drawSettings();
    check();
    document.title = g.name + ' · ' + C.NAME;
    mount(h('div', { class: 'setup', style: '--c:' + g.color },
      h('header', { class: 'top' }, h('a', { class: 'icon', href: '#/', 'aria-label': 'Volver al menú' }, '←'), h('span', { class: 'ttl' }, 'Preparar partida'), star),
      h('main', { class: 'wrap' },
        h('div', { class: 'hero' }, h('div', { class: 'blob' }, g.emoji), h('h1', null, g.name), h('p', { class: 'muted' }, g.tag)),
        h('details', { class: 'card how' }, h('summary', null, 'Cómo se juega'), h('ol', null, g.how.map((t) => h('li', null, t)))),
        g.hidePlayers ? null : h('section', { class: 'card' }, h('h3', null, g.playersTitle || 'Jugadores'), phead, plist,
          cfg.players.length < max ? null : h('p', { class: 'muted small' }, 'Máximo ' + max + '.'),
          h('div', { class: 'chips' }, btn('+ Añadir', () => setCount(cfg.players.length + 1), 'small'), copyBtn)),
        (g.settings || catsOf(g)) ? h('section', { class: 'card' }, h('h3', null, 'Ajustes'), sbox) : null, customBox),
      h('div', { class: 'bar' }, h('div', { class: 'wrap' }, msg, go))));
  }

  /* ---------- Partida ---------- */
  let session = null, asking = false, wakeLock = null;
  function wake(on) {
    try {
      if (on && navigator.wakeLock) navigator.wakeLock.request('screen').then((w) => (wakeLock = w)).catch(() => {});
      else if (wakeLock) { wakeLock.release(); wakeLock = null; }
    } catch (e) {}
  }

  /* Marcador de la noche: victorias acumuladas entre juegos. */
  function nightAdd(names) {
    const n = store.get('night', {});
    names.forEach((x) => (n[x] = (n[x] || 0) + 1));
    store.set('night', n);
  }

  /* Castigos para quien pierde (configurables desde el menú). */
  const penCfg = () => Object.assign({ on: true, lists: ['suaves', 'retos'], custom: [] }, store.get('pen', {}));
  C.penalty = function (name) {
    const p = penCfg();
    const pool = p.on ? C.pool(C.content.castigos, p.lists).concat(p.custom) : [];
    return pool.length && name ? h('div', { class: 'card pen' }, h('small', null, 'Castigo para ' + name), pick(pool)) : null;
  };

  /* Voz del navegador (narración en Hombres Lobo). */
  C.say = function (text) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-ES';
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) {}
  };

  /* Botón que genera una tarjeta-imagen con el resultado para compartirla o descargarla. */
  C.shareBtn = (title, lines, color) => btn('📤 Compartir resultado', () => {
    const cv = h('canvas', { width: 1080, height: 1350 }), x = cv.getContext('2d');
    x.fillStyle = color || '#ffc93c'; x.fillRect(0, 0, 1080, 1350);
    x.fillStyle = '#fff'; x.strokeStyle = '#1d1a2f'; x.lineWidth = 10;
    x.beginPath(); x.roundRect(70, 250, 940, 900, 60); x.fill(); x.stroke();
    x.fillStyle = '#1d1a2f'; x.textAlign = 'center';
    x.font = '900 84px system-ui, sans-serif'; x.fillText(title, 540, 170, 960);
    lines.slice(0, 9).forEach((t, i) => { x.font = (i ? '700 54px' : '900 66px') + ' system-ui, sans-serif'; x.fillText(t, 540, 380 + i * 88, 860); });
    x.font = '900 60px system-ui, sans-serif'; x.fillText(C.NAME + '.', 540, 1260);
    cv.toBlob(async (blob) => {
      const file = new File([blob], 'corrillo.png', { type: 'image/png' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) return await navigator.share({ files: [file], title });
      } catch (e) { return; }
      const a = h('a', { href: URL.createObjectURL(blob), download: 'corrillo.png' });
      document.body.append(a); a.click(); a.remove();
    });
  }, 'small');

  function play(g) {
    const cfg = loadCfg(g);
    const el = h('main', { class: 'wrap stage' }), ttl = h('span', { class: 'ttl' }, g.emoji + ' ' + g.name);
    const cleanup = [];
    if (!g.hidePlayers && cfg.players.length) store.set('last', cfg.players);
    store.set('recent', [g.id].concat(store.get('recent', []).filter((x) => x !== g.id)).slice(0, 4));
    const ctx = {
      game: g, el, alive: true,
      players: cfg.players.map((p, i) => p.trim() || (g.playerWord || 'Jugador') + ' ' + (i + 1)),
      s: JSON.parse(JSON.stringify(cfg.s)),
      onExit: (f) => cleanup.push(f),
      show(...kids) { el.replaceChildren(); add(el, kids); window.scrollTo(0, 0); },
      turn: () => false, /* en modo fiesta devuelve true cuando toca cambiar de juego */
      setTitle(t, color) { ttl.textContent = t; root.style.setProperty('--c', color); },
      /* Pantalla de clasificación final: suma la victoria al marcador de la noche y castiga al último. */
      finish(names, pts, unit, teams) {
        const top = Math.max(...pts), low = Math.min(...pts);
        if (!teams && top > 0) nightAdd(names.filter((_, i) => pts[i] === top));
        const order = names.map((n, i) => [n, pts[i]]).sort((a, b) => b[1] - a[1]);
        return h('div', { class: 'center' }, h('h2', null, 'Clasificación final'), C.scores(names, pts, unit),
          top !== low && C.penalty(pick(names.filter((_, i) => pts[i] === low))),
          C.shareBtn(this.game.name, order.map(([n, p], i) => (i ? i + 1 + '. ' : '👑 ') + n + ' · ' + p + (unit || '')), this.game.color), this.endBar());
      },
    };
    function stop() {
      ctx.alive = false;
      cleanup.splice(0).forEach((f) => { try { f(); } catch (e) {} });
      session = null;
      wake(false);
      try { speechSynthesis.cancel(); } catch (e) {}
    }
    ctx.again = () => { stop(); play(g); };
    ctx.setup = () => { stop(); location.hash = '#/j/' + g.id; };
    ctx.menu = () => { stop(); location.hash = '#/'; };
    ctx.endBar = (label) => h('div', { class: 'stack endbar' }, btn(label || 'Otra partida', ctx.again, 'primary big'), h('div', { class: 'row2' }, btn('Ajustes', ctx.setup), btn('Menú', ctx.menu)));
    session = { g, stop };
    document.title = g.name + ' · ' + C.NAME;
    const root = h('div', { class: 'play', style: '--c:' + g.color },
      h('header', { class: 'top' },
        h('button', { type: 'button', class: 'icon', 'aria-label': 'Salir de la partida', onclick: async () => { if (await C.confirm('¿Salir de la partida?', 'Salir', 'Seguir jugando')) ctx.setup(); } }, '✕'),
        ttl, h('span', { class: 'icon ghost' })),
      el);
    mount(root);
    wake(true);
    g.play(ctx);
  }

  /* Modo fiesta: ejecuta otro juego dentro de la partida actual, con los mismos jugadores,
     y vuelve a llamar a done() tras «limit» tarjetas o al terminar. */
  C.canPlay = (g, n) => !problem(g, { players: Array(n).fill(''), s: loadCfg(g).s });
  C.sub = function (ctx, g, limit, done) {
    let n = 0;
    const sub = Object.assign(Object.create(ctx), {
      game: g, s: JSON.parse(JSON.stringify(loadCfg(g).s)),
      turn: () => (++n > limit ? (done(), true) : false),
      again: () => C.sub(ctx, g, limit, done),
    });
    sub.endBar = () => h('div', { class: 'stack endbar' }, btn('Siguiente juego', done, 'primary big'), h('div', { class: 'row2' }, btn('Repetir', sub.again), btn('Terminar fiesta', ctx.menu)));
    ctx.setTitle('🎉 ' + g.emoji + ' ' + g.name, g.color);
    g.play(sub);
  };

  /* ---------- Menú principal ---------- */
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const gcard = (g) => h('a', { class: 'gcard', href: '#/j/' + g.id, style: '--c:' + g.color },
    h('span', { class: 'gemoji' }, g.emoji), h('strong', null, g.name), h('span', { class: 'gtag' }, g.tag),
    h('span', { class: 'gnum' }, g.badge || '👥 ' + g.min + '–' + (g.max || 20)));
  function menu() {
    let q = '', grp = 'all';
    const list = h('div'), chips = h('div', { class: 'chips scroll' });
    const games = C.games.filter((g) => !g.hidden), byId = (ids) => ids.map((id) => games.find((g) => g.id === id)).filter(Boolean);
    function draw() {
      chips.replaceChildren(...[['all', 'Todos']].concat(C.groups).map(([id, l]) =>
        h('button', { type: 'button', class: 'chip' + (grp === id ? ' on' : ''), onclick: () => { grp = id; draw(); } }, l)));
      const out = [];
      const section = (label, gs) => gs.length && out.push(h('h2', { class: 'gtitle' }, label), h('div', { class: 'grid' }, gs.map(gcard)));
      if (!q && grp === 'all') {
        section('★ Favoritos', byId(store.get('fav', [])));
        section('Jugado hace poco', byId(store.get('recent', [])));
      }
      C.groups.forEach(([id, label]) => {
        if (grp === 'all' || grp === id) section(label, games.filter((g) => g.group === id && (!q || norm(g.name + ' ' + g.tag).includes(norm(q)))));
      });
      list.replaceChildren(...(out.length ? out : [h('p', { class: 'muted center' }, 'Ningún juego coincide con la búsqueda.')]));
    }
    const snd = h('button', { type: 'button', class: 'icon', 'aria-label': 'Sonido', onclick: () => { C.sound.on = !C.sound.on; store.set('sound', C.sound.on); snd.textContent = C.sound.on ? '🔊' : '🔇'; } }, C.sound.on ? '🔊' : '🔇');
    draw();
    document.title = C.NAME + ' · Minijuegos para jugar en grupo';
    mount(h('div', { class: 'menu' },
      h('header', { class: 'wrap brand' }, h('div', null, h('h1', null, C.NAME), h('p', { class: 'muted' }, games.length + ' juegos para un solo móvil y mucha gente alrededor.')), snd),
      h('main', { class: 'wrap' },
        h('a', { class: 'banner', href: '#/j/fiesta' }, h('span', { class: 'gemoji' }, '🎉'), h('span', null, h('strong', null, 'Modo fiesta'), h('br'), 'Una ronda de cada juego, sin volver al menú.')),
        h('div', { class: 'tools' },
          btn('🎲 Al azar', () => { location.hash = '#/j/' + pick(games).id; }, 'small'),
          h('a', { class: 'btn small', href: '#/marcador' }, '🏆 Marcador'), h('a', { class: 'btn small', href: '#/castigos' }, '😈 Castigos')),
        h('input', { type: 'search', class: 'search', placeholder: 'Buscar juego…', 'aria-label': 'Buscar juego', oninput: (e) => { q = e.target.value; draw(); } }),
        chips, list,
        h('p', { class: 'muted small center foot' }, 'Funciona sin conexión. Cada juego guarda sus propios jugadores y ajustes en este dispositivo.',
          h('br'), h('a', { href: '#/creditos' }, 'Créditos de las fotos')))));
  }

  /* Créditos de las fotos: C.content.creditos = [[ruta, qué es, autor, licencia, url de la ficha], …] */
  function credits() {
    const list = C.content.creditos || [];
    page('Créditos de las fotos',
      h('p', { class: 'muted' }, 'Las fotos de «Precio justo» vienen de Wikimedia Commons y son de dominio público o tienen licencia libre. Gracias a sus autores.'),
      h('div', { class: 'stack' }, list.map(([src, what, who, lic, url]) => h('div', { class: 'card credit' },
        h('img', { src, alt: '', loading: 'lazy' }),
        h('div', null, h('strong', null, what), h('br'), h('span', { class: 'small' }, (who || 'Autor desconocido') + ' · ' + lic), h('br'),
          h('a', { class: 'small', href: url, target: '_blank', rel: 'noopener' }, 'Ver en Wikimedia Commons'))))));
  }

  const page = (title, ...kids) => mount(h('div', { class: 'setup' },
    h('header', { class: 'top' }, h('a', { class: 'icon', href: '#/', 'aria-label': 'Volver al menú' }, '←'), h('span', { class: 'ttl' }, title), h('span', { class: 'icon ghost' })),
    h('main', { class: 'wrap' }, kids)));

  function scoreboard() {
    const n = store.get('night', {}), names = Object.keys(n);
    page('Marcador de la noche',
      h('p', { class: 'muted' }, 'Victorias acumuladas en los juegos con clasificación. Los jugadores se identifican por su nombre.'),
      names.length ? C.scores(names, names.map((k) => n[k]), ' 🏆') : h('div', { class: 'card' }, 'Todavía no ha ganado nadie. Jugad a algo con puntuación.'),
      names.length ? C.shareBtn('Marcador de la noche', names.sort((a, b) => n[b] - n[a]).map((k) => k + ' · ' + n[k] + ' 🏆')) : null,
      names.length ? btn('Poner el marcador a cero', () => { store.set('night', {}); scoreboard(); }) : null);
  }

  function penalties() {
    const p = penCfg(), save = () => { store.set('pen', p); penalties(); };
    const ta = h('textarea', { class: 'textin', rows: 4, value: p.custom.join('\n'), placeholder: 'Un castigo por línea' });
    page('Castigos',
      h('p', { class: 'muted' }, 'Quien pierda una ronda o quede último recibe un castigo al azar de las listas activas.'),
      h('section', { class: 'card' },
        h('div', { class: 'srow' }, h('div', { class: 'slabel' }, 'Castigos activados'), h('button', { type: 'button', class: 'switch' + (p.on ? ' on' : ''), role: 'switch', 'aria-checked': String(p.on), 'aria-label': 'Castigos activados', onclick: () => { p.on = !p.on; save(); } }, h('i'))),
        h('div', { class: 'srow col' }, h('div', { class: 'slabel' }, 'Listas'), h('div', { class: 'chips' }, [['suaves', 'Suaves'], ['retos', 'Retos'], ['beber', 'Beber 🍺 +18']].map(([id, l]) =>
          h('button', { type: 'button', class: 'chip' + (p.lists.includes(id) ? ' on' : '') + (id === 'beber' ? ' spicy' : ''), onclick: () => { p.lists = p.lists.includes(id) ? p.lists.filter((x) => x !== id) : p.lists.concat(id); save(); } }, l)))),
        h('div', { class: 'srow col' }, h('div', { class: 'slabel' }, 'Castigos propios'), ta, btn('Guardar', () => { p.custom = ta.value.split('\n').map((x) => x.trim()).filter(Boolean); save(); }, 'small'))),
      p.on ? h('div', { class: 'stack' }, h('p', { class: 'muted small' }, 'Ejemplo:'), C.penalty('Ana')) : null);
  }

  /* ---------- Rutas: #/  ·  #/j/<id>  ·  #/j/<id>/jugar  ·  #/marcador  ·  #/castigos  ·  #/creditos ---------- */
  function route() {
    const m = location.hash.match(/^#\/j\/([\w-]+)(\/jugar)?$/);
    const g = m && C.games.find((x) => x.id === m[1]);
    if (session) {
      if (g === session.g && m[2]) return;
      const s = session, target = location.hash || '#/';
      location.hash = '#/j/' + s.g.id + '/jugar';
      if (asking) return;
      asking = true;
      C.confirm('¿Salir de la partida?', 'Salir', 'Seguir jugando').then((ok) => {
        asking = false;
        if (ok) { s.stop(); location.hash = target; }
      });
      return;
    }
    if (g && m[2]) {
      if (problem(g, loadCfg(g))) { location.replace('#/j/' + g.id); return; }
      return play(g);
    }
    if (g) return setup(g);
    if (location.hash === '#/marcador') return scoreboard();
    if (location.hash === '#/castigos') return penalties();
    if (location.hash === '#/creditos') return credits();
    menu();
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', () => {
    C.games.forEach((g) => { if (g.custom) bankOf(g).custom = store.get('custom:' + g.id, []); });
    route();
  });
  document.addEventListener('visibilitychange', () => { if (session && document.visibilityState === 'visible') wake(true); });
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
