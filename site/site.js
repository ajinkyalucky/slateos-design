(function () {
  if (/[?&]audit\b/.test(location.search)) { var a = document.createElement('script'); a.src = 'audit.js'; document.head.appendChild(a); }
  /* ?only=group-forms renders a single component group (handy for reviews and screenshots) */
  var only = /[?&]only=([\w-]+)/.exec(location.search);
  if (only) { var st = document.createElement('style'); st.textContent = '.site-hero,#foundations,#start,.site-docs__nav{display:none!important}.site-docs{display:block}.doc-group:not(#' + only[1] + '){display:none}'; document.head.appendChild(st); var sk = /[?&]skip=(\d+)/.exec(location.search); if (sk) { var s2 = document.createElement('style'); s2.textContent = '.doc-group > article:nth-of-type(-n+' + sk[1] + '){display:none}'; document.head.appendChild(s2); } }
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement, cs = function () { return getComputedStyle(root); };
  var v = function (n) { return cs().getPropertyValue(n).trim(); };
  var svg = function (n, c) { return '<svg class="slate-icon ' + (c || '') + '"><use href="#slate-icon-' + n + '"/></svg>'; };

  /* ---- Colour ramps + semantic swatches (re-rendered on theme change) ---- */
  var ramps = [['Gray', 'gray', ['0','25','50','100','150','200','300','400','500','600','700','800','850','900','950']],
               ['Accent', 'accent', ['50','100','200','300','400','500','600','700','800','900','950']]];
  var groups = [
    ['Surface', ['bg', 'surface', 'surface-raised', 'surface-hover', 'surface-active']],
    ['Border', ['border-subtle', 'border', 'border-strong', 'focus-ring']],
    ['Text', ['text', 'text-muted', 'text-subtle', 'text-disabled', 'inverse']],
    ['Accent', ['accent', 'accent-hover', 'accent-solid', 'accent-solid-hover', 'accent-soft', 'accent-border', 'on-accent']],
    ['Success & warning', ['success', 'success-solid', 'success-soft', 'warning', 'warning-solid', 'warning-soft']],
    ['Danger & info', ['danger', 'danger-solid', 'danger-soft', 'info', 'info-solid', 'info-soft']],
    ['Chart', ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6']]
  ];
  var rl = function (hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }).reduce(function (a, c, i) { return a + c * [0.2126, 0.7152, 0.0722][i]; }, 0); };
  var luma = function (hex) { var n = parseInt(hex.slice(1), 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255]; return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; };
  function renderColor() {
    $('#ramps').innerHTML = ramps.map(function (r) {
      return '<div><div class="site-ramp__label">' + r[0] + '</div><div class="site-ramp__strip">' + r[2].map(function (s) {
        var hex = v('--slate-color-' + r[1] + '-' + s); return '<button style="--c:' + hex + ';--t:' + (rl(hex) > 0.18 ? '#121926' : '#fff') + '" data-copy="' + hex + '" title="' + hex + '">' + s + '</button>';
      }).join('') + '</div></div>';
    }).join('');
    $('#swatches').innerHTML = groups.map(function (g) {
      return '<div class="site-swatch-group"><h4>' + g[0] + '</h4>' + g[1].map(function (n) {
        var val = v('--slate-' + n); return '<button class="site-swatch" data-copy="var(--slate-' + n + ')" title="Copy var(--slate-' + n + ')"><span class="site-swatch__chip" style="--c:var(--slate-' + n + ')"></span>' + n + '<code>' + val.toUpperCase() + '</code></button>';
      }).join('') + '</div>';
    }).join('');
  }
  function renderScales() {
    var sizes = [['5xl', '3.75rem'], ['4xl', '2.75rem'], ['3xl', '2rem'], ['2xl', '1.5rem'], ['xl', '1.25rem'], ['lg', '1rem'], ['md', '0.875rem'], ['sm', '0.8125rem'], ['xs', '0.75rem'], ['2xs', '0.6875rem']];
    $('#type-scale').innerHTML = sizes.map(function (s) {
      return '<div class="site-type__row"><code>size-' + s[0] + ' · ' + parseFloat(s[1]) * 16 + 'px</code><div class="site-type__sample" style="font-size:var(--slate-font-size-' + s[0] + ')">Quiet, readable interfaces</div></div>';
    }).join('');
    var sp = ['0_5', '1', '1_5', '2', '2_5', '3', '4', '5', '6', '7', '8', '10', '12'];
    $('#space-scale').innerHTML = sp.map(function (s) { var val = v('--slate-space-' + s); return '<div class="site-space"><span>' + s.replace('_', '.') + '</span><i style="width:' + val + '"></i><span>' + parseFloat(val) * 16 + 'px</span></div>'; }).join('');
    $('#radius-scale').innerHTML = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'].map(function (r) { return '<div><i style="border-radius:var(--slate-radius-' + r + ')"></i>' + r + '</div>'; }).join('');
    $('#shadow-scale').innerHTML = ['xs', 'sm', 'md', 'lg', 'xl'].map(function (s) { return '<div style="box-shadow:var(--slate-shadow-' + s + ')">shadow-' + s + '</div>'; }).join('');
  }
  function renderIcons(q) {
    var syms = $$('symbol[id^="slate-icon-"]').map(function (s) { return s.id.slice(11); });
    $('#icon-grid').innerHTML = syms.filter(function (n) { return !q || n.indexOf(q) > -1; }).map(function (n) { return '<button data-copy=\'' + svg(n).replace(/'/g, '&#39;') + '\' title="Copy SVG markup">' + svg(n) + '<span>' + n + '</span></button>'; }).join('');
  }
  renderColor(); renderScales(); renderIcons();
  document.addEventListener('slate:theme', function () { requestAnimationFrame(renderColor); });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { requestAnimationFrame(renderColor); });
  $('#icon-filter').addEventListener('input', function (e) { renderIcons(e.target.value.toLowerCase()); });

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]'); if (!b) return;
    var txt = b.getAttribute('data-copy').replace(/&#39;/g, "'"); if (navigator.clipboard) navigator.clipboard.writeText(txt);
    window.slate.toast({ title: 'Copied', description: txt.length > 48 ? txt.slice(0, 46) + '…' : txt, tone: 'success', duration: 1800 });
  });

  /* ---- Component nav: filter + scroll spy ---- */
  $('#nav-filter').addEventListener('input', function (e) {
    var q = e.target.value.toLowerCase();
    $$('.doc-nav__group').forEach(function (g) { var any = false; $$('a', g).forEach(function (a) { var m = !q || a.dataset.name.indexOf(q) > -1; a.hidden = !m; any = any || m; }); g.hidden = !any; });
  });
  var links = {}; $$('.site-docs__nav a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { $$('.is-current').forEach(function (x) { x.classList.remove('is-current'); }); var a = links[en.target.id]; if (a) a.classList.add('is-current'); } });
    }, { rootMargin: '-15% 0px -75% 0px' });
    $$('.doc-c').forEach(function (c) { io.observe(c); });
  }

  /* ---- ⌘K component search (built with the SlateOS command palette) ---- */
  var idx = JSON.parse($('#doc-index').textContent), dlg = $('#doc-search'), inp = $('#doc-search-input'), list = $('#doc-search-list');
  function renderSearch(q) {
    var m = idx.filter(function (c) { return !q || (c.n + ' ' + c.g + ' ' + c.d).toLowerCase().indexOf(q) > -1; }).slice(0, 12);
    list.innerHTML = m.length ? m.map(function (c, i) { return '<a class="slate-command__item" style="text-decoration:none;color:inherit" href="#' + c.id + '" aria-selected="' + (i === 0) + '">' + svg('layers') + c.n + '<span class="slate-spacer"></span><span class="slate-text-xs slate-subtle">' + c.g + '</span></a>'; }).join('') : '<div class="slate-empty" style="padding:2rem"><div class="slate-empty__desc">No components match “' + q + '”.</div></div>';
  }
  dlg.addEventListener('close', function () { inp.value = ''; });
  new MutationObserver(function () { if (dlg.open) { renderSearch(''); setTimeout(function () { inp.focus(); }, 30); } }).observe(dlg, { attributes: true, attributeFilter: ['open'] });
  inp.addEventListener('input', function () { renderSearch(inp.value.toLowerCase()); });
  inp.addEventListener('keydown', function (e) {
    var items = $$('.slate-command__item', list); if (!items.length) return; var cur = items.findIndex(function (i) { return i.getAttribute('aria-selected') === 'true'; });
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var n = (cur + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach(function (i, j) { i.setAttribute('aria-selected', String(j === n)); }); items[n].scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'Enter' && items[cur]) { dlg.close(); location.hash = items[cur].getAttribute('href'); }
  });
  list.addEventListener('click', function () { dlg.close(); });
  document.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : dlg.showModal(); } });
})();
