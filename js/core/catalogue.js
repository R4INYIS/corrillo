/* Identidad editorial, filtros de contenido y feedback local. Sin peticiones de red. */
(function (C) {
  'use strict';
  const { h, btn } = C;
  C.VERSION = '2026.11.13-auditoria';
  let identities = null, tagged = null;
  const idMap = () => {
    if (!identities) identities = new Map((C.stableCards || []).flatMap((row) => row.slice(1).map((key) => [key, row[0]])));
    return identities;
  };
  C.resolveCardId = (key) => idMap().get(key) || key;
  C.cardId = (item) => C.resolveCardId(C.legacyId(item));
  let factGroups = null;
  C.resolveFactId = (id) => {
    if (!factGroups) factGroups = new Map(Object.entries(C.factGroups || {}).flatMap(([group, questions]) => questions.map((question) => [C.cardId(question), group])));
    const resolved = C.resolveCardId(id);
    return factGroups.get(resolved) || resolved;
  };
  C.factsOf = (item) => Array.isArray(item) ? (item.length >= 8 && typeof item[3] === 'string' ? [item[0], item[3]] : [item[0]]).map((q) => C.resolveFactId(C.cardId(q))) : [];
  C.tagLabels = { materials: 'Materiales', apps: 'Otra aplicación', thirdParty: 'Terceros', contact: 'Contacto físico', effort: 'Esfuerzo físico', exposure: 'Exposición personal' };
  C.cardMeta = (item) => {
    if (!tagged) {
      tagged = new Map();
      function visit(bank, name) {
        if (Array.isArray(bank)) {
          bank.forEach((value) => {
            if (typeof value !== 'string' && !Array.isArray(value)) return;
            const id = C.cardId(value), text = String(value).toLocaleLowerCase('es-ES'), tags = new Set((tagged.get(id) || {}).tags || []);
            const action = /castigos|reto|apuesto/.test(name);
            const personal = action || /^(verdadreto|quienlodijo|yonunca|rompehielos|detallazo|probable|diez|conocemos|prefieres)/.test(name);
            if (action && /papel|moneda|cuchara|vaso|pelota|botella|bol[ií]grafo|carta de una baraja|dado\b|objeto|silla|rotulador|servilleta|palomitas|dibuj|escribir su nombre|beber|bebed|bebe\b|trago|brinda|picar/.test(text)) tags.add('materials');
            if (action && /env[ií]a|manda (un|una)|publica|sube una historia|foto de perfil|tono de llamada|estado de|historia de|abre (instagram|tiktok|whatsapp)|busca en (google|youtube)|llama (a|por)/.test(text)) tags.add('apps');
            if (action && /tercero|expareja|tu ex\b|a tu madre|a tu padre|a tus padres|a alguien que no|fuera del grupo|un desconocido|al (tercer|último) chat/.test(text)) tags.add('thirdParty');
            if (action && /besa|abraza|masaje|caricia|cosquillas|mano de|beso|sentarte en|regazo|hombros de|despeine|le coge la mano/.test(text)) tags.add('contact');
            if (action && /flexiones|sentadillas|abdominales|plancha|salta|saltar|corre|baila|baile|equilibrio|pata coja|sentadilla|sentarte sin|de pie|respiraci[oó]n|vueltas sobre|sin parpadear/.test(text)) tags.add('effort');
            if (personal && /contraseña|historial de|últim[oa] (mensaje|foto|conversaci[oó]n)|galer[ií]a|captura de|confiesa|secreto que|cuenta (tu|el|una)|enseña (tu|el|la)|muestra (tu|el|la)|peor cita|primera vez|con qui[eé]n te|a qui[eé]n besar|foto de perfil|sube una historia|manda un (sticker|audio)|tiempo de pantalla/.test(text)) tags.add('exposure');
            tagged.set(id, { id, tags: Array.from(tags), bank: name });
          });
        } else if (bank && typeof bank === 'object') Object.entries(bank).forEach(([key, value]) => visit(value, name + '.' + key));
      }
      Object.entries(C.content).filter(([key]) => key !== 'creditos').forEach(([name, bank]) => visit(bank, name));
    }
    return tagged.get(C.cardId(item)) || { id: C.cardId(item), tags: [] };
  };
  C.invalidateCatalogue = () => { tagged = null; };
  C.filterCards = (pool) => {
    const excluded = C.store.get('filters', []), hidden = C.store.get('hiddenCards', []);
    return pool.filter((item) => !hidden.includes(C.cardId(item)) && !C.cardMeta(item).tags.some((tag) => excluded.includes(tag)));
  };
  C.cardLabels = (item) => {
    const tags = C.cardMeta(item).tags;
    return tags.length ? h('p', { class: 'muted small card-labels' }, tags.map((tag) => C.tagLabels[tag]).join(' · ')) : null;
  };
  C.preferencesPanel = () => {
    const selected = new Set(C.store.get('filters', []));
    return h('div', { class: 'card stack' }, h('h2', null, 'Contenido para vuestro grupo'),
      h('p', { class: 'muted' }, 'Todas las opciones están permitidas por defecto. Marca lo que quieras excluir de las tarjetas.'),
      Object.entries(C.tagLabels).map(([tag, label]) => h('label', { class: 'srow' }, 'Excluir: ' + label,
        h('input', { type: 'checkbox', checked: selected.has(tag), onchange: (e) => { e.target.checked ? selected.add(tag) : selected.delete(tag); C.store.set('filters', Array.from(selected)); } }))),
      h('label', { class: 'srow' }, 'Compartir historial factual entre A ojo, Subasta e Impostor de cifras',
        h('input', { type: 'checkbox', checked: C.store.get('sharedFacts', true), onchange: (e) => { C.store.set('sharedFacts', e.target.checked); C.resetDeckMemory(); } })),
      h('p', { class: 'muted small' }, 'El historial compartido evita reutilizar respuestas aprendidas en los otros juegos. Reiniciarlo desde cualquiera afecta a los datos compartidos.'));
  };
  const reportBody = (report) => ['Juego: ' + report.game, 'Tarjeta: ' + report.id, 'Versión: ' + C.VERSION, 'Motivo: ' + report.reason, '', report.comment].join('\n');
  C.feedbackURL = (report) => 'https://github.com/R4INYIS/corrillo/issues/new?title=' + encodeURIComponent('[Feedback] ' + report.game + ': ' + report.reason) + '&body=' + encodeURIComponent(reportBody(report));
  C.feedbackButton = (ctx) => {
    const key = ctx.game.id === 'verdadreto' ? C.lastDrawnKey : ctx.game.id === 'impostor' && ctx.s.mode === 'parecida' ? 'impostor-pares' : ctx.game.id === 'charadas' && ctx.s.format === 'cuatro' ? 'cuatro' : ctx.game.id;
    const card = C.lastDrawn && C.lastDrawn[key];
    if (!card) return null;
    return btn('Esta tarjeta no encaja', () => {
      const reason = h('select', { 'aria-label': 'Motivo del informe' }, ['No nos gusta', 'Demasiado difícil', 'Ya la sabemos', 'Tiene un error'].map((text) => h('option', { value: text }, text)));
      const comment = h('textarea', { class: 'textin', maxLength: 600, rows: 3, placeholder: 'Comentario opcional, sin datos personales', 'aria-label': 'Comentario del informe' });
      const preview = h('pre', { class: 'feedback-preview' }), note = h('p', { class: 'muted', role: 'status' });
      const report = () => ({ id: card.id, game: ctx.game.name, reason: reason.value, comment: comment.value.trim(), date: new Date().toISOString() });
      const update = () => preview.textContent = reportBody(report());
      reason.addEventListener('change', update); comment.addEventListener('input', update); update();
      const save = () => {
        const value = report(), reports = C.store.get('feedback', []);
        if (!reports.some((r) => r.id === value.id && r.reason === value.reason && r.comment === value.comment)) reports.push(value);
        C.store.set('feedback', reports.slice(-500)); note.textContent = 'Informe guardado localmente. Puedes exportarlo desde Datos y preferencias.';
        return value;
      };
      C.dialog('Informe sobre una tarjeta', reason, comment, h('p', { class: 'muted small' }, 'Vista previa. GitHub publicará el informe solo cuando lo confirmes allí con tu cuenta.'), preview,
        btn('Guardar informe local', save, 'primary'), btn('Ocultar esta tarjeta en este dispositivo', () => {
          C.store.set('hiddenCards', C.unique(C.store.get('hiddenCards', []).concat(card.id))); note.textContent = 'Tarjeta oculta para próximos sorteos. Puedes volver a mostrarla desde Datos y preferencias.';
        }), h('a', { class: 'btn', href: C.feedbackURL(report()), target: '_blank', rel: 'noopener', onclick: (event) => {
          const value = save(); event.currentTarget.href = C.feedbackURL(value);
        } }, 'Preparar incidencia en GitHub'), note);
    }, 'small');
  };
  C.feedbackList = () => {
    const reports = C.store.get('feedback', []), hidden = C.store.get('hiddenCards', []);
    return h('details', { class: 'card how' }, h('summary', null, 'Informes locales (' + reports.length + ') · tarjetas ocultas (' + hidden.length + ')'),
      reports.map((report) => h('div', { class: 'srow' }, report.game + ' · ' + report.reason + ' · ' + report.id,
        h('a', { class: 'btn small', href: C.feedbackURL(report), target: '_blank', rel: 'noopener' }, 'Preparar en GitHub'))),
      btn('Exportar informes', () => C.download('corrillo-informes.json', new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' })), 'small'),
      hidden.length > 0 && btn('Volver a permitir las tarjetas ocultas', async () => {
        if (await C.confirm('¿Permitir de nuevo las ' + hidden.length + ' tarjetas ocultas?', 'Permitir', 'Cancelar')) { C.store.set('hiddenCards', []); location.reload(); }
      }, 'small'));
  };
  C.customEditor = (game, cfg, changed) => {
    const kinds = game.custom.dual ? ['verdad', 'reto'] : [''];
    const inputs = kinds.map((kind) => h('textarea', { class: 'textin', rows: 5, value: (C.customBank(game, kind).custom || []).join('\n'), 'aria-label': kind ? 'Tus ' + (kind === 'verdad' ? 'verdades' : 'retos') : 'Tu contenido' }));
    const labels = { impostor: ['Palabra', 'Pista opcional'], mentiroso: ['Pregunta del grupo', 'Pregunta alternativa'], prefieres: ['Opción A', 'Opción B'], onda: ['Extremo izquierdo', 'Extremo derecho'], prohibidas: ['Palabra principal', 'Prohibida 1', 'Prohibida 2', 'Prohibida 3', 'Prohibida 4', 'Prohibida 5'] }[game.id] || ['Texto de la tarjeta'];
    const fields = labels.map((label) => h('input', { type: 'text', class: 'textin', maxLength: 200, placeholder: label, 'aria-label': label }));
    const kind = h('select', { 'aria-label': 'Tipo de tarjeta propia' }, kinds.map((key, i) => h('option', { value: i }, key === 'verdad' ? 'Verdad' : key === 'reto' ? 'Reto' : 'Tarjeta')));
    const preview = h('div', { class: 'card custom-preview' }), note = h('p', { class: 'muted small', role: 'status' });
    const line = () => game.id === 'prohibidas' ? fields[0].value.trim() + '|' + fields.slice(1).map((input) => input.value.trim()).join(',') : fields.map((input) => input.value.trim()).join('|');
    fields.forEach((input) => input.addEventListener('input', () => preview.replaceChildren(...fields.map((field, i) => h(i ? 'p' : 'strong', null, field.value || labels[i])))));
    return h('details', { class: 'card how' }, h('summary', null, '✏️ Contenido propio'), kinds.length > 1 && kind,
      fields.map((input, i) => h('label', { class: 'custom-field' }, labels[i], input)), preview,
      btn('Añadir al borrador', () => {
        try {
          const parsed = C.parseCustom(game, line());
          if (!fields[0].value.trim()) throw new Error('Completa ' + labels[0].toLowerCase() + '.');
          const target = inputs[Number(kind.value)]; target.value = target.value.trim() + (target.value.trim() ? '\n' : '') + parsed.join('\n');
          fields.forEach((input) => input.value = ''); note.textContent = 'Añadida al borrador. Pulsa Guardar para conservarlo.';
        } catch (error) { note.textContent = error.message; }
      }, 'small'),
      h('details', { class: 'how' }, h('summary', null, 'Entrada masiva avanzada'), h('p', { class: 'muted small' }, game.custom.hint), inputs.map((input, i) => h('label', { class: 'custom-field' }, kinds[i] || 'Tarjetas', input))),
      note, btn('Guardar', () => {
        try {
          const values = inputs.map((input) => C.parseCustom(game, input.value));
          const value = game.custom.dual ? Object.fromEntries(kinds.map((key, i) => [key, values[i]])) : values[0];
          if (!(C.guest ? C.explicitSet : C.store.set)('custom:' + game.id, value)) throw new Error('No se ha podido guardar en este dispositivo.');
          C.applyCustom(game, value); C.invalidateCatalogue();
          cfg.s.cats = cfg.s.cats.filter((key) => key !== 'custom').concat(values.flat().length ? ['custom'] : []);
          note.textContent = values.flat().length + ' tarjetas guardadas.'; changed();
        } catch (error) { note.textContent = error.message; }
      }, 'small'));
  };
})(Corrillo);
