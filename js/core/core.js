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
  C.NoCards = class extends Error {};
  C.run = (action, context) => {
    const fail = (error) => {
      const ctx = context || C.currentContext;
      if (!(error instanceof C.NoCards) || !ctx || !ctx.alive) throw error;
      const root = ctx.root || ctx;
      root.clocks && root.clocks.forEach((clock) => clock.stop());
      ctx.private = false; C.discard();
      ctx.show(C.h('div', { class: 'center stack' }, C.h('h2', null, 'No quedan tarjetas permitidas'),
        C.h('p', { class: 'muted' }, 'Cambia las categorías o revisa los filtros y las tarjetas ocultas en Datos y preferencias.'),
        C.btn('Volver a ajustes', ctx.setup, 'primary big')));
    };
    try { const result = action(); return result && typeof result.catch === 'function' ? result.catch(fail) : result; }
    catch (error) { return fail(error); }
  };

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
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), function (event) { return C.run(() => v.call(this, event)); });
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
        return true;
      } catch (e) { return false; }
    },
  });

  /* ---------- Contenido: categorías y mazo sin repeticiones ---------- */
  C.unique = (items) => Array.from(new Map(items.map((it) => [JSON.stringify(it), it])).values());
  C.pool = (byCat, cats) => C.unique(cats.flatMap((c) => byCat[c] || []));
  function hash(s) {
    let x = 5381;
    for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0;
    return x.toString(36);
  }
  const usedMem = {};
  /* Devuelve un elemento al azar que no haya salido todavía; cuando se agotan, vuelve a barajar. */
  /* Mazos sin repetir.
     · C.draw(clave, pool, {keep}) saca una carta que no se haya JUGADO en este dispositivo ni haya salido en esta sesión.
     · La carta queda pendiente y solo se guarda como jugada (localStorage «used:<clave>») cuando su ronda termina:
       al llamar a C.commit(), al sacar la siguiente carta o al llegar a la pantalla final (endBar).
     · C.skip(clave) descarta la pendiente sin guardarla (botón «Saltar» de algunos juegos).
     · Si se sale a mitad de ronda, la pendiente se olvida.
     · keep: false → no se guarda nunca entre sesiones; solo se evita repetir dentro de la sesión (En la misma onda).
     Cuando no quedan cartas sin jugar, el mazo de ese pool se baraja de nuevo. */
  C.legacyId = (it) => hash(typeof it === 'string' ? it : JSON.stringify(it));
  const idOf = (it) => C.cardId ? C.cardId(it) : C.legacyId(it);
  C.lastDrawn = {};
  const seenMem = {}, pending = {};
  const usedOf = (key) => {
    if (!usedMem[key]) {
      const old = store.get('used:' + key, []);
      usedMem[key] = C.unique(old.map((id) => key === 'facts' && C.resolveFactId ? C.resolveFactId(id) : C.resolveCardId ? C.resolveCardId(id) : id));
      if (key === 'facts' && !store.get('factsMigration', false)) {
        const pairs = Object.values(C.content.cifras).flat();
        const singles = C.estimatePool({ cats: Object.keys(C.content.cifras).concat(Object.keys(C.content.estimaciones)) });
        for (const [game, pool] of [['cifras', pairs], ['aojo', singles], ['subasta', singles]]) {
          const played = usedOf(game);
          pool.filter((item) => played.includes(idOf(item))).forEach((item) => usedMem.facts.push(...C.factsOf(item)));
        }
        usedMem.facts = C.unique(usedMem.facts);
        store.set('factsMigration', true);
      }
      if (JSON.stringify(old) !== JSON.stringify(usedMem[key])) store.set('used:' + key, usedMem[key]);
    }
    return usedMem[key];
  };
  const shared = (key) => ['aojo', 'subasta', 'cifras'].includes(key) && store.get('sharedFacts', true) && C.factsOf;
  C.offer = (key, it, opts) => {
    C.commit();
    const id = idOf(it), keep = !(opts && opts.keep === false);
    pending[key] = { id, keep, facts: shared(key) ? C.factsOf(it) : [] };
    C.lastDrawn[key] = { id, value: it };
    C.lastDrawnKey = key;
    return it;
  };
  C.commit = function () {
    Object.keys(pending).forEach((key) => {
      const p = pending[key];
      delete pending[key];
      if (!p.keep) return;
      const used = usedOf(key);
      if (!used.includes(p.id)) { used.push(p.id); store.set('used:' + key, used); }
      if (p.facts && p.facts.length) {
        const facts = usedOf('facts'); p.facts.forEach((id) => { if (!facts.includes(id)) facts.push(id); }); store.set('used:facts', facts);
      }
    });
  };
  C.skip = (key) => { delete pending[key]; };
  C.discard = () => Object.keys(pending).forEach((k) => delete pending[k]);
  C.draw = function (key, pool, opts) {
    C.commit();
    if (C.filterCards) pool = C.filterCards(pool);
    if (!pool.length) throw new C.NoCards('El mazo no contiene tarjetas permitidas.');
    const keep = !(opts && opts.keep === false);
    const seen = seenMem[key] || (seenMem[key] = []);
    const ids = pool.map(idOf);
    let used = keep ? usedOf(key) : [];
    const factUsed = shared(key) ? usedOf('facts') : [];
    const fresh = (it) => !shared(key) || !C.factsOf(it).some((id) => factUsed.includes(id));
    let free = pool.filter((it, i) => !used.includes(ids[i]) && !seen.includes(ids[i]) && fresh(it));
    if (!free.length && keep && pool.some((_, i) => used.includes(ids[i]))) {
      used = usedMem[key] = used.filter((u) => !ids.includes(u));   // mazo agotado: se baraja de nuevo
      store.set('used:' + key, used);
      free = pool.filter((it, i) => !seen.includes(ids[i]) && fresh(it));
    }
    if (!free.length) {
      seenMem[key] = seen.filter((u) => !ids.includes(u));
      free = pool.filter((it) => fresh(it));
      if (!free.length && shared(key)) {
        const reset = new Set(pool.flatMap((it) => C.factsOf(it)));
        usedMem.facts = factUsed.filter((id) => !reset.has(id)); store.set('used:facts', usedMem.facts);
      }
      if (!free.length) free = pool;
    }
    const it = pick(free), id = idOf(it);
    seenMem[key].push(id);
    pending[key] = { id, keep, facts: shared(key) ? C.factsOf(it) : [] };
    C.lastDrawn[key] = { id, value: it };
    C.lastDrawnKey = key;
    return it;
  };
  /* Cuántas cartas de un pool quedan sin jugar en este dispositivo. */
  C.unplayed = (key, pool) => { const used = usedOf(key), facts = shared(key) ? usedOf('facts') : []; return pool.filter((it) => !used.includes(idOf(it)) && (!shared(key) || !C.factsOf(it).some((id) => facts.includes(id)))).length; };
  /* Reserva un mazo sin marcar como jugadas cartas que aún no se han mostrado. */
  C.selectCards = (key, pool, count) => {
    let available = C.filterCards ? C.filterCards(C.unique(pool)) : C.unique(pool);
    const chosen = [];
    while (chosen.length < count && available.length) {
      const item = C.draw(key, available); C.skip(key); chosen.push(item);
      available = available.filter((other) => idOf(other) !== idOf(item));
    }
    return chosen;
  };
  C.forget = (key) => { usedMem[key] = []; seenMem[key] = []; delete pending[key]; store.set('used:' + key, []); if (shared(key)) { usedMem.facts = []; store.set('used:facts', []); } };
  C.resetDeckMemory = () => [usedMem, seenMem, pending].forEach((mem) => Object.keys(mem).forEach((key) => delete mem[key]));

  /* ---------- Sonido y vibración ---------- */
  let actx = null;
  C.sound = {
    on: store.get('sound', true),
    unlock() {
      if (!this.on) return;
      try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume().catch(() => {}); } catch (ignored) {}
    },
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
  C.buzz = (p) => { try { if (store.get('vibration', true)) navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

  /* ---------- Componentes compartidos ---------- */
  C.fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  C.num = (v) => Number(v).toLocaleString('es-ES');

  let confirmId = 0;
  C.confirm = function (text, yes, no) {
    return new Promise((res) => {
      const previous = document.activeElement, label = 'confirm-' + ++confirmId;
      let settled = false;
      const close = (v) => {
        if (settled) return;
        settled = true;
        m.close(); m.remove();
        if (previous && previous.isConnected) previous.focus({ preventScroll: true });
        res(v);
      };
      const cancel = btn(no || 'Cancelar', () => close(false), 'primary');
      cancel.autofocus = true;
      const m = h('dialog', { class: 'modal', 'aria-labelledby': label },
        h('div', { class: 'card' }, h('p', { id: label, class: 'lead' }, text),
          h('div', { class: 'stack' }, cancel, btn(yes || 'Aceptar', () => close(true)))));
      m.addEventListener('cancel', (e) => { e.preventDefault(); close(false); });
      m.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const buttons = m.querySelectorAll('button:not(:disabled)'), first = buttons[0], last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
      document.body.append(m);
      m.showModal();
      cancel.focus({ preventScroll: true });
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
      const fwd = () => { ctx.private = false; i++; next(); };
      ctx.private = false;
      ctx.show(h('div', { class: 'center' },
        h('div', { class: 'big-emoji' }, '🤫'),
        h('p', { class: 'lead' }, 'Pásale el móvil a'),
        h('h2', { class: 'name' }, p),
        h('p', { class: 'muted' }, opt.note || 'Que nadie más mire la pantalla.'),
        btn(opt.verb || 'Ver mi carta', () => {
          ctx.private = true;
          let c = card(p, i, fwd);
          if (c.nodeType) c = { node: c };
          if (ctx.s.holdReveal && c.node.classList.contains('secret') && C.holdSecret) c.node = C.holdSecret(c.node);
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
    const root = ctx.root || ctx;
    if (!root.clocks) root.clocks = new Set();
    let remaining = sec * 1000, end = Date.now() + remaining, done = false, paused = false;
    const stop = () => { done = true; clearInterval(id); root.clocks.delete(clock); unhook(); };
    const clock = { el, stop, pause() { if (!done && !paused) { remaining = Math.max(0, end - Date.now()); paused = true; } },
      resume() { if (!done && paused) { end = Date.now() + remaining; paused = false; tick(); } }, get paused() { return paused; } };
    function tick() {
      if (done || paused || !ctx.alive) return;
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      el.textContent = C.fmt(left);
      el.classList.toggle('low', left <= 10);
      if (clock.onTick) clock.onTick(left);
      if (left <= 0 && !done) { stop(); if (!clock.silent) C.sound.alarm(); onEnd && C.run(onEnd, ctx); }
    }
    const id = setInterval(tick, 200);
    const unhook = ctx.onExit(stop);
    root.clocks.add(clock);
    if (root.paused) clock.pause();
    tick();
    return clock;
  };

  /* Rejilla para elegir a un jugador (votaciones, acusaciones, acciones nocturnas). */
  C.pickGrid = (names, onPick, extra) =>
    h('div', { class: 'pgrid' }, names.map((n, i) => btn(n, () => onPick(i, n))), extra);

  C.scores = function (names, pts, unit) {
    const rows = names.map((n, i) => [n, pts[i] || 0]).sort((a, b) => b[1] - a[1]);
    const top = rows.length ? rows[0][1] : 0, distinct = new Set(pts).size > 1;
    return h('div', { class: 'card scores' }, rows.map(([n, p]) =>
      h('div', { class: 'score' + (p === top && distinct ? ' top' : '') }, h('span', null, (p === top && distinct ? '👑 ' : '') + n), h('b', null, C.num(p) + (unit === ' pts' && p === 1 ? ' pt' : unit || '')))));
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
    let v = o.value == null ? null : o.value;
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

    const manualInput = h('input', { type: 'text', inputMode: 'decimal', class: 'textin', placeholder: 'Ej.: 1.234.567', 'aria-label': 'Introducir cifra exacta', autocomplete: 'off' });
    const manualError = h('p', { class: 'warn', role: 'status' });
    const manual = h('div', { class: 'dial-manual stack', hidden: true }, h('label', null, 'Cifra' + (o.unit ? ' en ' + o.unit : ''), manualInput),
      h('p', { class: 'muted small' }, 'Puedes usar puntos para miles y coma para decimales.'), manualError,
      btn('Usar esta cifra', () => {
        const n = C.parseNumber(manualInput.value), min = lin ? o.min : 0, max = lin ? o.max : MAX;
        if (!Number.isFinite(n) || n < min || n > max || (lin && !Number.isInteger(n))) {
          manualError.textContent = 'Introduce ' + (lin ? 'un entero' : 'una cifra') + ' entre ' + C.num(min) + ' y ' + C.num(max) + '.'; return;
        }
        v = n; manual.hidden = true; render(); num.focus();
      }, 'small'));
    const num = h('button', { type: 'button', class: 'dial-num', 'aria-label': 'Introducir cifra con el teclado', onclick: () => {
      manual.hidden = !manual.hidden;
      if (!manual.hidden) { manualInput.value = v == null ? '' : C.num(v); manualError.textContent = ''; manualInput.focus(); }
    } }), words = h('div', { class: 'dial-words' });
    const fill = h('div', { class: 'dial-fill' }), thumb = h('div', { class: 'dial-thumb' });
    const marks = lin ? [0, 0.25, 0.5, 0.75, 1].map((p) => [p, String(fromP(p))]) : [[0, '0'], [0.25, '1K'], [0.5, '1M'], [0.75, '1B'], [1, '1T']];
    const track = h('div', { class: 'dial-track', role: 'slider', tabIndex: 0, 'aria-label': 'Tu estimación', 'aria-valuemin': lin ? o.min : 0, 'aria-valuemax': lin ? o.max : MAX }, h('div', { class: 'dial-rail' }, fill),
      Array.from({ length: lin ? 21 : 37 }, (_, i) => h('i', { class: 'dial-tick' + (i % (lin ? 5 : 3) ? '' : ' major'), style: 'left:' + (i / (lin ? 20 : 36)) * 100 + '%' })), thumb);
    function render() {
      const p = v == null ? 0 : toP(v);
      el.classList.toggle('empty', v == null);
      num.textContent = v == null ? '?' : lin ? String(v) : C.big(v);
      words.textContent = v == null ? 'Desliza para estimar' : lin ? ' ' : C.bigWords(v) || ' ';
      fill.style.width = thumb.style.left = p * 100 + '%';
      track.setAttribute('aria-valuenow', v == null ? lin ? o.min : 0 : v);
      track.setAttribute('aria-valuetext', v == null ? 'Sin estimación. Usa las flechas o desliza para elegir.' : C.num(v) + (o.unit ? ' ' + o.unit : ''));
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
      b.addEventListener('click', (e) => { if (e.detail === 0) nudge(dir); });
      return b;
    }
    let drag = false;
    const move = (e) => { const r = track.getBoundingClientRect(); v = fromP(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); render(); };
    track.addEventListener('pointerdown', (e) => { drag = true; try { track.setPointerCapture(e.pointerId); } catch (x) {} move(e); });
    track.addEventListener('pointermove', (e) => { if (drag) move(e); });
    ['pointerup', 'pointercancel'].forEach((ev) => track.addEventListener(ev, () => (drag = false)));
    track.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'Home' || e.key === 'End') { v = e.key === 'Home' ? lin ? o.min : 0 : lin ? o.max : MAX; render(); }
      else nudge(e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : -1);
    });

    const el = h('div', { class: 'dial' },
      h('div', { class: 'dial-read' }, hold(-1), h('div', { class: 'dial-screen' }, num, o.unit && h('div', { class: 'dial-unit' }, o.unit), words), hold(1)),
      track, h('div', { class: 'dial-scale' }, marks.map(([p, t]) => h('span', { style: 'left:' + p * 100 + '%' }, t))), manual);
    render();
    return { el, value: () => v, set: (n) => { if (Number.isFinite(n)) { v = clamp(n); render(); } } };
  };

  /* Coloca las estimaciones de todos sobre la misma escala, con la respuesta real marcada. */
  /* Dibuja las estimaciones sobre la barra. lin = {min, max} para barra lineal (años); si no, logarítmica 0–1T.
     zoom = {min, max, fmt}: tras un instante, la barra se amplía a escala LINEAL en ese tramo para ver las distancias reales. */
  C.plot = function (points, answer, lin, zoom) {
    const pos = (x, l) => Math.max(0, Math.min(1, l ? (x - l.min) / (l.max - l.min || 1) : Math.log10(x + 1) / 12)) * 100;
    const scaleOf = (l, fmt) => l ? [0, 0.5, 1].map((p) => [p * 100, (fmt || String)(Math.round(l.min + p * (l.max - l.min)))]) : [[0, '0'], [25, '1K'], [50, '1M'], [75, '1B'], [100, '1T']];
    const ans = h('div', { class: 'plot-ans', style: 'left:' + pos(answer, lin) + '%', 'aria-label': 'Respuesta correcta: ' + C.num(answer) });
    const dots = h('div', { class: 'plot-markers' });
    const drawPoints = (limits) => {
      const groups = [];
      points.map(([name, value], i) => ({ name, value, index: i + 1, p: pos(value, limits) })).sort((a, b) => a.p - b.p).forEach((point) => {
        const last = groups[groups.length - 1];
        if (last && point.p - last[0].p < 10) last.push(point); else groups.push([point]);
      });
      dots.replaceChildren(...groups.map((group, i) => h('div', { class: 'plot-dot' + (i % 2 ? ' low' : ''), style: 'left:' + Math.max(4, Math.min(96, group.reduce((sum, point) => sum + point.p, 0) / group.length)) + '%' },
        h('span', null, h('button', { type: 'button', 'aria-label': group.map((point) => point.name + ': ' + C.num(point.value)).join(', '), onclick: () => C.dialog('Estimaciones en este punto', group.map((point) => h('p', null, point.name + ': ' + C.num(point.value)))) }, group.length > 1 ? group.length + ' 👥' : String(group[0].index))))));
    };
    const scale = h('div', { class: 'dial-scale' }), note = h('p', { class: 'plot-note' });
    const paint = (l, fmt) => scale.replaceChildren(...scaleOf(l, fmt).map(([p, t]) => h('span', { style: 'left:' + p + '%' }, t)));
    paint(lin);
    drawPoints(lin);
    const el = h('div', { class: 'dial plot' }, h('p', { class: 'plot-key' }, 'Línea verde: solución · toca un punto para ver el detalle'), h('div', { class: 'plot-track' }, h('div', { class: 'dial-rail' }), ans, dots), scale, zoom && note,
      h('details', { class: 'plot-list' }, h('summary', null, 'Ver todas las estimaciones'), points.map(([name, value], i) => h('p', null, (i + 1) + '. ' + name + ': ' + C.num(value)))));
    if (zoom) {
      note.textContent = lin ? '' : 'Escala logarítmica';
      setTimeout(() => {
        if (!el.isConnected) return;
        el.classList.add('zoomed');
        ans.style.left = pos(answer, zoom) + '%';
        drawPoints(zoom);
        paint(zoom, zoom.fmt);
        note.textContent = '🔍 Escala ampliada (lineal): las distancias son reales';
      }, lin || (C.reducedMotion && C.reducedMotion()) ? 0 : 1100);
    }
    return el;
  };

  function stepper(v, min, max, on) {
    return h('div', { class: 'stepper' },
      h('button', { type: 'button', 'aria-label': 'Menos', disabled: v <= min, onclick: () => on(v - 1) }, '−'),
      h('b', null, v),
      h('button', { type: 'button', 'aria-label': 'Más', disabled: v >= max, onclick: () => on(v + 1) }, '+'));
  }

  /* ---------- Configuración local de cada minijuego ---------- */
  /* Categorías de un juego, más «Propias» si el grupo ha escrito contenido suyo. */
  function catsOf(g) {
    const c = g.cats;
    if (!c) return null;
    return C.hasCustom(g) ? c.concat({ id: 'custom', label: '✏️ Propias' }) : c;
  }
  function defaults(g) {
    const s = {};
    (g.settings || []).forEach((o) => (s[o.key] = o.def));
    if (catsOf(g)) s.cats = catsOf(g).filter((c) => !c.spicy && !c.optional).map((c) => c.id);
    const n = g.defPlayers != null ? g.defPlayers : Math.max(g.min || 0, 4);
    return { players: Array(n).fill(''), s };
  }
  C.normalizeCfg = function (g, cfg) {
    if (g.id === 'contrasena') {
      if (cfg.s.teams) cfg.s.mode = 'equipos';
      cfg.s.teams = false;
    }
    (g.settings || []).forEach((o) => {
      if (o.type === 'step') {
        const mx = Math.max(o.min, typeof o.max === 'function' ? o.max(cfg.players.length, cfg.s) : o.max);
        cfg.s[o.key] = Math.max(o.min, Math.min(mx, Math.round(Number(cfg.s[o.key])) || o.def));
      } else if (o.type === 'toggle') cfg.s[o.key] = typeof cfg.s[o.key] === 'boolean' ? cfg.s[o.key] : o.def;
      else if (!o.options.some(([v]) => v === cfg.s[o.key])) cfg.s[o.key] = o.def;
    });
    return cfg;
  };
  function loadCfg(g) {
    const d = defaults(g), c = store.get('cfg:' + g.id, null);
    if (!c) return C.normalizeCfg(g, d);
    const cfg = { players: Array.isArray(c.players) ? c.players.map(String) : d.players, s: Object.assign(d.s, c.s || {}) };
    if (catsOf(g)) {
      const known = Array.isArray(c.known) ? c.known : [];
      const selected = Array.isArray(cfg.s.cats) ? cfg.s.cats : [];
      cfg.s.cats = selected.filter((id) => catsOf(g).some((k) => k.id === id))
        .concat(catsOf(g).filter((k) => !k.spicy && !k.optional && !known.includes(k.id) && !selected.includes(k.id)).map((k) => k.id));
    }
    return C.normalizeCfg(g, cfg);
  }
  C.loadCfg = loadCfg;
  function problem(g, cfg) {
    const n = cfg.players.length, min = g.min || 0, max = g.max || 20, what = g.playersWord || 'jugadores';
    if (n < min) return 'Hacen falta al menos ' + min + ' ' + what + '.';
    if (n > max) return 'El máximo es de ' + max + ' ' + what + '.';
    if (g.id !== 'azar' && !g.hidePlayers) {
      const names = C.playerNames(g, cfg.players), keys = names.map(C.playerKey);
      const duplicate = keys.findIndex((key, i) => keys.indexOf(key) !== i);
      if (duplicate >= 0) return 'Hay nombres repetidos: ' + names[duplicate] + '. Añade un apellido o un mote.';
    }
    if (catsOf(g) && !cfg.s.cats.length) return 'Elige al menos una categoría.';
    if (C.filterCards && C.decks(g, cfg.s).some((deck) => !C.filterCards(deck.pool).length)) return 'No quedan tarjetas con estas categorías y filtros. Activa otras categorías o revisa Datos y preferencias.';
    if (g.teamBased && (cfg.s.teams || cfg.s.mode === 'equipos' || cfg.s.format === 'cuatro')) {
      const e = C.teamProblem(C.playerNames(g, cfg.players), cfg.s); if (e) return e;
    }
    return (g.validate && g.validate(cfg.s, n)) || null;
  }

  const mount = (...nodes) => { if (C.setupObserver) { C.setupObserver.disconnect(); C.setupObserver = null; } const a = document.getElementById('app'); a.replaceChildren(...nodes); window.scrollTo(0, 0); };

  function setup(g) {
    const cfg = loadCfg(g), max = g.max || 20;
    const save = () => { C.normalizeCfg(g, cfg); store.set('cfg:' + g.id, Object.assign({ known: (catsOf(g) || []).map((k) => k.id) }, cfg)); };
    const plist = h('div', { class: 'plist' }), phead = h('div'), sbox = h('div'), history = h('div'), summary = h('p', { class: 'setup-summary', role: 'status' }), msg = h('p', { class: 'warn', role: 'status' });
    const go = btn('Empezar', () => { save(); if (!check()) location.hash = '#/j/' + g.id + '/jugar'; }, 'primary big');
    const one = g.playerWord || 'Jugador';

    function check() {
      const e = problem(g, cfg);
      msg.textContent = e || '';
      go.disabled = !!e;
      const n = cfg.players.length, s = cfg.s;
      const rounds = s.rounds || 1, minutes = C.catalog[g.id] ? C.catalog[g.id][1] : 10;
      let workload = g.id === 'conocemos' ? (s.length === 'total' ? rounds : rounds * n) * (s.interaction === 'public' ? 2 : n) + ' elecciones aproximadas' :
        s.duration ? (s.duration >= 60 ? Math.round(s.duration / 60) + ' min por turno' : s.duration + ' s por turno') : 'Duración orientativa: ' + Math.max(1, Math.round(minutes * n / 4)) + ' min';
      const roles = [['impostors', 'impostores'], ['spies', 'espías'], ['liars', 'mentirosos'], ['wolves', 'lobos']].filter(([key]) => s[key] != null).map(([key, label]) => s[key] + ' ' + label);
      const teams = g.teamBased && (s.teams || s.mode === 'equipos' || s.format === 'cuatro') ? [s.teamCount + ' equipos'] : [];
      summary.textContent = n + ' participantes · ' + ((g.settings || []).filter((o) => ['mode', 'variant', 'format'].includes(o.key)).map((o) => (o.options.find(([v]) => v === s[o.key]) || [])[1]).filter(Boolean).concat(roles, teams).join(' · ') || 'Configuración del juego') + ' · ' + workload;
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
            oninput: (e) => { cfg.players[i] = e.target.value; save(); check(); } }),
          h('button', { type: 'button', class: 'x', 'aria-label': 'Quitar', onclick: () => { cfg.players.splice(i, 1); changed(true); } }, '×'))));
    }
    function drawSettings() {
      const n = cfg.players.length, s = cfg.s, rows = [], advanced = [];
      const advancedOpen = !!(sbox.querySelector('.setup-advanced') || {}).open;
      const teamsOpen = !!(sbox.querySelector('.team-editor') || {}).open;
      (g.settings || []).forEach((o) => {
        if (o.show && !o.show(s)) return;
        let ctl;
        if (o.type === 'toggle')
          ctl = h('button', { type: 'button', class: 'switch' + (s[o.key] ? ' on' : ''), role: 'switch', 'aria-checked': String(!!s[o.key]), 'aria-label': o.label, onclick: () => { s[o.key] = !s[o.key]; changed(); } }, h('i'));
        else if (o.type === 'step') {
          const mx = Math.max(o.min, typeof o.max === 'function' ? o.max(n, s) : o.max);
          ctl = stepper(s[o.key], o.min, mx, (v) => { s[o.key] = v; changed(); });
        } else
          ctl = h('div', { class: 'chips' }, o.options.map(([v, l]) => h('button', { type: 'button', class: 'chip' + (s[o.key] === v ? ' on' : ''), 'aria-pressed': String(s[o.key] === v), onclick: () => { s[o.key] = v; changed(); } }, l)));
        (['background', 'holdReveal', 'secretVotes', 'reveal', 'voice', 'hints', 'guess', 'penalty', 'tick', 'tilt'].includes(o.key) ? advanced : rows).push(h('div', { class: 'srow' + (o.type === 'select' ? ' col' : '') }, h('div', null, h('div', { class: 'slabel' }, o.label), o.help && h('div', { class: 'muted small' }, o.help)), ctl));
      });
      if (catsOf(g))
        advanced.push(h('div', { class: 'srow col' }, h('div', { class: 'slabel' }, g.catsTitle || 'Categorías'),
          g.categoryPresets && h('div', { class: 'chips category-presets' }, g.categoryPresets.map((preset) => btn(preset.label, () => { s.cats = preset.select(s, n); changed(); }, 'small'))),
          h('div', { class: 'chips' }, catsOf(g).map((c) => {
            const on = s.cats.includes(c.id);
            return h('button', { type: 'button', class: 'chip' + (on ? ' on' : '') + (c.spicy ? ' spicy' : ''), 'aria-pressed': String(on),
              onclick: () => { s.cats = on ? s.cats.filter((x) => x !== c.id) : s.cats.concat(c.id); changed(); } }, c.label + (c.spicy ? ' 🌶️ +18' : ''));
          }))));
      if (g.presets) rows.unshift(h('div', { class: 'chips' }, g.presets.map((preset) => btn(preset.label, () => { Object.assign(s, preset.settings); changed(); }, 'small'))));
      if (g.teamBased && (s.teams || s.mode === 'equipos' || s.format === 'cuatro')) { const editor = C.teamEditor(C.playerNames(g, cfg.players), s, () => changed()); editor.classList.add('team-editor'); editor.open = teamsOpen; rows.push(editor); }
      sbox.replaceChildren(...rows, h('details', { class: 'how setup-advanced', open: advancedOpen }, h('summary', null, 'Categorías y reglas avanzadas'), advanced));
      if (g.preview) sbox.append(g.preview(s, n));
      const decks = C.decks(g, s);
      history.replaceChildren(...(decks.length ? [h('details', { class: 'card how' }, h('summary', null, 'Tarjetas disponibles'),
        decks.map((d) => h('p', { class: 'muted small', 'data-deck': d.key }, d.repeat ? 'Las escalas pueden repetirse entre partidas.' : d.label + ': quedan ' + C.unplayed(d.key, d.pool) + ' de ' + C.unique(d.pool).length + ' sin jugar.')),
        decks.some((d) => !d.repeat) && btn('Reiniciar historial de este juego', async () => {
          if (await C.confirm('Las tarjetas de este juego podrán volver a salir. ¿Reiniciar su historial?', 'Reiniciar', 'Cancelar')) { decks.forEach((d) => C.forget(d.key)); drawSettings(); }
        }, 'small'))] : []));
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
      const kinds = g.custom.dual ? ['verdad', 'reto'] : [''];
      const inputs = kinds.map((kind) => h('textarea', { class: 'textin', rows: 5, value: (C.customBank(g, kind).custom || []).join('\n'), placeholder: kind ? kind === 'verdad' ? 'Una verdad por línea' : 'Un reto por línea' : g.custom.hint, 'aria-label': kind ? 'Tus ' + (kind === 'verdad' ? 'verdades' : 'retos') : 'Tu contenido' }));
      const note = h('span', { class: 'muted small' });
      customBox = h('details', { class: 'card how' }, h('summary', null, '✏️ Contenido propio'), h('p', { class: 'muted small', style: 'margin:10px 0' }, g.custom.hint),
        kinds.map((kind, i) => h('label', { class: 'custom-field' }, kind ? kind === 'verdad' ? 'Verdades' : 'Retos' : 'Tus tarjetas', inputs[i])),
        h('div', { class: 'srow' }, note, btn('Guardar', () => {
          try {
            const lists = inputs.map((input) => C.parseCustom(g, input.value));
            const value = g.custom.dual ? Object.fromEntries(kinds.map((kind, i) => [kind, lists[i]])) : lists[0];
            if (!store.set('custom:' + g.id, value)) throw new Error('No se ha podido guardar en este dispositivo.');
            C.applyCustom(g, value);
            inputs.forEach((input, i) => (input.value = lists[i].join('\n')));
            cfg.s.cats = cfg.s.cats.filter((x) => x !== 'custom').concat(C.hasCustom(g) ? ['custom'] : []);
            note.textContent = lists.flat().length + ' guardadas';
            changed();
          } catch (e) { note.textContent = e.message; }
        }, 'small')));
    }
    if (g.custom && C.customEditor) customBox = C.customEditor(g, cfg, changed);
    drawPlayers();
    drawSettings();
    save();
    check();
    document.title = g.name + ' · ' + C.NAME;
    mount(h('div', { class: 'setup', style: '--c:' + g.color },
      h('header', { class: 'top' }, h('a', { class: 'icon', href: '#/', 'aria-label': 'Volver al menú' }, '←'), h('span', { class: 'ttl' }, 'Preparar partida'), star),
      h('main', { class: 'wrap' },
        h('div', { class: 'hero' }, h('div', { class: 'blob' }, g.emoji), h('h1', null, g.name), h('p', { class: 'muted' }, g.tag), h('p', { class: 'muted small' }, 'Grupo recomendado: ' + C.recommended(g) + '.')),
        h('details', { class: 'card how' }, h('summary', null, 'Cómo se juega'), h('ol', null, g.how.map((t) => h('li', null, t)))),
        g.hidePlayers ? null : h('section', { class: 'card' }, h('h3', null, g.playersTitle || 'Jugadores'), phead, plist,
          cfg.players.length < max ? null : h('p', { class: 'muted small' }, 'Máximo ' + max + '.'),
          h('div', { class: 'chips' }, btn('+ Añadir', () => setCount(cfg.players.length + 1), 'small'), copyBtn), C.groupControls && C.groupControls(g, cfg, changed)),
        (g.settings || catsOf(g)) ? h('section', { class: 'card' }, h('h3', null, 'Ajustes'), sbox) : null, customBox, history),
      h('div', { class: 'bar' }, h('div', { class: 'wrap' }, summary, msg, go))));
    const footer = document.querySelector('.setup .bar'), main = document.querySelector('.setup main');
    if (window.ResizeObserver) {
      if (C.setupObserver) C.setupObserver.disconnect();
      C.setupObserver = new ResizeObserver(() => main.style.paddingBottom = footer.getBoundingClientRect().height + 24 + 'px');
      C.setupObserver.observe(footer);
    }
  }

  /* ---------- Partida ---------- */
  let session = null, asking = false, wakeLock = null;
  function wake(on) {
    try {
      if (on && navigator.wakeLock) navigator.wakeLock.request('screen').then((w) => (wakeLock = w)).catch(() => {});
      else if (wakeLock) { wakeLock.release(); wakeLock = null; }
    } catch (e) {}
  }

  /* Castigos para quien pierde (configurables desde el menú). */
  const penCfg = () => Object.assign({ on: false, lists: ['suaves', 'retos'], custom: [] }, store.get('pen', {}));
  C.penalty = function (name) {
    const p = penCfg();
    const pool = p.on ? C.filterCards(C.pool(C.content.castigos, p.lists.filter((id) => C.partySpicy !== false || id !== 'beber')).concat(p.custom)) : [];
    if (!pool.length || !name) return null;
    let remaining = C.shuffle(C.unique(pool)), current;
    const text = h('p', { class: 'lead' });
    const change = () => {
      if (!remaining.length) remaining = C.shuffle(C.unique(pool).filter((x) => x !== current));
      current = remaining.length ? remaining.pop() : current;
      text.textContent = current;
    };
    change();
    return h('div', { class: 'card pen' }, h('small', null, 'Castigo para ' + name), text, btn('Cambiar castigo', change, 'small'));
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
    const height = Math.max(1350, 510 + lines.length * 88), cv = h('canvas', { width: 1080, height }), x = cv.getContext('2d');
    x.fillStyle = color || '#ffc93c'; x.fillRect(0, 0, 1080, height);
    x.fillStyle = '#fff'; x.strokeStyle = '#1d1a2f'; x.lineWidth = 10;
    x.beginPath(); x.roundRect(70, 250, 940, height - 450, 60); x.fill(); x.stroke();
    x.fillStyle = '#1d1a2f'; x.textAlign = 'center';
    x.font = '900 84px system-ui, sans-serif'; x.fillText(title, 540, 170, 960);
    lines.forEach((t, i) => { x.font = (i ? '700 54px' : '900 66px') + ' system-ui, sans-serif'; x.fillText(t, 540, 380 + i * 88, 860); });
    x.font = '900 60px system-ui, sans-serif'; x.fillText(C.NAME + '.', 540, height - 90);
    cv.toBlob(async (blob) => {
      const file = new File([blob], 'corrillo.png', { type: 'image/png' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) return await navigator.share({ files: [file], title });
      } catch (e) { return; }
      C.download('corrillo.png', blob);
    });
  }, 'small');

  function play(g) {
    const cfg = loadCfg(g);
    const el = h('main', { class: 'wrap stage' }), ttl = h('span', { class: 'ttl' }, g.emoji + ' ' + g.name);
    const cleanup = new Set(), tools = h('div', { class: 'party-tools wrap', hidden: true });
    if (!g.hidePlayers && cfg.players.length) store.set('last', cfg.players);
    store.set('recent', [g.id].concat(store.get('recent', []).filter((x) => x !== g.id)).slice(0, 4));
    const ctx = {
      game: g, el, alive: true,
      players: C.playerNames(g, cfg.players), resultRecorded: false,
      s: JSON.parse(JSON.stringify(cfg.s)),
      onExit: (f) => { cleanup.add(f); return () => cleanup.delete(f); },
      show(...kids) { el.replaceChildren(); add(el, kids); window.scrollTo(0, 0); if (C.afterShow) C.afterShow(this); },
      turn: () => false, /* en modo fiesta devuelve true cuando toca cambiar de juego */
      setTitle(t, color) { ttl.textContent = t; root.style.setProperty('--c', color); },
      setTools(...nodes) { const visible = nodes.filter(Boolean); tools.replaceChildren(...visible); tools.hidden = !visible.length; },
      /* Pantalla de clasificación final: suma la victoria al marcador de la noche y castiga al último. */
      finish(names, pts, unit, teams) {
        const options = teams && !Array.isArray(teams) && typeof teams === 'object' ? teams : { teams: Array.isArray(teams) ? teams : teams ? C.teamsOf(this.players, this.s) : null };
        options.unit = unit;
        const rank = C.recordOutcome(this, names, pts, options);
        return h('div', { class: 'center' }, h('h2', null, options.type === 'cooperative' ? 'Resultado del grupo' : rank.tied ? 'Empate total' : rank.winners.join(' y ') + (rank.winners.length > 1 ? ' ganan' : ' gana')),
          h('p', { class: 'muted' }, options.type === 'cooperative' ? 'Puntuación conjunta · sin victoria individual' : rank.tied ? 'Todos habéis acabado con la misma puntuación.' : 'Clasificación final'), C.scores(names, pts, unit),
          options.type !== 'cooperative' && rank.losers.length > 0 && C.penalty(pick(rank.losers)),
          C.shareBtn(this.game.name, rank.order.map(([n, p], i) => (i + 1) + '. ' + n + ' · ' + p + (unit || '')), this.game.color), this.endBar());
      },
    };
    function stop() {
      ctx.alive = false;
      if (C.currentContext && (C.currentContext.root || C.currentContext) === ctx) C.currentContext = null;
      C.discard();   /* lo que quedara a medias no cuenta como jugado */
      cleanup.forEach((f) => { try { f(); } catch (e) {} });
      cleanup.clear();
      session = null;
      wake(false);
      try { speechSynthesis.cancel(); } catch (e) {}
    }
    ctx.again = () => { stop(); play(g); };
    ctx.setup = () => { stop(); location.hash = '#/j/' + g.id; };
    ctx.menu = () => { stop(); location.hash = '#/'; };
    ctx.endBar = (label) => (C.commit(), h('div', { class: 'stack endbar' }, btn(label || 'Otra partida', ctx.again, 'primary big'), h('div', { class: 'row2' }, btn('Ajustes', ctx.setup), btn('Menú', ctx.menu))));
    session = { g, stop };
    document.title = g.name + ' · ' + C.NAME;
    const root = h('div', { class: 'play', style: '--c:' + g.color },
      h('header', { class: 'top' },
        h('button', { type: 'button', class: 'icon', 'aria-label': 'Salir de la partida', onclick: async () => { if (await C.confirm('¿Salir de la partida?', 'Salir', 'Seguir jugando')) ctx.setup(); } }, '✕'),
        ttl, btn('☰', () => C.gamePanel && C.gamePanel(ctx), 'icon')),
      tools, el);
    mount(root);
    if (C.attachExperience) C.attachExperience(ctx, root);
    wake(true);
    C.currentContext = ctx;
    C.run(() => g.play(ctx), ctx);
  }

  /* Modo fiesta: ejecuta otro juego dentro de la partida actual, con los mismos jugadores,
     y vuelve a llamar a done() tras «limit» tarjetas o al terminar. */
  C.partySettings = (g, n, spicy, party) => {
    const cfg = C.normalizeCfg(g, { players: Array(n).fill(''), s: JSON.parse(JSON.stringify(loadCfg(g).s)) });
    if (spicy != null && g.cats) {
      const hot = g.cats.filter((c) => c.spicy).map((c) => c.id);
      cfg.s.cats = cfg.s.cats.filter((id) => !hot.includes(id)).concat(spicy ? hot : []);
      if (!spicy && g.id === 'yonunca' && cfg.s.rule === 'beber') cfg.s.rule = 'dedo';
    }
    if (party) {
      if (party.format !== 'full' && ['cinco', 'invento', 'charadas', 'prohibidas', 'contrasena', 'onda', 'apuesto'].includes(g.id)) cfg.s.rounds = 1;
      const minimal = party.phone === 'minimal' || party.interaction === 'public';
      if (minimal) {
        if (['impostor', 'espia'].includes(g.id)) cfg.s.tracking = 'deal';
        if ('secretVotes' in cfg.s) cfg.s.secretVotes = false;
        if (['probable', 'diez'].includes(g.id)) cfg.s.mode = 'oral';
        if (['prefieres', 'detallazo', 'conocemos', 'aojo', 'precio'].includes(g.id)) cfg.s.interaction = 'public';
      } else if (party.interaction === 'private') {
        if (['prefieres', 'detallazo', 'conocemos', 'aojo', 'precio'].includes(g.id)) cfg.s.interaction = 'private';
        if (g.id === 'probable') cfg.s.mode = 'voto';
        if (g.id === 'diez') cfg.s.mode = 'nota';
      }
    }
    return cfg.s;
  };
  C.canPlay = (g, n, spicy) => !!g && !problem(g, { players: Array(n).fill(''), s: C.partySettings(g, n, spicy) });
  C.sub = function (ctx, g, limit, done) {
    let n = 0, active = true;
    const cleanup = new Set();
    const activity = () => g.party && g.id !== 'cinco' && !(g.id === 'quienlodijo' && sub.s.competitive) && !(g.id === 'bomba' && sub.s.format !== 'open');
    function leave(commit) {
      if (!active) return false;
      active = sub.alive = false;
      cleanup.forEach((f) => { try { f(); } catch (e) {} });
      cleanup.clear(); unhook(); ctx.setTools();
      if (ctx.cover) ctx.cover.hidden = true;
      ctx.el.inert = false; ctx.el.removeAttribute('aria-hidden'); ctx.paused = false;
      if (ctx.partyLog) ctx.partyLog.push({ game: g.name, id: g.id, complete: commit && (!sub.progress || sub.resultRecorded || activity()), progress: sub.progress });
      try { speechSynthesis.cancel(); } catch (ignored) {}
      commit ? C.commit() : C.discard();
      return true;
    }
    const advance = (commit) => { if (leave(commit)) done(); };
    const sub = Object.assign(Object.create(ctx), {
      game: g, alive: true, private: false, resultRecorded: false, progress: null, s: C.partySettings(g, ctx.players.length, ctx.s.spicy, ctx.s),
      onExit: (f) => { cleanup.add(f); return () => cleanup.delete(f); },
      turn: () => (!active || (ctx.s.format !== 'full' && activity() && ++n > limit ? (advance(true), true) : false)),
      again: () => { if (leave(true)) C.sub(ctx, g, limit, done); },
      show(...nodes) { if (active && ctx.alive) ctx.show.call(sub, ...nodes); },
    });
    const unhook = ctx.onExit(() => leave(false));
    if (['cinco', 'invento', 'charadas'].includes(g.id)) {
      ctx.partyCursor = ctx.partyCursor || {};
      const offset = (ctx.partyCursor[g.id] || 0) % ctx.players.length;
      sub.players = ctx.players.slice(offset).concat(ctx.players.slice(0, offset)); ctx.partyCursor[g.id] = offset + 1;
    }
    sub.endBar = () => (C.commit(), h('div', { class: 'stack endbar' }, btn('Siguiente juego', () => advance(true), 'primary big'), h('div', { class: 'row2' }, btn('Repetir', sub.again), btn('Terminar fiesta', () => { if (leave(true)) ctx.endParty(); }))));
    ctx.setTools(activity() && btn('Actividad terminada', () => advance(true), 'small'), btn('Saltar al siguiente juego', () => advance(false), 'small'), btn('Terminar fiesta', () => { if (leave(false)) ctx.endParty(); }, 'small'));
    ctx.setTitle('🎉 ' + g.emoji + ' ' + g.name, g.color);
    C.currentContext = sub;
    C.run(() => g.play(sub), sub);
  };

  /* ---------- Menú principal ---------- */
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const menuState = { players: 0, minutes: 0, style: '', intent: '', q: '', group: 'all' };
  const gcard = (g) => h('a', { class: 'gcard', href: '#/j/' + g.id, style: '--c:' + g.color },
    h('span', { class: 'gemoji' }, g.emoji), h('strong', null, g.name), h('span', { class: 'gtag' }, g.tag),
    h('span', { class: 'gnum' }, g.badge || '👥 ' + g.min + '–' + (g.max || 20)),
    h('span', { class: 'gmeta' }, '≈ ' + C.catalog[g.id][1] + ' min · ideal: ' + C.recommended(g)));
  function menu() {
    let q = menuState.q, grp = menuState.group;
    const filters = menuState, controls = [];
    const list = h('div'), chips = h('div', { class: 'chips scroll' });
    const count = h('p', { class: 'result-count', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
    const games = C.games.filter((g) => !g.hidden), byId = (ids) => ids.map((id) => games.find((g) => g.id === id)).filter(Boolean);
    const matches = (g) => C.matches(g, filters) && (grp === 'all' || g.group === grp) && (!q.trim() || norm(g.name + ' ' + g.tag + ' ' + (g.search || '')).includes(norm(q.trim())));
    const random = btn('🎲 Al azar', () => { const eligible = games.filter(matches); if (eligible.length) location.hash = '#/j/' + pick(eligible).id; }, 'small');
    const query = h('input', { type: 'search', class: 'search', value: q, placeholder: 'Buscar juego…', 'aria-label': 'Buscar juego', oninput: (e) => { q = menuState.q = e.target.value; draw(); } });
    function reset() {
      Object.assign(menuState, { players: 0, minutes: 0, style: '', intent: '', q: '', group: 'all' });
      q = ''; grp = 'all'; query.value = '';
      controls.forEach(([key, el]) => (el.value = String(filters[key])));
      draw(); query.focus({ preventScroll: true });
    }
    const clear = btn('Limpiar búsqueda y filtros', reset, 'small');
    const select = (label, key, options) => {
      const el = h('select', {
        'aria-label': label, onchange: (e) => { filters[key] = ['style', 'intent'].includes(key) ? e.target.value : Number(e.target.value); draw(); },
      }, options.map(([value, text]) => h('option', { value, selected: filters[key] === value }, text)));
      controls.push([key, el]);
      return h('label', { class: 'filter' }, h('span', null, label), el);
    };
    const groups = [['all', 'Todos']].concat(C.groups).map(([id, label]) => [id,
      h('button', { type: 'button', class: 'chip', onclick: () => { grp = menuState.group = id; draw(); } }, label)]);
    chips.append(...groups.map(([, node]) => node));
    function draw() {
      groups.forEach(([id, node]) => { node.classList.toggle('on', grp === id); node.setAttribute('aria-pressed', String(grp === id)); });
      const found = games.filter(matches).length;
      random.disabled = !found;
      count.textContent = found + (found === 1 ? ' juego disponible' : ' juegos disponibles');
      clear.hidden = !q && grp === 'all' && !filters.players && !filters.minutes && !filters.style && !filters.intent;
      const out = [];
      const section = (label, gs) => gs.length && out.push(h('h2', { class: 'gtitle' }, label), h('div', { class: 'grid' }, gs.map(gcard)));
      if (!q && grp === 'all') {
        const personal = byId(C.unique(store.get('fav', []).concat(store.get('recent', [])))).filter(matches);
        if (personal.length) out.push(h('div', { class: 'personal-games', 'aria-label': 'Favoritos y recientes' }, personal.map((g) => h('a', { class: 'btn small', href: '#/j/' + g.id }, g.emoji + ' ' + g.name))));
      }
      C.groups.forEach(([id, label]) => {
        if (grp === 'all' || grp === id) section(label, games.filter((g) => g.group === id && matches(g)));
      });
      list.replaceChildren(...(out.length ? out : [h('div', { class: 'card empty-results center' }, h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, '🔎'),
        h('h2', null, 'Ningún juego coincide'), h('p', { class: 'muted' }, 'Prueba otra búsqueda o limpia los filtros para volver a elegir.'), btn('Mostrar todos los juegos', reset, 'primary'))]));
    }
    const snd = h('button', { type: 'button', class: 'icon', 'aria-label': 'Sonido', onclick: () => { C.sound.on = !C.sound.on; store.set('sound', C.sound.on); snd.textContent = C.sound.on ? '🔊' : '🔇'; } }, C.sound.on ? '🔊' : '🔇');
    draw();
    document.title = C.NAME + ' · Minijuegos para jugar en grupo';
    mount(h('div', { class: 'menu' },
      h('header', { class: 'wrap brand' }, h('div', null, h('h1', null, C.NAME), h('p', { class: 'muted' }, games.length + ' juegos para un solo móvil y mucha gente alrededor.')), snd),
      h('main', { class: 'wrap' },
        h('a', { class: 'banner', href: '#/j/fiesta' }, h('span', { class: 'gemoji' }, '🎉'), h('span', null, h('strong', null, 'Modo fiesta'), h('br'), 'Mezcla los ' + games.length + ' juegos sin volver al menú.')),
        h('div', { class: 'tools' },
          random,
          h('a', { class: 'btn small', href: '#/marcador' }, '🏆 Marcador'), h('a', { class: 'btn small', href: '#/castigos' }, '😈 Castigos')),
        query,
        h('details', { class: 'card menu-filters', open: !!(filters.players || filters.minutes || filters.style || filters.intent) }, h('summary', null, 'Encontrar juego para el grupo'),
          select('Jugadores', 'players', [[0, 'Cualquier grupo']].concat(Array.from({ length: 20 }, (_, i) => [i + 1, String(i + 1)]))),
          select('Duración aproximada', 'minutes', [[0, 'Cualquier duración'], [5, 'Hasta 5 min'], [15, 'Hasta 15 min'], [30, 'Hasta 30 min']]),
          select('Estilo', 'style', [['', 'Cualquier estilo']].concat(Object.entries(C.styles))),
          select('Dinámica', 'intent', [['', 'Cualquier dinámica']].concat(Object.entries(C.intents))),
          h('p', { class: 'muted small' }, 'Las etiquetas indican modalidades disponibles. Elige esa modalidad al preparar la partida; los filtros no cambian tus ajustes.'),
          h('p', { class: 'muted small' }, 'Tiempos orientativos para una partida breve con cuatro personas. Al azar también respeta estos filtros.')),
        chips, h('div', { class: 'results-head' }, count, clear), list,
        h('div', { class: 'muted small center foot' }, offlinePanel(), 'Cada juego guarda sus propios jugadores y ajustes en este dispositivo.',
          h('a', { href: '#/datos' }, 'Copias de seguridad'), h('a', { href: '#/creditos' }, 'Créditos de las fotos')))));
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
    const rows = Array.from(C.nightRows().values()).sort((a, b) => b.wins - a.wins);
    const name = h('input', { type: 'text', class: 'textin', maxLength: 16, placeholder: 'Nombre del jugador', 'aria-label': 'Jugador al que añadir una victoria' });
    page('Marcador de la noche',
      h('p', { class: 'muted' }, 'Victorias acumuladas en los juegos con clasificación. Mayúsculas y espacios no crean jugadores distintos. Puedes corregir el marcador con − y +.'),
      rows.length ? h('div', { class: 'card scores' }, rows.map((row) => h('div', { class: 'score score-edit' }, h('span', null, row.name),
        h('div', { class: 'stepper' }, h('button', { type: 'button', 'aria-label': 'Quitar una victoria a ' + row.name, disabled: !row.wins, onclick: () => { C.nightAdjust(row.name, -1); scoreboard(); } }, '−'),
          h('b', null, row.wins + ' 🏆'), h('button', { type: 'button', 'aria-label': 'Añadir una victoria a ' + row.name, onclick: () => { C.nightAdjust(row.name, 1); scoreboard(); } }, '+'))))) : h('div', { class: 'card' }, 'Todavía no ha ganado nadie. Jugad a algo con puntuación.'),
      h('div', { class: 'card stack' }, name, btn('Añadir victoria', () => { if (C.cleanName(name.value)) { C.nightAdjust(name.value, 1); scoreboard(); } }, 'small')),
      rows.length ? C.shareBtn('Marcador de la noche', rows.map((r) => r.name + ' · ' + r.wins + ' 🏆')) : null,
      rows.length ? btn('Poner el marcador a cero', async () => { if (await C.confirm('¿Borrar las victorias del marcador de la noche?', 'Borrar', 'Cancelar')) { store.set('night', {}); scoreboard(); } }) : null);
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
    if (location.hash === '#/datos') return page('Datos y preferencias', C.dataPanel(), C.preferencesPanel && C.preferencesPanel(), C.feedbackList && C.feedbackList(), C.backupPanel());
    menu();
  }

  let swRegistration = null, offlineReady = false, offlineFailed = false, reloadOnControl = false, offlineImages = null;
  function offlinePanel() {
    const el = h('div', { id: 'offline-status', role: 'status' });
    paintOffline(el);
    return el;
  }
  function paintOffline(el) {
    if (!el) return;
    el.replaceChildren(location.protocol === 'file:' ? 'Abierto desde este dispositivo.' : offlineReady ? '✓ Disponible sin conexión.' : offlineFailed || !('serviceWorker' in navigator) ? 'El modo sin conexión no está preparado en este navegador.' : 'Preparando el modo sin conexión…');
    if (offlineReady && offlineImages) {
      el.append(h('span', { class: 'small' }, ' Fotos: ' + offlineImages.images + ' de ' + offlineImages.total + '.'));
      if (offlineImages.images < offlineImages.total) el.append(btn('Completar fotos', () => swRegistration.active && swRegistration.active.postMessage({ type: 'WARM_IMAGES' }), 'small'));
    }
    if (swRegistration && swRegistration.waiting && !session) el.append(btn('Actualizar a la nueva versión', () => {
      reloadOnControl = true;
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }, 'small'));
  }
  const refreshOffline = () => paintOffline(document.getElementById('offline-status'));
  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', () => {
    try { localStorage.removeItem('corrillo:menu'); } catch (ignored) { /* Los filtros son temporales. */ }
    C.loadCustom();
    route();
  });
  document.addEventListener('visibilitychange', () => { if (session && document.visibilityState === 'visible') wake(true); });
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      swRegistration = reg; refreshOffline();
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (worker) worker.addEventListener('statechange', () => { if (worker.state === 'installed') setTimeout(refreshOffline, 0); });
      });
      navigator.serviceWorker.ready.then((ready) => {
        offlineReady = true; refreshOffline();
        if (ready.active) { ready.active.postMessage({ type: 'OFFLINE_STATUS' }); ready.active.postMessage({ type: 'WARM_IMAGES' }); }
      });
    }).catch(() => { offlineFailed = true; refreshOffline(); });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloadOnControl) location.reload(); });
    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event.data;
      if (data && data.type === 'OFFLINE_STATUS' && Number.isInteger(data.images) && Number.isInteger(data.total)) { offlineImages = data; refreshOffline(); }
    });
  }
})();
