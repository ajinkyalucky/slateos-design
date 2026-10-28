(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  function current() {
    return root.getAttribute('data-theme') || (mq.matches ? 'dark' : 'light');
  }

  function label() {
    btn.textContent = current() === 'dark' ? 'Light mode' : 'Dark mode';
  }

  btn.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('slateos-theme', next); } catch (e) {}
    label();
    renderSwatches();
  });

  mq.addEventListener('change', function () { label(); renderSwatches(); });

  var names = [
    'bg', 'surface', 'surface-raised', 'border', 'border-strong',
    'text', 'text-muted', 'text-subtle',
    'accent', 'accent-hover', 'accent-soft', 'on-accent',
    'success', 'success-soft', 'danger', 'danger-soft'
  ];

  function renderSwatches() {
    var host = document.getElementById('swatches');
    var cs = getComputedStyle(root);
    host.textContent = '';
    names.forEach(function (n) {
      var v = '--slate-' + n;
      var el = document.createElement('div');
      el.className = 'swatch';
      var chip = document.createElement('div');
      chip.className = 'swatch__chip';
      chip.style.background = 'var(' + v + ')';
      var meta = document.createElement('div');
      meta.className = 'swatch__meta';
      var name = document.createElement('strong');
      name.textContent = n;
      var code = document.createElement('code');
      code.textContent = v + ' ' + cs.getPropertyValue(v).trim();
      meta.appendChild(name);
      meta.appendChild(code);
      el.appendChild(chip);
      el.appendChild(meta);
      host.appendChild(el);
    });
  }

  label();
  renderSwatches();
})();
