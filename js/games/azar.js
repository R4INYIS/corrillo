(function (C) {
  const { h, btn } = C;
  const COLORS = ['#ff6b5e', '#ffc93c', '#3dd6a3', '#5cb8ff', '#b79cff', '#ff8fc7', '#ff9a3d', '#9be564'];

  C.register({
    id: 'azar', name: 'Al azar', emoji: '🎡', color: '#9be564', group: 'palabras', min: 0, defPlayers: 4, badge: '👥 2 o más',
    tag: 'Dedos, flecha o ruleta para decidir a quién le toca.',
    playersTitle: 'Nombres u opciones de la ruleta', playersWord: 'opciones', playerWord: 'Opción',
    how: [
      'Dedos: cada persona pone un dedo en la pantalla y la app elige uno.',
      'Flecha: dejad el móvil en el centro de la mesa y hacedla girar.',
      'Ruleta: escribid nombres u opciones y que decida la suerte.',
      'Los nombres solo hacen falta para la ruleta.',
    ],
    settings: [
      { key: 'mode', label: 'Herramienta', type: 'select', def: 'dedos', options: [['dedos', '☝️ Dedos'], ['flecha', '➡️ Flecha'], ['ruleta', '🎡 Ruleta']] },
      { key: 'remove', label: 'Quitar de la ruleta la opción que salga', type: 'toggle', def: false, show: (s) => s.mode === 'ruleta' },
    ],
    validate: (s, n) => (s.mode === 'ruleta' && n < 2 ? 'La ruleta necesita al menos 2 opciones.' : null),

    play(ctx) {
      ({ dedos, flecha, ruleta })[ctx.s.mode]();

      function dedos() {
        const dots = new Map(), hint = h('p', { class: 'lead' }, 'Poned todos un dedo en la pantalla y no lo levantéis.');
        const area = h('div', { class: 'fingers' }, hint);
        let to = null, locked = false, lifted = false;
        ctx.onExit(() => clearTimeout(to));
        function reset() { dots.forEach((d) => d.remove()); dots.clear(); locked = lifted = false; }
        function sync(e) {
          e.preventDefault();
          if (locked) {
            if (!e.touches.length) lifted = true;
            if (!(lifted && e.type === 'touchstart')) return;
            reset();
          }
          const r = area.getBoundingClientRect(), seen = new Set();
          for (const t of e.touches) {
            seen.add(t.identifier);
            let d = dots.get(t.identifier);
            if (!d) { d = h('div', { class: 'dot', style: '--c:' + COLORS[dots.size % COLORS.length] }); dots.set(t.identifier, d); area.append(d); }
            d.style.left = t.clientX - r.left + 'px';
            d.style.top = t.clientY - r.top + 'px';
          }
          dots.forEach((d, id) => { if (!seen.has(id)) { d.remove(); dots.delete(id); } });
          if (e.type === 'touchmove') return;
          clearTimeout(to);
          hint.textContent = dots.size >= 2 ? 'Quietos… eligiendo.' : dots.size ? 'Hace falta al menos otro dedo.' : 'Poned todos un dedo en la pantalla y no lo levantéis.';
          if (dots.size >= 2) to = setTimeout(choose, 2500);
        }
        function choose() {
          locked = true;
          const win = C.pick([...dots.keys()]);
          dots.forEach((d, id) => d.classList.add(id === win ? 'win' : 'lose'));
          hint.textContent = '¡Elegido! Levantad los dedos y tocad para repetir.';
          C.sound.ok();
          C.buzz(200);
        }
        ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach((ev) => area.addEventListener(ev, sync, { passive: false }));
        ctx.show(area, 'ontouchstart' in window ? null : h('p', { class: 'muted small', style: 'text-align:center' }, 'Esta herramienta necesita una pantalla táctil. Ábrela en el móvil.'));
      }

      function flecha() {
        let rot = 0;
        const arrow = h('div', { class: 'arrow', html: '<svg viewBox="0 0 100 100" width="72%" aria-hidden="true"><path d="M50 6 84 48H63v46H37V48H16z" fill="#1d1a2f" stroke="#fff" stroke-width="4" stroke-linejoin="round"/></svg>' });
        const spin = () => { rot += (C.reducedMotion() ? 0 : 1440) + C.rnd(360); arrow.style.transform = 'rotate(' + rot + 'deg)'; C.buzz(30); };
        ctx.show(h('div', { class: 'center' }, h('p', { class: 'muted' }, 'Dejad el móvil plano en el centro y sentaos alrededor.'),
          h('div', { class: 'spinbox', onclick: spin }, arrow), btn('Girar la flecha', spin, 'primary big')));
      }

      function ruleta() {
        let items = ctx.players.slice(), rot = 0, busy = false, to = null;
        ctx.onExit(() => clearTimeout(to));
        const out = h('h2', null, ' '), box = h('div', { class: 'spinbox' });
        let wheel;
        function build() {
          const n = items.length, slice = 360 / n;
          rot = 0;
          wheel = h('div', { class: 'wheel', style: 'background:conic-gradient(' + items.map((_, i) => COLORS[(i % (COLORS.length - (n % COLORS.length === 1 ? 1 : 0))) % COLORS.length] + ' ' + i * slice + 'deg ' + (i + 1) * slice + 'deg').join(',') + ')' },
            items.map((t, i) => h('div', { class: 'wlabel', style: 'transform:rotate(' + ((i + 0.5) * slice - 90) + 'deg) translate(12%,-50%)' }, t)));
          box.replaceChildren(h('div', { class: 'pointer' }, '🔻'), wheel);
        }
        function spin() {
          if (busy || items.length < 2) return;
          busy = true;
          out.textContent = ' ';
          const n = items.length, slice = 360 / n, k = C.rnd(n);
          const center = (k + 0.5) * slice + (Math.random() - 0.5) * slice * 0.7;
          rot = Math.ceil(rot / 360) * 360 + (C.reducedMotion() ? 0 : 360 * 5) + (360 - center);
          wheel.style.transform = 'rotate(' + rot + 'deg)';
          to = setTimeout(() => {
            out.textContent = '🎉 ' + items[k];
            C.sound.ok();
            C.buzz(200);
            if (ctx.s.remove && items.length > 1) to = setTimeout(() => {
              items.splice(k, 1); build(); busy = false;
              if (items.length === 1) { out.textContent = '🏆 Última opción: ' + items[0]; spinButton.disabled = true; }
            }, C.reducedMotion() ? 100 : 1600);
            else busy = false;
          }, C.reducedMotion() ? 100 : 4300);
        }
        build();
        box.addEventListener('click', spin);
        const spinButton = btn('Girar la ruleta', spin, 'primary big');
        ctx.show(h('div', { class: 'center' }, out, box, spinButton, btn('Reiniciar opciones', () => {
          clearTimeout(to); items = ctx.players.slice(); busy = false; spinButton.disabled = false; out.textContent = ' '; build();
        }, 'small'), btn('Ajustes', ctx.setup, 'small')));
      }
    },
  });
})(Corrillo);
