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

  /* Density: [data-slate-density="compact|default|comfortable"] sets data-density on <html> */
  function setDensity(d) {
    if (d === 'default') root.removeAttribute('data-density'); else root.setAttribute('data-density', d);
    try { localStorage.setItem('slateos-density', d); } catch (e) {}
    $$('[data-slate-density]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-slate-density') === d)); });
  }
  try { var sd = localStorage.getItem('slateos-density'); if (sd && sd !== 'default') setDensity(sd); } catch (e) {}

  /* Font vibe (needs dist/font-themes.css): [data-slate-font="neutral|crisp|friendly|editorial|technical"] sets data-font on <html> */
  var FONTS = ['neutral', 'crisp', 'friendly', 'editorial', 'technical'];
  function setFont(f) {
    if (FONTS.indexOf(f) < 0) return;
    if (f === 'neutral') root.removeAttribute('data-font'); else root.setAttribute('data-font', f);
    try { localStorage.setItem('slateos-font', f); } catch (e) {}
    $$('[data-slate-font]').forEach(function (b) { var on = b.getAttribute('data-slate-font') === f; b.setAttribute(b.getAttribute('role') === 'menuitemradio' ? 'aria-checked' : 'aria-pressed', String(on)); });
    doc.dispatchEvent(new CustomEvent('slate:font', { detail: f }));
  }
  try { var sf = root.getAttribute('data-font') || localStorage.getItem('slateos-font'); if (sf && sf !== 'neutral') setFont(sf); } catch (e) {}

  /* Brand (needs dist/themes.css): [data-slate-brand="default|blue|violet|green|orange|rose"] sets data-brand on <html> */
  function setBrand(b) {
    if (b === 'default') root.removeAttribute('data-brand'); else root.setAttribute('data-brand', b);
    try { localStorage.setItem('slateos-brand', b); } catch (e) {}
    $$('[data-slate-brand]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-slate-brand') === b)); });
  }
  try { var sb = localStorage.getItem('slateos-brand'); if (sb && sb !== 'default') setBrand(sb); } catch (e) {}

  /* Corners (needs dist/themes.css): [data-slate-corners="sharp|soft|round"] sets data-corners on <html> */
  function setCorners(c) {
    if (c === 'soft') root.removeAttribute('data-corners'); else root.setAttribute('data-corners', c);
    try { localStorage.setItem('slateos-corners', c); } catch (e) {}
    $$('[data-slate-corners]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-slate-corners') === c)); });
  }
  try { var sc = localStorage.getItem('slateos-corners'); if (sc && sc !== 'soft') setCorners(sc); } catch (e) {}

  doc.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-slate-brand]'))) { setBrand(t.getAttribute('data-slate-brand')); return; }
    if ((t = e.target.closest('[data-slate-corners]'))) { setCorners(t.getAttribute('data-slate-corners')); return; }
    if ((t = e.target.closest('[data-slate-density]'))) { setDensity(t.getAttribute('data-slate-density')); return; }
    if ((t = e.target.closest('[data-slate-font]'))) {
      setFont(t.getAttribute('data-slate-font'));
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
})();
