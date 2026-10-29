/*! SlateOS runtime: optional, dependency-free behaviour for the interactive components.
    Everything degrades gracefully without it. Include with <script src="slateos.js" defer>. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* Theme: [data-slate-theme-toggle] */
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var theme = function () { return root.getAttribute('data-theme') || (mq.matches ? 'dark' : 'light'); };
  function setTheme(t) { root.setAttribute('data-theme', t); try { localStorage.setItem('slateos-theme', t); } catch (e) {} doc.dispatchEvent(new CustomEvent('slate:theme', { detail: t })); }

  /* Density: [data-slate-density="compact|default|comfortable"] sets data-density on <html>.
     Every dial sets an explicit value, so it overrides the named style; slate.setStyle() clears the dials. */
  function setDensity(d) {
    root.setAttribute('data-density', d);
    try { localStorage.setItem('slateos-density', d); } catch (e) {}
    $$('[data-slate-density]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-slate-density') === d)); });
  }
  try { var sd = localStorage.getItem('slateos-density'); if (sd) setDensity(sd); } catch (e) {}

  /* Font vibe (needs dist/font-themes.css): [data-slate-font="neutral|crisp|friendly|editorial|technical"] sets data-font on <html> */
  var FONTS = ['neutral', 'crisp', 'friendly', 'editorial', 'technical'];
  function setFont(f) {
    if (FONTS.indexOf(f) < 0) return;
    root.setAttribute('data-font', f);
    try { localStorage.setItem('slateos-font', f); } catch (e) {}
    $$('[data-slate-font]').forEach(function (b) { var on = b.getAttribute('data-slate-font') === f; b.setAttribute(b.getAttribute('role') === 'menuitemradio' ? 'aria-checked' : 'aria-pressed', String(on)); });
    doc.dispatchEvent(new CustomEvent('slate:font', { detail: f }));
  }
  try { var sf = root.getAttribute('data-font') || localStorage.getItem('slateos-font'); if (sf) setFont(sf); } catch (e) {}

  /* Reveal on scroll: [data-slate-reveal] gets .is-visible when it enters view; [data-slate-count="1234"] counts up */
  (function () {
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function count(el) {
      var end = parseFloat(el.getAttribute('data-slate-count')), dec = (String(el.getAttribute('data-slate-count')).split('.')[1] || '').length, t0 = null, dur = 900;
      if (isNaN(end) || reduce) { el.textContent = (isNaN(end) ? el.textContent : end.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })); return; }
      (function step(t) { if (t0 === null) t0 = t; var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = (end * e).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }); if (p < 1) requestAnimationFrame(step); })(performance.now());
    }
    function arm() {
      var els = $$('[data-slate-reveal],[data-slate-count]');
      if (!els.length) return;
      if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-visible'); if (el.hasAttribute('data-slate-count')) count(el); }); return; }
      var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (!en.isIntersecting) return; en.target.classList.add('is-visible'); if (en.target.hasAttribute('data-slate-count')) count(en.target); io.unobserve(en.target); }); }, { threshold: 0.15 });
      els.forEach(function (el) { io.observe(el); });
    }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', arm); else arm();
  })();

  /* Brand (needs dist/themes.css): [data-slate-brand="default|blue|violet|green|orange|rose"] sets data-brand on <html> */
  function setBrand(b) {
    root.style.removeProperty('--slate-brand-l'); root.style.removeProperty('--slate-brand-d');
    if (b === 'default') root.removeAttribute('data-brand'); else root.setAttribute('data-brand', b);
    try { localStorage.setItem('slateos-brand', b); } catch (e) {}
    $$('[data-slate-brand]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-slate-brand') === b)); });
  }
  /* Custom brand colour (needs dist/themes.css): slate.setBrandColor('#6366f1') or inputs with [data-slate-brand-input].
     The colour is tuned per theme so button text and links keep AA contrast (4.5:1): darker on light, lighter on dark. */
  function parseHex(h) { h = String(h || '').trim().replace(/^#/, ''); if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, '$&$&'); return /^[0-9a-f]{6}$/i.test(h) ? '#' + h.toLowerCase() : null; }
  function toRgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function toHex(c) { return '#' + c.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }
  function relLum(c) { var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }
  function ratio(a, b) { var x = relLum(a), y = relLum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function toHsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s, l];
  }
  function fromHsl(h, s, l) {
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return [f(0) * 255, f(8) * 255, f(4) * 255].map(Math.round);
  }
  function mix(a, b, t) { return a.map(function (v, i) { return v * (1 - t) + b[i] * t; }); }
  /* Text in the brand colour must reach 4.5:1 on every surface it meets: the page, hover surfaces and its own tinted badge. */
  function brandFromHex(hex) {
    var base = toRgb(hex), hsl = toHsl(base), W = [255, 255, 255], K = [12, 12, 12], light = base, dark = base, l1 = hsl[2], l2 = hsl[2];
    var lightOk = function (c) { return Math.min(ratio(c, W), ratio(c, [240, 240, 240]), ratio(c, mix(W, c, 0.16))) >= 4.5; };
    var darkOk = function (c) { return Math.min(ratio(c, K), ratio(c, [36, 36, 36]), ratio(c, mix(K, c, 0.26)), ratio(c, [10, 10, 10])) >= 4.5; };
    while (!lightOk(light) && l1 > 0.02) { l1 -= 0.01; light = fromHsl(hsl[0], hsl[1], l1); }
    while (!darkOk(dark) && l2 < 0.98) { l2 += 0.01; dark = fromHsl(hsl[0], hsl[1], l2); }
    return { light: toHex(light), dark: toHex(dark) };
  }
  function setBrandColor(input) {
    var hex = parseHex(input); if (!hex) return null;
    var t = brandFromHex(hex);
    root.style.setProperty('--slate-brand-l', t.light); root.style.setProperty('--slate-brand-d', t.dark);
    root.setAttribute('data-brand', 'custom');
    try { localStorage.setItem('slateos-brand', 'custom'); localStorage.setItem('slateos-brand-custom', JSON.stringify({ c: hex, l: t.light, d: t.dark })); } catch (e) {}
    $$('[data-slate-brand]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
    $$('[data-slate-brand-input]').forEach(function (x) { if (x !== doc.activeElement) x.value = x.type === 'color' ? hex : hex.toUpperCase(); });
    $$('[data-slate-brand-note]').forEach(function (x) { x.textContent = 'Tuned for contrast: ' + t.light.toUpperCase() + ' on light, ' + t.dark.toUpperCase() + ' on dark.'; });
    doc.dispatchEvent(new CustomEvent('slate:brand', { detail: { color: hex, light: t.light, dark: t.dark } }));
    return { color: hex, light: t.light, dark: t.dark };
  }
  try {
    var sb = localStorage.getItem('slateos-brand');
    if (sb === 'custom') { var cb = JSON.parse(localStorage.getItem('slateos-brand-custom') || 'null'); if (cb && cb.c) setBrandColor(cb.c); }
    else if (sb && sb !== 'default') setBrand(sb);
  } catch (e) {}
  doc.addEventListener('input', function (e) { var t = e.target.closest && e.target.closest('[data-slate-brand-input]'); if (t && parseHex(t.value)) setBrandColor(t.value); });

  /* Corners (needs dist/themes.css): [data-slate-corners="sharp|soft|round"] sets data-corners on <html> */
  function setCorners(c) {
    root.setAttribute('data-corners', c);
    try { localStorage.setItem('slateos-corners', c); } catch (e) {}
    $$('[data-slate-corners]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-slate-corners') === c)); });
  }
  try { var sc = localStorage.getItem('slateos-corners'); if (sc) setCorners(sc); } catch (e) {}

  /* Named style (needs dist/themes.css and dist/font-themes.css): [data-slate-style="slate|quartz|pebble|flint|mica|marble"]
     sets data-style on <html>. A style is a complete look, so picking one clears the font, density and corner dials. */
  var STYLES = ['slate', 'quartz', 'pebble', 'flint', 'mica', 'marble'];
  function applyStyle(s) {
    if (s === 'slate') root.removeAttribute('data-style'); else root.setAttribute('data-style', s);
    $$('[data-slate-style]').forEach(function (b) { var on = b.getAttribute('data-slate-style') === s; b.setAttribute(b.getAttribute('role') === 'menuitemradio' ? 'aria-checked' : 'aria-pressed', String(on)); });
    // A dial left unset shows the value the style picked.
    var cs = getComputedStyle(root);
    [['density', 'default'], ['font', 'neutral']].forEach(function (d) {
      var v = root.getAttribute('data-' + d[0]) || cs.getPropertyValue('--slate-style-' + d[0]).trim() || d[1];
      $$('[data-slate-' + d[0] + ']').forEach(function (b) { b.setAttribute(b.getAttribute('role') === 'menuitemradio' ? 'aria-checked' : 'aria-pressed', String(b.getAttribute('data-slate-' + d[0]) === v)); });
    });
  }
  function setStyle(s) {
    if (STYLES.indexOf(s) < 0) return;
    ['font', 'density', 'corners'].forEach(function (k) {
      root.removeAttribute('data-' + k);
      try { localStorage.removeItem('slateos-' + k); } catch (e) {}
      $$('[data-slate-' + k + ']').forEach(function (b) { b.setAttribute(b.getAttribute('role') === 'menuitemradio' ? 'aria-checked' : 'aria-pressed', 'false'); });
    });
    applyStyle(s);
    try { localStorage.setItem('slateos-style', s); } catch (e) {}
    doc.dispatchEvent(new CustomEvent('slate:style', { detail: s }));
  }
  try { var ss = root.getAttribute('data-style') || localStorage.getItem('slateos-style'); applyStyle(STYLES.indexOf(ss) > -1 ? ss : 'slate'); } catch (e) {}

  doc.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-slate-brand]'))) { setBrand(t.getAttribute('data-slate-brand')); return; }
    if ((t = e.target.closest('[data-slate-corners]'))) { setCorners(t.getAttribute('data-slate-corners')); return; }
    if ((t = e.target.closest('[data-slate-density]'))) { setDensity(t.getAttribute('data-slate-density')); return; }
    if ((t = e.target.closest('[data-slate-style]')) || (t = e.target.closest('[data-slate-font]'))) {
      if (t.hasAttribute('data-slate-style')) setStyle(t.getAttribute('data-slate-style')); else setFont(t.getAttribute('data-slate-font'));
      var fl = t.closest('[data-slate-floating]');
      if (fl) { fl.hidden = true; var tg = $('[data-slate-toggle="#' + fl.id + '"]'); if (tg) tg.setAttribute('aria-expanded', 'false'); }
      return;
    }
    if ((t = e.target.closest('[data-slate-theme-toggle]'))) { setTheme(theme() === 'dark' ? 'light' : 'dark'); return; }

    /* Dialog: [data-slate-open="#id"] / [data-slate-close] */
    if ((t = e.target.closest('[data-slate-open]'))) { var d = $(t.getAttribute('data-slate-open')); if (d && d.showModal) d.showModal(); else if (d) d.hidden = false; return; }
    if ((t = e.target.closest('[data-slate-close]'))) { var c = t.closest('dialog'); if (c) c.close(); else { var h = t.closest('[data-slate-dismissable]'); if (h) h.hidden = true; } return; }
    var dlg = e.target.tagName === 'DIALOG' ? e.target : null;
    if (dlg && dlg.hasAttribute('open')) { var r = dlg.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close(); }

    /* Dropdown / popover: [data-slate-toggle="#id"] */
    if ((t = e.target.closest('[data-slate-toggle]'))) {
      var el = $(t.getAttribute('data-slate-toggle')); if (!el) return;
      var willOpen = el.hidden; $$('[data-slate-floating]').forEach(function (f) { f.hidden = true; });
      el.hidden = !willOpen; el.setAttribute('data-slate-floating', ''); t.setAttribute('aria-expanded', String(willOpen)); return;
    }
    if (!e.target.closest('[data-slate-floating]')) $$('[data-slate-floating]').forEach(function (f) { f.hidden = true; });

    /* Tabs: .slate-tabs > [role=tab][aria-controls] */
    if ((t = e.target.closest('.slate-tabs [role="tab"]'))) {
      var list = t.closest('.slate-tabs');
      $$('[role="tab"]', list).forEach(function (b) { var on = b === t; b.setAttribute('aria-selected', String(on)); var p = doc.getElementById(b.getAttribute('aria-controls')); if (p) p.hidden = !on; });
      return;
    }
    /* Segmented / toggle button groups */
    if ((t = e.target.closest('.slate-segmented button, .slate-button-group button[aria-pressed]'))) {
      $$('button', t.parentNode).forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); }); return;
    }
    if ((t = e.target.closest('.slate-chip[aria-pressed], .slate-toggle-button'))) { t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true')); return; }
    /* Copy: [data-slate-copy="text" | selector] */
    if ((t = e.target.closest('[data-slate-copy]'))) {
      var v = t.getAttribute('data-slate-copy'), src = v.charAt(0) === '#' ? $(v) : null, txt = src ? src.textContent : v;
      if (navigator.clipboard) navigator.clipboard.writeText(txt.trim());
      var old = t.getAttribute('data-tooltip'); t.setAttribute('data-tooltip', 'Copied'); setTimeout(function () { if (old) t.setAttribute('data-tooltip', old); else t.removeAttribute('data-tooltip'); }, 1400); return;
    }
    /* Toast: [data-slate-toast="Title|Description|tone"] */
    if ((t = e.target.closest('[data-slate-toast]'))) { var p2 = t.getAttribute('data-slate-toast').split('|'); window.slate.toast({ title: p2[0], description: p2[1], tone: p2[2] }); return; }
    /* Rating */
    if ((t = e.target.closest('.slate-rating button'))) { var all = $$('button', t.parentNode), i = all.indexOf(t); all.forEach(function (b, j) { b.setAttribute('aria-pressed', String(j <= i)); }); return; }
    /* Steppers */
    if ((t = e.target.closest('.slate-stepper-input button'))) { var inp = $('input', t.parentNode); inp.value = Math.max(0, (+inp.value || 0) + (t === t.parentNode.firstElementChild ? -1 : 1)); return; }
    /* Accordion: single-open */
    if ((t = e.target.closest('.slate-accordion[data-single] summary'))) { $$('details', t.closest('.slate-accordion')).forEach(function (d2) { if (d2 !== t.parentNode) d2.open = false; }); }
    /* Table row selection */
    if ((t = e.target.closest('.slate-table[data-selectable] tbody input[type=checkbox]'))) { syncTable(t.closest('table')); }
    if ((t = e.target.closest('.slate-table[data-selectable] thead input[type=checkbox]'))) { var tb = t.closest('table'); $$('tbody input[type=checkbox]', tb).forEach(function (x) { x.checked = t.checked; }); syncTable(tb); }
    if ((t = e.target.closest('.slate-table th .slate-table__sort'))) { sortTable(t); }
  });

  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') $$('[data-slate-floating]').forEach(function (f) { f.hidden = true; });
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { var cp = $('#slate-command-palette'); if (cp && cp.showModal) { e.preventDefault(); cp.open ? cp.close() : cp.showModal(); } }
    /* Tabs: arrow keys */
    var tab = e.target.closest && e.target.closest('[role="tab"]');
    if (tab && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { var ts = $$('[role="tab"]:not(:disabled)', tab.closest('.slate-tabs')), n = ts.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : -1); var nx = ts[(n + ts.length) % ts.length]; nx.focus(); nx.click(); }
  });

  doc.addEventListener('input', function (e) {
    var t = e.target;
    if (t.classList && t.classList.contains('slate-slider')) t.style.setProperty('--slate-fill', ((t.value - t.min) / (t.max - t.min)) * 100 + '%');
    /* Filter lists: [data-slate-filter="#list"] */
    if (t.hasAttribute && t.hasAttribute('data-slate-filter')) {
      var q = t.value.toLowerCase(); $$(t.getAttribute('data-slate-filter') + ' > *').forEach(function (it) { it.hidden = q && it.textContent.toLowerCase().indexOf(q) < 0; });
    }
  });
  $$('input[data-indeterminate]').forEach(function (i) { i.indeterminate = true; });
  $$('.slate-slider').forEach(function (s) { s.style.setProperty('--slate-fill', ((s.value - s.min) / (s.max - s.min)) * 100 + '%'); });

  function syncTable(tb) {
    var rows = $$('tbody input[type=checkbox]', tb), on = rows.filter(function (r) { return r.checked; }).length;
    rows.forEach(function (r) { r.closest('tr').setAttribute('aria-selected', String(r.checked)); });
    var head = $('thead input[type=checkbox]', tb); if (head) { head.checked = on && on === rows.length; head.indeterminate = on > 0 && on < rows.length; }
    var bar = tb.getAttribute('data-bulk') && $(tb.getAttribute('data-bulk')); if (bar) { bar.hidden = !on; var n = $('[data-count]', bar); if (n) n.textContent = on; }
  }
  $$('.slate-table[data-selectable]').forEach(syncTable);

  function sortTable(btn) {
    var th = btn.closest('th'), tb = th.closest('table'), idx = Array.prototype.indexOf.call(th.parentNode.children, th);
    var dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
    $$('th', tb).forEach(function (h) { h.removeAttribute('aria-sort'); }); th.setAttribute('aria-sort', dir);
    var body = $('tbody', tb), rows = $$('tr', body).filter(function (r) { return !r.classList.contains('slate-table__expand'); });
    var val = function (r) { var c = r.children[idx]; var s = c.getAttribute('data-sort') || c.textContent.trim(); var n = parseFloat(s.replace(/[^0-9.\-]/g, '')); return isNaN(n) || /[a-z]{2,}/i.test(s.replace(/[0-9,.$]/g, '')) ? s.toLowerCase() : n; };
    rows.sort(function (a, b) { var x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * (dir === 'ascending' ? 1 : -1); }).forEach(function (r) { body.appendChild(r); });
  }

  /* Command palette filtering + keyboard */
  doc.addEventListener('input', function (e) {
    var inp = e.target.closest && e.target.closest('.slate-command__input input'); if (!inp) return;
    var q = inp.value.toLowerCase(), items = $$('.slate-command__item', inp.closest('.slate-command'));
    items.forEach(function (it) { it.hidden = q && it.textContent.toLowerCase().indexOf(q) < 0; });
    var first = items.filter(function (i) { return !i.hidden; })[0]; items.forEach(function (i) { i.setAttribute('aria-selected', String(i === first)); });
  });
  doc.addEventListener('keydown', function (e) {
    var cmd = e.target.closest && e.target.closest('.slate-command'); if (!cmd || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault(); var items = $$('.slate-command__item', cmd).filter(function (i) { return !i.hidden; }); var cur = items.findIndex(function (i) { return i.getAttribute('aria-selected') === 'true'; });
    var nx = (cur + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach(function (i, j) { i.setAttribute('aria-selected', String(j === nx)); }); items[nx].scrollIntoView({ block: 'nearest' });
  });

  /* Toast API */
  var icons = { success: 'check-circle', danger: 'x-circle', warning: 'alert-triangle', info: 'info' };
  window.slate = window.slate || {};
  window.slate.toast = function (o) {
    var region = $('.slate-toast-region[data-live]');
    if (!region) { region = doc.createElement('div'); region.className = 'slate-toast-region'; region.setAttribute('data-live', ''); region.setAttribute('aria-live', 'polite'); doc.body.appendChild(region); }
    var tone = o.tone || 'success', el = doc.createElement('div'); el.className = 'slate-toast slate-toast--' + tone; el.setAttribute('role', 'status');
    el.innerHTML = '<svg class="slate-icon slate-icon--lg"><use href="#slate-icon-' + (icons[tone] || 'info') + '"/></svg><div class="slate-grow"><div class="slate-toast__title"></div><div class="slate-toast__desc"></div></div>' +
      '<button class="slate-close" aria-label="Dismiss"><svg class="slate-icon slate-icon--sm"><use href="#slate-icon-x"/></svg></button>';
    el.querySelector('.slate-toast__title').textContent = o.title || ''; var de = el.querySelector('.slate-toast__desc'); if (o.description) de.textContent = o.description; else de.remove();
    var kill = function () { el.classList.add('is-leaving'); setTimeout(function () { el.remove(); }, 200); };
    el.querySelector('.slate-close').addEventListener('click', kill); region.appendChild(el); setTimeout(kill, o.duration || 4200);
  };
  window.slate.setTheme = setTheme;
  window.slate.setDensity = setDensity;
  window.slate.setFont = setFont;
  window.slate.setBrand = setBrand;
  window.slate.setBrandColor = setBrandColor;
  window.slate.brandFromHex = function (h) { var x = parseHex(h); return x ? brandFromHex(x) : null; };
  window.slate.setCorners = setCorners;
  window.slate.setStyle = setStyle;
})();
