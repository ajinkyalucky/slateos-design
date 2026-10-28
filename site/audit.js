/* Dev-only visual audit. Load the docs with ?audit to measure every specimen for layout defects.
   Results are written to #audit-result as JSON (read it with `chrome --dump-dom`). */
(function () {
  // Number of rendered text lines inside el (counts distinct line tops of its text nodes).
  function lines(el) {
    var rects = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n, rg = document.createRange();
    while ((n = w.nextNode())) { if (!n.nodeValue.trim()) continue; rg.selectNodeContents(n); Array.prototype.forEach.call(rg.getClientRects(), function (r) { if (r.width > 1 && r.height > 1) rects.push({ c: (r.top + r.bottom) / 2, h: r.height }); }); }
    rects.sort(function (a, b) { return a.c - b.c; });
    var count = 0, last = null;
    rects.forEach(function (r) { if (last === null || r.c - last > Math.min(r.h, 14) * 0.7) { count++; last = r.c; } });
    return count;
  }
  function run() {
    var issues = [];
    var add = function (c, kind, el, extra) { issues.push({ c: c, kind: kind, el: (el.tagName.toLowerCase() + '.' + String(el.className && el.className.baseVal === undefined ? el.className : '').trim().split(/\s+/).slice(0, 3).join('.')).slice(0, 70), x: extra || '' }); };
    var SKIP_OVERLAP = /slate-avatar-group|slate-button-group|slate-segmented|slate-stat-row|slate-tabs|slate-steps|slate-heatmap|slate-board|slate-timeline|slate-chart/;
    var NO_WRAP = '.slate-button,.slate-badge,.slate-tag,.slate-chip,.slate-status,kbd,.slate-mono,.slate-tab,.slate-page,.slate-nav-item,.slate-menu__item';
    var SKIP_CLIP = '.slate-truncate,.slate-avatar,.slate-progress,.slate-skeleton,.slate-device,.slate-frame,.slate-preview-frame,.doc-preview--bare,.slate-table-wrap,.slate-scroll,.slate-tabs,.slate-carousel,.slate-board,.slate-pre,.slate-codeblock,.slate-stat-row,.slate-chart__bar,.slate-ring,.slate-switch,.slate-status,.slate-spinner,.slate-donut,.slate-calendar__day,.slate-otp,.slate-file__icon,.slate-hero,.slate-hero__bg,.slate-sidebar,.slate-drawer,.slate-sheet,.slate-menu,.slate-combobox';
    document.querySelectorAll('.doc-c').forEach(function (c) {
      var name = c.id, prev = c.querySelector('.doc-preview'); if (!prev) return;
      var pr = prev.getBoundingClientRect();
      if (prev.scrollWidth > prev.clientWidth + 2) add(name, 'preview-hscroll', prev, prev.scrollWidth + '>' + prev.clientWidth);
      prev.querySelectorAll('*').forEach(function (el) {
        var cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
        var r = el.getBoundingClientRect(); if (r.width === 0 && r.height === 0) { if (/^(BUTTON|INPUT|SELECT|TEXTAREA|SVG|IMG)$/i.test(el.tagName) && !el.closest('[hidden]') && !el.classList.contains('slate-sr-only') && el.type !== 'checkbox' && el.type !== 'radio') add(name, 'zero-size', el); return; }
        if (cs.borderTopLeftRadius === '50%' && Math.abs(r.width - r.height) > 1.5 && r.width > 2) add(name, 'not-round', el, Math.round(r.width) + 'x' + Math.round(r.height));
        if (el.matches('.slate-icon') && Math.abs(r.width - r.height) > 1) add(name, 'icon-not-square', el, Math.round(r.width) + 'x' + Math.round(r.height));
        if (el.matches(NO_WRAP) && lines(el) > 1) add(name, 'wraps', el, lines(el) + ' lines');
        if (cs.position !== 'absolute' && cs.position !== 'fixed' && !el.closest('.slate-preview-frame,.slate-device,.slate-frame,.doc-preview--bare,.slate-scroll,.slate-table-wrap,.slate-carousel,.slate-board,.slate-pre,.slate-codeblock,.slate-tabs')) {
          if (r.right > pr.right + 2 || r.left < pr.left - 2) add(name, 'outside-preview', el, Math.round(r.left - pr.left) + '..' + Math.round(r.right - pr.right));
        }
        if (!el.matches(SKIP_CLIP) && !el.closest(SKIP_CLIP) && (cs.overflowX === 'visible' || cs.overflowX === 'hidden') && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && el.children.length && !el.querySelector('[data-tooltip]') && !el.matches('svg,table,tbody,thead,tr,input,textarea,select,button')) add(name, cs.overflowX === 'hidden' ? 'clipped' : 'overflows-box', el, el.scrollWidth + '>' + el.clientWidth);
        if ((cs.display.indexOf('flex') > -1 || cs.display.indexOf('grid') > -1) && !el.closest(SKIP_OVERLAP.source ? '.slate-avatar-group,.slate-button-group,.slate-segmented,.slate-stat-row,.slate-steps,.slate-heatmap,.slate-timeline,.slate-chart__plot,.slate-calendar__grid,.slate-otp,.slate-input-group' : '')) {
          var kids = Array.prototype.filter.call(el.children, function (k) { var s = getComputedStyle(k); var b = k.getBoundingClientRect(); return s.display !== 'none' && s.position !== 'absolute' && s.position !== 'fixed' && b.width > 0 && b.height > 0 && !/^(0px|auto)$/.test('x') && !k.matches('.slate-sr-only'); });
          for (var i = 0; i < kids.length; i++) for (var j = i + 1; j < kids.length; j++) {
            var a = kids[i].getBoundingClientRect(), b2 = kids[j].getBoundingClientRect();
            var ox = Math.min(a.right, b2.right) - Math.max(a.left, b2.left), oy = Math.min(a.bottom, b2.bottom) - Math.max(a.top, b2.top);
            if (ox > 3 && oy > 3) add(name, 'siblings-overlap', el, Math.round(ox) + 'x' + Math.round(oy));
          }
        }
      });
    });
    // page chrome (header, nav, footer) is audited too: anything that should be one line must be
    document.querySelectorAll('.site-header *, .site-footer *, .site-docs__nav a, .site-hero *').forEach(function (el) {
      if (!el.matches(NO_WRAP + ',.slate-navbar__link,.site-docs__nav a,.site-facts dt,.site-facts dd')) return;
      var cs = getComputedStyle(el), r = el.getBoundingClientRect(); if (!r.width || cs.display === 'none') return;
      if (lines(el) > 1) add('page-chrome', 'wraps', el, lines(el) + ' lines: ' + el.textContent.trim().slice(0, 24));
    });
    var hdr = document.querySelector('.site-header__inner'); if (hdr && hdr.scrollWidth > hdr.clientWidth + 2) add('page-chrome', 'header-overflows', hdr, hdr.scrollWidth + '>' + hdr.clientWidth);
    var out = document.createElement('pre'); out.id = 'audit-result'; out.textContent = JSON.stringify({ w: innerWidth, theme: document.documentElement.getAttribute('data-theme'), docOverflow: document.documentElement.scrollWidth > innerWidth + 1, issues: issues }); document.body.appendChild(out);
  }
  window.addEventListener('load', function () { setTimeout(run, 400); });
})();
