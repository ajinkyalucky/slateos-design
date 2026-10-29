// Builds public/native/index.html: every SlateOS Native component with its full source, ready to copy.
// Copied files import only from the package core, so a component can be pasted into an app and owned.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => join(root, ...s);
const PKG = '@ajinkyabhagwat/slateos-native';
const lib = p('native/lib/src/components');
const pkg = JSON.parse(readFileSync(p('native/lib/package.json'), 'utf8'));
if (!existsSync(p('public'))) throw new Error('Run scripts/build.mjs first: public/ is missing.');

const GROUPS = [
  ['general', 'General', 'Buttons, badges, avatars, cards and chips.'],
  ['forms', 'Forms', 'Touch-first inputs: fields, toggles, sliders, steppers and one-time codes.'],
  ['feedback', 'Feedback', 'Alerts, toasts, progress and loading states.'],
  ['navigation', 'Navigation', 'Lists, swipe actions, tabs, tab bars and headers.'],
  ['overlays', 'Overlays', 'Sheets, dialogs, menus and pickers, rendered through the provider’s portal.'],
  ['data', 'Data', 'Stats, charts you can scrub, carousels, timelines and tables.'],
];

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Every relative import becomes the package, so the copy has one dependency.
const rewrite = (src) =>
  src.replace(/from '(\.{1,2}\/[^']+)'/g, `from '${PKG}'`).replace(/require\('(\.{1,2}\/[^']+)'\)/g, `require('${PKG}')`);

// Exported components and hooks with the doc comment directly above each (the comment may not contain */).
const exportsOf = (src) =>
  [...src.matchAll(/\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*export (?:const|function) (\w+)/g)]
    .map(([, doc, name]) => ({ name, doc: doc.replace(/\n\s*\*\s?/g, ' ').replace(/\s+/g, ' ').trim() }))
    .filter((e) => /^[A-Z]|^use|^toast$/.test(e.name));
const exportNames = (src) => [...new Set([...src.matchAll(/export (?:const|function) ([A-Z]\w*|use\w+|toast)\b/g)].map((m) => m[1]))];

// Showcase pages (name, description, demos with their copyable code), read from the Expo app's demo files.
const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
const str = (chunk, key) => {
  const m = new RegExp(`${key}:\\s*(['"])((?:\\\\.|(?!\\1)[^\\\\])*)\\1`).exec(chunk);
  return m ? m[2].replace(/\\(['"\\])/g, '$1') : '';
};
const pagesOf = (dir) => {
  const f = p('native/example/src/demos', `${dir}.tsx`);
  if (!existsSync(f)) return [];
  const text = readFileSync(f, 'utf8');
  const starts = [...text.matchAll(/\bslug:\s*'/g)].map((m) => m.index);
  return starts.map((at, i) => {
    const chunk = text.slice(at, starts[i + 1] ?? text.length);
    const titles = [...chunk.matchAll(/\btitle:\s*'((?:\\.|[^'\\])*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
    const codes = [...chunk.matchAll(/\bcode:\s*`((?:\\.|[^`\\])*)`/g)].map((m) => m[1].replace(/\\`/g, '`').replace(/\\\$\{/g, '${').replace(/\\\\/g, '\\'));
    return { slug: str(chunk, 'slug'), name: str(chunk, 'name'), description: str(chunk, 'description'), demos: codes.map((code, j) => ({ title: titles[j] ?? '', code })) };
  });
};

const copyBtn = (target, label, cls = '') =>
  `<button class="slate-button slate-button--ghost slate-button--icon slate-button--xs ${cls}" data-slate-copy="#${target}" aria-label="${esc(label)}" data-tooltip="Copy"><svg class="slate-icon slate-icon--sm"><use href="#slate-icon-copy"/></svg></button>`;

let total = 0;
const sections = [], nav = [], jump = [];
for (const [dir, title, blurb] of GROUPS) {
  const folder = join(lib, dir);
  if (!existsSync(folder)) continue;
  // Components are PascalCase files; lowercase ones (tone, shared, chart) are helpers the package exports.
  const files = readdirSync(folder).filter((f) => /^[A-Z]\w*\.tsx?$/.test(f)).sort();
  const pages = pagesOf(dir);
  const items = [];
  for (const f of files) {
    const src = readFileSync(join(folder, f), 'utf8');
    const ex = exportsOf(src);
    if (!ex.length) continue;
    const name = f.replace(/\.tsx?$/, '');
    const id = `${dir}-${slug(name)}`;
    const names = exportNames(src);
    // A file's showcase pages: the one named after it, plus any named after another of its exports (Dialog → AlertDialog).
    const mine = pages.filter((pg) => norm(pg.slug) === norm(name) || names.some((n) => norm(n) === norm(pg.slug)));
    total += Math.max(1, mine.length);
    const lead = mine.find((pg) => norm(pg.slug) === norm(name)) ?? mine[0];
    const description = lead?.description || ex.find((e) => e.name === name)?.doc || ex[0].doc;
    const usage = mine.flatMap((pg) => pg.demos.slice(0, 1).map((d) => ({ ...d, title: mine.length > 1 ? `${pg.name}: ${d.title}` : d.title })));
    const code = rewrite(src);
    const lines = code.split('\n').length;
    items.push({ name: lead?.name && mine.length === 1 ? lead.name : name, id });
    sections.push(`
      <article class="doc-c native-c" id="${id}">
        <header><h3 class="site-h3">${esc(name)}</h3><p>${esc(description)}</p></header>
        ${usage.map((d, i) => `<div class="slate-codeblock"><div class="slate-codeblock__bar"><span>${esc(d.title)}</span>${copyBtn(`use-${id}-${i}`, `Copy ${d.title}`)}</div><pre id="use-${id}-${i}"><code>${esc(d.code)}</code></pre></div>`).join('')}
        <p class="native-exports">${names.map((n) => `<code>${n}</code>`).join(' ')}</p>
        <div class="native-src">
          <details><summary><span>View source</span><span class="native-src__meta">${esc(f)} · ${lines} lines</span></summary><pre id="src-${id}"><code>${esc(code)}</code></pre></details>
          ${copyBtn(`src-${id}`, `Copy ${f} source`, 'native-src__copy')}
        </div>
      </article>`);
  }
  if (!items.length) continue;
  sections.splice(sections.length - items.length, 0, `<header class="doc-group__head native-group" id="${dir}"><h2 class="slate-h3">${title}</h2><p class="slate-muted slate-text-md">${blurb}</p><p class="native-index">${items.map((i) => `<a class="slate-link slate-link--muted" href="#${i.id}">${esc(i.name)}</a>`).join('')}</p></header>`);
  nav.push(`<div class="doc-nav__group"><div class="doc-nav__label">${title}</div>${items.map((i) => `<a class="slate-nav-item" href="#${i.id}">${esc(i.name)}</a>`).join('')}</div>`);
  jump.push(`<a href="#${dir}">${title}</a>`);
}

const code = (id, file, text) =>
  `<div class="slate-codeblock"><div class="slate-codeblock__bar"><span>${file}</span><button class="slate-button slate-button--ghost slate-button--icon slate-button--xs" data-slate-copy="#${id}" aria-label="Copy" data-tooltip="Copy"><svg class="slate-icon slate-icon--sm"><use href="#slate-icon-copy"/></svg></button></div><pre id="${id}"><code>${esc(text)}</code></pre></div>`;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>SlateOS Native</title>
  <meta name="description" content="SlateOS for React Native and Expo: ${total} touch-first components on the SlateOS tokens. Install the package, or copy any component's source and own it.">
  <script>try { var t = localStorage.getItem('slateos-theme'); if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); var b = localStorage.getItem('slateos-brand'); if (/^(blue|violet|green|orange|rose)$/.test(b)) document.documentElement.setAttribute('data-brand', b); } catch (e) {}</script>
  <link rel="preload" href="../dist/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="../dist/slateos.css">
  <link rel="stylesheet" href="../dist/themes.css">
  <link rel="stylesheet" href="../site.css">
  <style>
    .native-c > header { margin-bottom: var(--slate-space-3); }
    .native-c > header h3 { margin: 0; }
    .native-c > header p { margin: var(--slate-space-1) 0 0; color: var(--slate-text-muted); font-size: var(--slate-font-size-md); max-width: 44rem; }
    .native-c .slate-codeblock { margin-bottom: var(--slate-space-3); }
    .native-c .slate-codeblock__bar span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .native-exports { display: flex; flex-wrap: wrap; gap: var(--slate-space-1_5); margin: 0 0 var(--slate-space-3); }
    .native-exports code { font-size: var(--slate-font-size-xs); padding: 2px var(--slate-space-1_5); border-radius: var(--slate-radius-sm); background: var(--slate-surface-hover); color: var(--slate-text-muted); }
    .native-src { position: relative; border: 1px solid var(--slate-border); border-radius: var(--slate-radius-lg); background: var(--slate-surface); }
    .native-src summary { display: flex; align-items: center; gap: var(--slate-space-2); min-height: 2.75rem; padding: 0 3.25rem 0 var(--slate-space-3); cursor: pointer; list-style: none; font-size: var(--slate-font-size-sm); font-weight: var(--slate-font-weight-medium); }
    .native-src summary::-webkit-details-marker { display: none; }
    .native-src summary::before { content: ''; width: 0.4rem; height: 0.4rem; border: solid var(--slate-text-subtle); border-width: 0 1.5px 1.5px 0; transform: rotate(-45deg); transition: transform var(--slate-motion-duration-fast); margin-right: var(--slate-space-1); }
    .native-src details[open] summary::before { transform: rotate(45deg); }
    .native-src__meta { margin-left: auto; color: var(--slate-text-subtle); font: var(--slate-font-size-xs) var(--slate-font-family-mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .native-src pre { margin: 0; padding: var(--slate-space-3) var(--slate-space-4); border-top: 1px solid var(--slate-border); overflow-x: auto; font-size: var(--slate-font-size-xs); line-height: 1.7; }
    .native-src__copy { position: absolute; top: 0.375rem; right: 0.375rem; }
    .native-index { display: flex; flex-wrap: wrap; gap: var(--slate-space-1) var(--slate-space-3); margin: var(--slate-space-3) 0 0; font-size: var(--slate-font-size-sm); }
    .native-index a { padding-block: var(--slate-space-1); }
    .native-jump { display: none; }
    @media (max-width: 900px) {
      .native-jump { display: flex; gap: var(--slate-space-1_5); position: sticky; top: 3.25rem; z-index: var(--slate-z-sticky); overflow-x: auto; scrollbar-width: none; padding: var(--slate-space-2) 1rem; margin: 0; border-bottom: 1px solid var(--slate-border); background: color-mix(in srgb, var(--slate-bg) 88%, transparent); backdrop-filter: saturate(1.5) blur(12px); }
      .native-jump::-webkit-scrollbar { display: none; }
      .native-jump a { flex: none; display: inline-flex; align-items: center; min-height: 2.25rem; padding: 0 var(--slate-space-3); border: 1px solid var(--slate-border); border-radius: var(--slate-radius-full); color: var(--slate-text); font-size: var(--slate-font-size-sm); text-decoration: none; background: var(--slate-surface-raised); }
      .native-c, .native-group { scroll-margin-top: 6.75rem; }
      .native-index a { padding-block: var(--slate-space-2); }
    }
    @media (pointer: coarse) {
      .native-c .slate-codeblock__bar .slate-button, .site-section .slate-codeblock__bar .slate-button, .native-src__copy { min-width: 2.25rem; min-height: 2.25rem; }
      .native-src__copy { top: 0.25rem; right: 0.25rem; }
    }
  </style>
</head>
<body>
<header class="site-header">
  <div class="site-header__inner">
    <a class="slate-navbar__brand" href="../"><span class="slate-logo slate-logo--sm">S</span>SlateOS<span class="slate-badge slate-badge--neutral slate-badge--square">Native ${pkg.version}</span></a>
    <nav class="slate-navbar__links site-header__links" aria-label="Primary">
      <a class="slate-navbar__link" href="../">Web</a>
      <a class="slate-navbar__link" aria-current="page" href="./">Native</a>
    </nav>
    <span class="slate-spacer"></span>
    <a class="slate-button slate-button--ghost slate-button--icon slate-button--sm" href="https://github.com/ajinkyalucky/slateos-design/tree/main/native" aria-label="GitHub"><svg class="slate-icon"><use href="#slate-icon-github"/></svg></a>
    <button class="slate-button slate-button--ghost slate-button--icon slate-button--sm" data-slate-theme-toggle aria-label="Toggle theme"><svg class="slate-icon site-sun"><use href="#slate-icon-sun"/></svg><svg class="slate-icon site-moon"><use href="#slate-icon-moon"/></svg></button>
  </div>
</header>
<main>
  <nav class="native-jump" aria-label="Sections"><a href="#start">Setup</a>${jump.join('')}</nav>
  <section class="site-section" id="start">
    <div class="site-wrap site-wrap--narrow">
      <header class="site-section__head">
        <span class="slate-eyebrow">React Native · Expo</span>
        <h1 class="slate-h1">SlateOS Native</h1>
        <p class="slate-lead">${total} touch-first components on the same tokens as the web: 44pt targets, springs, haptics and gestures, light and dark, five brand colours or your own, tuned for AA contrast. Install the package, or copy any file below and make it yours.</p>
      </header>
      <div class="slate-stack slate-stack--lg">
        <div><h3 class="site-h3 slate-mt-0">1 · Install</h3>${code('n1', 'Terminal', `npx expo install ${PKG} \\\n  react-native-reanimated react-native-worklets \\\n  react-native-gesture-handler react-native-safe-area-context \\\n  react-native-svg expo-haptics @expo-google-fonts/inter`)}</div>
        <div><h3 class="site-h3 slate-mt-0">2 · Wrap the app</h3>${code('n2', 'app/_layout.tsx', `import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SlateProvider, Toaster } from '${PKG}';

export default function Root() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SlateProvider brand="violet" corners="soft">
          <Stack />
          <Toaster />
        </SlateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}`)}</div>
        <div><h3 class="site-h3 slate-mt-0">3 · Use it, or own it</h3><p class="slate-muted slate-text-md slate-mb-3">Import from the package, or copy a component's source from below into your app. Copied files depend only on the package core (theme, tokens, Text, Icon, Touchable), so you can change anything.</p>${code('n3', 'Screen.tsx', `import { Button, Sheet, useSlate } from '${PKG}';

<Button icon="plus" onPress={() => setOpen(true)}>New invoice</Button>
<Sheet open={open} onOpenChange={setOpen} title="New invoice">…</Sheet>

// any brand colour, tuned per scheme for AA contrast
<SlateProvider brand="#0f9d8a" />`)}</div>
      </div>
    </div>
  </section>
  <section class="site-section" id="components">
    <div class="site-wrap">
      <div class="site-docs">
        <nav class="site-docs__nav" aria-label="Components">${nav.join('')}</nav>
        <div class="site-docs__content">${sections.join('\n')}</div>
      </div>
    </div>
  </section>
</main>
<footer class="site-footer">
  <div class="site-wrap slate-row slate-row--between slate-row--wrap">
    <span class="slate-text-sm slate-muted">SlateOS Native · MIT license · Made by Ajinkya · <a class="slate-link slate-link--muted" href="https://ajinkya.design">ajinkya.design</a></span>
    <span class="slate-text-xs slate-subtle">Inter, SIL OFL.</span>
  </div>
</footer>
<script src="../dist/icons.js"></script>
<script src="../dist/slateos.js"></script>
</body>
</html>
`;

mkdirSync(p('public/native'), { recursive: true });
writeFileSync(p('public/native/index.html'), html);
console.log(`SlateOS Native docs: ${total} components -> public/native/`);
