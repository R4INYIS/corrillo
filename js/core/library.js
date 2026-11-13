/* Catálogo, contenido propio, historial y copias locales. Scripts clásicos, también en file://. */
(function (C) {
  'use strict';
  C.cleanName = (name) => String(name).trim().replace(/\s+/g, ' ');
  C.playerKey = (name) => C.cleanName(name).toLocaleLowerCase('es-ES');
  C.playerNames = (g, players) => players.map((p, i) => C.cleanName(p) || (g.playerWord || 'Jugador') + ' ' + (i + 1));

  /* Duración orientativa de una partida breve con cuatro personas. */
  C.catalog = {
    impostor: ['deduccion', 10], mentiroso: ['deduccion', 10], lobos: ['deduccion', 30], cifras: ['deduccion', 10], espia: ['deduccion', 10], onda: ['deduccion', 15],
    verdadreto: ['conversacion', 15], probable: ['conversacion', 5], rompehielos: ['conversacion', 15], prefieres: ['conversacion', 5], diez: ['conversacion', 5], detallazo: ['conversacion', 5],
    invento: ['deduccion', 10], apuesto: ['accion', 10], yonunca: ['conversacion', 5], quienlodijo: ['conversacion', 15], conocemos: ['conversacion', 15],
    aojo: ['deduccion', 15], precio: ['deduccion', 15], subasta: ['deduccion', 15], bomba: ['accion', 5], charadas: ['accion', 10], prohibidas: ['accion', 10], cinco: ['accion', 5], contrasena: ['deduccion', 10], azar: ['accion', 5],
  };
  C.styles = { conversacion: 'Conversación', deduccion: 'Deducción', accion: 'Acción' };
  C.matches = (g, f) => {
    const meta = C.catalog[g.id];
    return meta && (!f.players || C.canPlay(g, Number(f.players))) && (!f.minutes || meta[1] <= Number(f.minutes)) && (!f.style || meta[0] === f.style);
  };

  C.customBank = (g, kind) => kind ? C.content[g.custom.bank][kind] : C.content[g.custom.bank];
  C.customValue = (g) => g.custom.dual
    ? Object.fromEntries(['verdad', 'reto'].map((kind) => [kind, C.customBank(g, kind).custom || []]))
    : C.customBank(g).custom || [];
  C.applyCustom = (g, value) => {
    if (g.custom.dual) ['verdad', 'reto'].forEach((kind) => (C.customBank(g, kind).custom = value[kind] || []));
    else C.customBank(g).custom = value;
  };
  C.hasCustom = (g) => g.custom && (g.custom.dual ? Object.values(C.customValue(g)).some((a) => a.length) : C.customValue(g).length > 0);
  C.parseCustom = (g, text) => {
    const parts = { impostor: 2, mentiroso: 2, prefieres: 2, onda: 2 }[g.id];
    const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
    return C.unique(lines.map((line, i) => {
      const fixed = g.custom.fix ? g.custom.fix(line) : line;
      if (!fixed || fixed.length > 500 || (parts && (fixed.split('|').length !== parts || fixed.split('|').some((s) => !s.trim()))))
        throw new Error('Revisa la línea ' + (i + 1) + ': ' + g.custom.hint);
      return fixed;
    }));
  };

  C.estimatePool = (s) => C.unique(C.pool(C.content.cifras, s.cats).flatMap((x) => [[x[0], x[1], x[2], x[6], x[7]], [x[3], x[4], x[5], x[6], x[7]]]).concat(C.pool(C.content.estimaciones, s.cats)));
  C.decks = (g, s) => {
    if (['lobos', 'azar', 'fiesta'].includes(g.id)) return [];
    if (g.id === 'verdadreto') return ['verdad', 'reto'].map((kind) => ({ key: 'vr-' + kind, label: kind === 'verdad' ? 'Verdades' : 'Retos', pool: C.pool(C.content.verdadreto[kind], s.cats) }));
    if (g.id === 'impostor' && s.mode === 'parecida') return [{ key: 'impostor-pares', label: 'Parejas', pool: C.content.impostorPares }];
    const key = g.id, bank = { precio: 'precios', contrasena: 'charadas' }[key] || key;
    const pool = ['aojo', 'subasta'].includes(key) ? C.estimatePool(s).filter((x) => key !== 'subasta' || x[2] || x[3] < 500) : C.pool(C.content[bank], s.cats);
    return [{ key, label: 'Tarjetas', pool, repeat: key === 'onda' }];
  };

  /* Fusiona también los nombres del marcador anterior, conservando la primera grafía. */
  C.nightRows = () => {
    const rows = new Map();
    Object.entries(C.store.get('night', {})).forEach(([name, wins]) => {
      const label = C.cleanName(name), key = C.playerKey(label);
      if (!key || !Number.isInteger(wins) || wins < 0) return;
      if (rows.has(key)) rows.get(key).wins += wins;
      else rows.set(key, { name: label, wins });
    });
    return rows;
  };
  C.nightAdjust = (name, delta) => {
    const rows = C.nightRows(), key = C.playerKey(name);
    if (!key) return;
    const row = rows.get(key) || { name: C.cleanName(name), wins: 0 };
    row.wins = Math.max(0, row.wins + delta);
    rows.set(key, row);
    C.store.set('night', Object.fromEntries(Array.from(rows.values(), (r) => [r.name, r.wins])));
  };
  C.nightAdd = (names) => Array.from(new Set(names.map(C.playerKey))).forEach((key) => C.nightAdjust(names.find((n) => C.playerKey(n) === key), 1));

  const plain = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const strings = (v, max, length) => Array.isArray(v) && v.length <= max && v.every((s) => typeof s === 'string' && s.length <= length);
  const fail = (key) => { throw new Error('La copia contiene un valor no válido: ' + key + '.'); };
  function validEntry(key, value) {
    const g = C.games.find((it) => key === 'cfg:' + it.id || key === 'custom:' + it.id);
    if (key.startsWith('cfg:')) {
      if (!g || !plain(value) || !strings(value.players, g.max || 20, 16) || !plain(value.s)) fail(key);
      if (value.known != null && !strings(value.known, 100, 80)) fail(key);
      for (const [name, val] of Object.entries(value.s)) {
        if (name === 'cats') { if (!strings(val, 100, 80)) fail(key); continue; }
        const setting = (g.settings || []).find((s) => s.key === name);
        if (!setting || (setting.type === 'toggle' ? typeof val !== 'boolean' : setting.type === 'step' ? !Number.isFinite(val) : !setting.options.some(([v]) => v === val))) fail(key);
      }
    } else if (key.startsWith('custom:')) {
      if (!g || !g.custom) fail(key);
      const check = (list) => {
        if (!strings(list, 2000, 500)) fail(key);
        C.parseCustom(g, list.join('\n'));
      };
      if (g.custom.dual) {
        if (!plain(value) || Object.keys(value).some((k) => !['verdad', 'reto'].includes(k))) fail(key);
        ['verdad', 'reto'].forEach((kind) => check(value[kind]));
      } else check(value);
    } else if (key.startsWith('used:')) {
      const keys = C.games.filter((game) => !['lobos', 'azar', 'fiesta', 'verdadreto'].includes(game.id)).map((game) => game.id).concat('impostor-pares', 'vr-verdad', 'vr-reto');
      if (!keys.includes(key.slice(5)) || !strings(value, 20000, 32)) fail(key);
    } else if (key === 'night') {
      if (!plain(value) || Object.entries(value).some(([name, n]) => !name.trim() || name.length > 80 || !Number.isInteger(n) || n < 0 || n > 1000000)) fail(key);
    } else if (key === 'last') { if (!strings(value, 20, 16)) fail(key); }
    else if (['fav', 'recent'].includes(key)) { if (!strings(value, 100, 80) || value.some((id) => !C.games.some((game) => game.id === id))) fail(key); }
    else if (key === 'sound') { if (typeof value !== 'boolean') fail(key); }
    else if (key === 'pen') {
      if (!plain(value) || typeof value.on !== 'boolean' || !strings(value.lists, 3, 10) || value.lists.some((k) => !['suaves', 'retos', 'beber'].includes(k)) || !strings(value.custom, 2000, 500)) fail(key);
    } else if (key === 'menu') {
      if (!plain(value) || !Number.isInteger(value.players) || value.players < 0 || value.players > 20 || ![0, 5, 15, 30].includes(value.minutes) || !['', 'conversacion', 'deduccion', 'accion'].includes(value.style)) fail(key);
    } else fail(key);
  }
  C.exportData = () => {
    const data = Object.create(null);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('corrillo:') && key !== 'corrillo:menu') {
        const name = key.slice(9), value = JSON.parse(localStorage.getItem(key));
        validEntry(name, value);
        data[name] = value;
      }
    }
    return { app: 'Corrillo', version: 1, exportedAt: new Date().toISOString(), data };
  };
  C.readBackup = (text) => {
    if (text.length > 2000000) throw new Error('La copia supera los 2 MB.');
    let backup;
    try { backup = JSON.parse(text); } catch (e) { throw new Error('El archivo no contiene una copia JSON válida.'); }
    if (!plain(backup) || backup.app !== 'Corrillo' || backup.version !== 1 || !plain(backup.data)) throw new Error('Esta copia no es de Corrillo o usa otra versión.');
    Object.entries(backup.data).forEach(([key, value]) => validEntry(key, value));
    return backup;
  };
  C.importData = (backup) => {
    const checked = C.readBackup(JSON.stringify(backup));
    const entries = Object.entries(checked.data).filter(([key]) => key !== 'menu'), previous = entries.map(([key]) => [key, localStorage.getItem('corrillo:' + key)]);
    try { entries.forEach(([key, value]) => localStorage.setItem('corrillo:' + key, JSON.stringify(value))); }
    catch (e) {
      let restored = true;
      try {
        previous.forEach(([key]) => localStorage.removeItem('corrillo:' + key));
        previous.forEach(([key, value]) => { if (value != null) localStorage.setItem('corrillo:' + key, value); });
      } catch (ignored) { restored = false; }
      throw new Error(restored ? 'No se ha podido restaurar la copia. Se han conservado los datos anteriores.' : 'El navegador ha bloqueado el almacenamiento durante la restauración. Conserva tu copia y vuelve a intentarlo.');
    }
    C.resetDeckMemory();
    C.loadCustom();
    C.sound.on = C.store.get('sound', true);
  };
  C.loadCustom = () => C.games.forEach((g) => {
    if (g.custom) C.applyCustom(g, C.store.get('custom:' + g.id, g.custom.dual ? { verdad: [], reto: [] } : []));
  });
  C.download = (name, blob) => {
    const url = URL.createObjectURL(blob), a = C.h('a', { href: url, download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  C.backupPanel = () => {
    const { h, btn } = C, note = h('p', { class: 'warn', role: 'status' });
    const input = h('input', { type: 'file', accept: '.json,application/json', hidden: true, 'aria-label': 'Elegir copia de Corrillo', onchange: async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        if (file.size > 2000000) throw new Error('La copia supera los 2 MB.');
        const backup = C.readBackup(await file.text());
        if (!await C.confirm('Se restaurarán los ajustes, preguntas e historial incluidos en la copia. Los demás datos se conservarán.', 'Restaurar', 'Cancelar')) return;
        C.importData(backup);
        note.textContent = 'Copia restaurada.';
      } catch (e) { note.textContent = e.message; }
      finally { input.value = ''; }
    } });
    return h('div', { class: 'stack' },
      h('p', { class: 'muted' }, 'Guarda una copia para cambiar de móvil o recuperar tus preguntas, jugadores, ajustes y marcador. El archivo incluye los nombres y textos que hayas escrito.'),
      btn('Descargar copia', () => {
        try { C.download('corrillo-copia.json', new Blob([JSON.stringify(C.exportData(), null, 2)], { type: 'application/json' })); }
        catch (e) { note.textContent = e.message; }
      }, 'primary'), btn('Restaurar una copia', () => input.click()), input, note);
  };
  C.sourceNote = (question) => {
    const source = (C.sources || []).find((s) => s.question === question);
    if (!source) return null;
    return C.h('p', { class: 'muted small source' }, 'Dato aproximado cuando se indica. ', source.urls.map((url, i) => [i ? ' · ' : '', C.h('a', { href: url, target: '_blank', rel: 'noopener' }, 'Fuente' + (source.urls.length > 1 ? ' ' + (i + 1) : ''))]), ' · Revisado: ' + source.checked);
  };
})(Corrillo);
