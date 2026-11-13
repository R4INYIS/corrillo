/* Preferencias de sesión, privacidad y controles comunes. Nunca guarda partidas. */
(function (C) {
  'use strict';
  const { h, btn } = C, persistentGet = C.store.get, persistentSet = C.store.set;
  C.reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  C.holdSecret = (node) => {
    node.hidden = true;
    const control = btn('Mantén pulsado para mostrar', null, 'primary big');
    const show = (event) => { event.preventDefault(); node.hidden = false; control.setAttribute('aria-pressed', 'true'); };
    const hide = () => { node.hidden = true; control.setAttribute('aria-pressed', 'false'); };
    control.setAttribute('aria-pressed', 'false');
    control.addEventListener('pointerdown', (event) => { try { control.setPointerCapture(event.pointerId); } catch (ignored) {} show(event); });
    ['pointerup', 'pointercancel', 'lostpointercapture', 'blur'].forEach((name) => control.addEventListener(name, hide));
    control.addEventListener('keydown', (event) => { if ([' ', 'Enter'].includes(event.key)) show(event); });
    control.addEventListener('keyup', (event) => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); hide(); } });
    return h('div', { class: 'stack' }, control, node);
  };
  const temporary = new Map();
  C.guest = false;
  C.store.get = (key, fallback) => {
    if (C.guest && temporary.has(key)) return temporary.get(key);
    if (C.guest && /^(cfg:|used:|night$|last$|recent$)/.test(key)) return fallback;
    return persistentGet(key, fallback);
  };
  C.store.set = (key, value) => C.guest ? (temporary.set(key, JSON.parse(JSON.stringify(value))), true) : persistentSet(key, value);
  C.store.remove = (key) => { if (C.guest) temporary.delete(key); else localStorage.removeItem('corrillo:' + key); };
  C.setGuest = (enabled) => {
    C.guest = enabled; temporary.clear(); C.resetDeckMemory(); C.loadCustom(); C.sound.on = C.store.get('sound', true);
  };
  C.explicitSet = (key, value) => {
    const saved = persistentSet(key, value);
    if (saved && C.guest) temporary.set(key, JSON.parse(JSON.stringify(value)));
    return saved;
  };
  C.guestEntries = () => Array.from(temporary.entries());
  const register = C.register;
  C.register = (game) => {
    if (game.id !== 'fiesta') game.settings = (game.settings || []).concat([
      { key: 'background', label: 'Al pasar a segundo plano', type: 'select', def: 'pause', options: [['pause', 'Pausar el tiempo'], ['continue', 'Continuar el tiempo']] },
      { key: 'holdReveal', label: 'Mantener pulsado para ver secretos', type: 'toggle', def: false, help: 'También funciona manteniendo Espacio o Intro con el teclado.' },
    ]);
    register(game);
  };
  C.dialog = (title, ...nodes) => {
    const previous = document.activeElement;
    const close = () => { dialog.close(); dialog.remove(); if (previous && previous.isConnected) previous.focus(); };
    const dialog = h('dialog', { class: 'modal', 'aria-label': title }, h('div', { class: 'card stack' }, h('h2', null, title), nodes, btn('Cerrar', close, 'primary')));
    dialog.addEventListener('close', () => { dialog.remove(); if (previous && previous.isConnected) previous.focus(); });
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
    document.body.append(dialog); dialog.showModal();
    return dialog;
  };
  C.attachExperience = (ctx, element) => {
    ctx.root = ctx; ctx.activeContext = ctx;
    ctx.clocks = new Set();
    ctx.status = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
    element.append(ctx.status);
    const cover = h('div', { class: 'privacy-cover', hidden: true });
    element.append(cover);
    ctx.cover = cover;
    ctx.pause = (privacyOnly) => {
      if (!ctx.alive) return;
      const current = ctx.activeContext;
      if (!privacyOnly) { ctx.clocks.forEach((clock) => clock.pause()); ctx.paused = true; }
      try { speechSynthesis.cancel(); } catch (ignored) {}
      ctx.el.inert = true; ctx.el.setAttribute('aria-hidden', 'true');
      cover.replaceChildren(h('div', { class: 'card center' }, h('div', { class: 'big-emoji' }, '🤫'),
        h('h2', null, ctx.paused ? 'Partida en pausa' : 'Pantalla cubierta'),
        h('p', { class: 'muted' }, current.private ? 'Devuelve el móvil a quien estaba mirando. El turno sigue siendo el mismo.' : 'Continúa cuando el grupo esté listo.'),
        btn(ctx.paused ? 'Reanudar' : 'Volver a mostrar', () => {
          cover.hidden = true; ctx.el.inert = false; ctx.el.removeAttribute('aria-hidden'); ctx.paused = false; ctx.clocks.forEach((clock) => clock.resume());
          const focus = ctx.el.querySelector('button, input, [tabindex]'); if (focus) focus.focus();
        }, 'primary big')));
      cover.hidden = false;
    };
    const visibility = () => {
      if (document.hidden) {
        const current = ctx.activeContext;
        const pause = current.s.background !== 'continue' && ctx.clocks.size > 0;
        if (pause || current.private) ctx.pause(!pause);
      }
    };
    document.addEventListener('visibilitychange', visibility);
    ctx.onExit(() => { document.removeEventListener('visibilitychange', visibility); cover.remove(); });
  };
  C.afterShow = (ctx) => {
    C.currentContext = ctx;
    const root = ctx.root || ctx;
    root.activeContext = ctx;
    if (root.status) root.status.textContent = ctx.private ? '' : (ctx.el.querySelector('h2, .lead, .pill') || {}).textContent || '';
    if (!ctx.private) {
      const current = C.lastDrawn && C.lastDrawn[ctx.game.id];
      if (current && !ctx.el.querySelector('.card-labels') && C.cardLabels) {
        const labels = C.cardLabels(current.value); if (labels) ctx.el.append(labels);
      }
      const heading = ctx.el.querySelector('h1, h2, .lead');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }
    if (document.hidden && (ctx.private || (root.clocks && root.clocks.size && ctx.s.background !== 'continue'))) root.pause && root.pause(ctx.s.background === 'continue');
  };
  C.gamePanel = (ctx) => {
    const root = ctx.root || ctx, current = root.activeContext || ctx;
    const dialog = C.dialog('Opciones de partida',
      btn('Sonido: ' + (C.sound.on ? 'activado' : 'desactivado'), (e) => { C.sound.on = !C.sound.on; C.store.set('sound', C.sound.on); e.currentTarget.textContent = 'Sonido: ' + (C.sound.on ? 'activado' : 'desactivado'); }),
      btn('Vibración: ' + (C.store.get('vibration', true) ? 'activada' : 'desactivada'), (e) => {
        const enabled = !C.store.get('vibration', true); C.store.set('vibration', enabled); e.currentTarget.textContent = 'Vibración: ' + (enabled ? 'activada' : 'desactivada');
      }),
      btn('Pausar y cubrir pantalla', () => { dialog.close(); root.pause(false); }),
      h('details', { class: 'how' }, h('summary', null, 'Reglas públicas'), h('ol', null, current.game.how.map((text) => h('li', null, text)))),
      C.feedbackButton && C.feedbackButton(current));
  };
  C.dataPanel = () => {
    const note = h('p', { class: 'muted', role: 'status' });
    const groups = [
      ['Jugadores y grupos guardados', /^(cfg:|last$|groups$)/, 'players'], ['Marcador', /^night$/, 'all'],
      ['Historial de cartas', /^(used:|factsMigration$)/, 'all'], ['Ajustes y preferencias', /^(cfg:|sound$|vibration$|pen$|filters$|sharedFacts$)/, 'settings'],
      ['Favoritos y recientes', /^(fav|recent)$/, 'all'], ['Contenido propio', /^custom:/, 'all'], ['Informes y tarjetas ocultas', /^(feedback|hiddenCards)$/, 'all'],
    ];
    const selected = new Set();
    return h('div', { class: 'stack' },
      h('p', { class: 'muted' }, 'Los nombres, ajustes, cartas propias e historial se guardan en este navegador. Las respuestas y partidas activas solo viven en memoria.'),
      btn('Modo invitado: ' + (C.guest ? 'activado' : 'desactivado'), (e) => {
        C.setGuest(!C.guest); e.currentTarget.textContent = 'Modo invitado: ' + (C.guest ? 'activado' : 'desactivado');
        note.textContent = C.guest ? 'Esta sesión no guardará automáticamente cambios. Al desactivarla vuelven los datos anteriores.' : 'Han vuelto los datos guardados del dispositivo.';
      }),
      h('details', { class: 'card how' }, h('summary', null, 'Borrar datos por categorías'), groups.map(([label], i) => h('label', { class: 'srow' }, label,
        h('input', { type: 'checkbox', onchange: (e) => e.target.checked ? selected.add(i) : selected.delete(i) }))),
        btn('Borrar lo seleccionado', async () => {
          if (!selected.size || !await C.confirm('¿Borrar las categorías seleccionadas? Esta acción no se puede deshacer.', 'Borrar', 'Cancelar')) return;
          const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter((key) => key.startsWith('corrillo:')).map((key) => key.slice(9));
          for (const index of selected) {
            const [, regex, kind] = groups[index];
            keys.filter((key) => regex.test(key)).forEach((key) => {
              if (key.startsWith('cfg:') && kind === 'players') {
                const cfg = persistentGet(key, null); if (cfg) { cfg.players = cfg.players.map(() => ''); persistentSet(key, cfg); }
              } else if (key.startsWith('cfg:') && kind === 'settings') {
                const cfg = persistentGet(key, null); if (cfg) persistentSet(key, { players: cfg.players, s: {}, known: [] });
              } else localStorage.removeItem('corrillo:' + key);
            });
          }
          C.resetDeckMemory(); C.loadCustom(); C.sound.on = C.store.get('sound', true); note.textContent = 'Datos seleccionados borrados.';
        }, 'small')), note);
  };
  C.groupControls = (game, cfg, changed) => {
    const saved = C.store.get('groups', []), name = h('input', { class: 'textin', maxLength: 40, placeholder: 'Nombre del grupo', 'aria-label': 'Nombre del grupo guardado' });
    const message = h('p', { class: 'warn', role: 'status' });
    return h('details', { class: 'how' }, h('summary', null, 'Grupos guardados'),
      saved.map((group, i) => h('div', { class: 'srow' }, btn('Usar ' + group.name, () => { cfg.players = group.players.slice(0, game.max || 20); changed(true); }, 'small'),
        btn('Eliminar', async () => { if (await C.confirm('¿Eliminar el grupo «' + group.name + '»?', 'Eliminar', 'Cancelar')) { C.explicitSet('groups', C.store.get('groups', []).filter((value) => C.playerKey(value.name) !== C.playerKey(group.name))); message.textContent = 'Grupo eliminado. Vuelve a abrir la configuración para actualizar la lista.'; } }, 'small'))),
      name, btn('Guardar este grupo', () => {
        const label = name.value.trim(); if (!label) { message.textContent = 'Escribe un nombre para el grupo.'; return; }
        const groups = C.store.get('groups', []).filter((group) => C.playerKey(group.name) !== C.playerKey(label));
        groups.push({ name: label, players: C.playerNames(game, cfg.players) });
        C.explicitSet('groups', groups); message.textContent = 'Grupo guardado. Cada juego importará una copia independiente.';
      }, 'small'), message);
  };
})(Corrillo);
