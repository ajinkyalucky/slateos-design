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

// Exported components and hooks with their one-line doc comments.
const exportsOf = (src) =>
  [...src.matchAll(/\/\*\*\s*([\s\S]*?)\s*\*\/\s*export (?:const|function) (\w+)/g)]
    .map(([, doc, name]) => ({ name, doc: doc.replace(/\n\s*\*\s?/g, ' ').trim() }))
    .filter((e) => /^[A-Z]|^use|^toast$/.test(e.name));

let total = 0;
const sections = [], nav = [];
for (const [dir, title, blurb] of GROUPS) {
  const folder = join(lib, dir);
  if (!existsSync(folder)) continue;
  const files = readdirSync(folder).filter((f) => /\.tsx?$/.test(f) && !/^index\./.test(f)).sort();
  const items = [];
  for (const f of files) {
    const src = readFileSync(join(folder, f), 'utf8');
    const ex = exportsOf(src);
    if (!ex.length) continue;
    total += 1;
    const name = f.replace(/\.tsx?$/, '');
    const id = `${dir}-${slug(name)}`;
    const code = rewrite(src);
    const lines = code.split('\n').length;
    items.push({ name, id });
    sections.push(`
      <article class="doc-c" id="${id}">
        <h3 class="site-h3">${esc(name)}</h3>
        <dl class="native-exports">${ex.map((e) => `<div><dt><code>${e.name}</code></dt><dd>${esc(e.doc)}</dd></div>`).join('')}</dl>
        <div class="slate-codeblock">
          <div class="slate-codeblock__bar"><span>${esc(f)} · ${lines} lines</span><button class="slate-button slate-button--ghost slate-button--icon slate-button--xs" data-slate-copy="#src-${id}" aria-label="Copy ${esc(f)}" data-tooltip="Copy"><svg class="slate-icon slate-icon--sm"><use href="#slate-icon-copy"/></svg></button></div>
          <pre class="native-src" id="src-${id}"><code>${esc(code)}</code></pre>
        </div>
      </article>`);
  }
  if (!items.length) continue;
  sections.splice(sections.length - items.length, 0, `<header class="doc-group__head" id="${dir}"><h2 class="slate-h3">${title}</h2><p class="slate-muted slate-text-md">${blurb}</p></header>`);
  nav.push(`<div class="doc-nav__group"><div class="doc-nav__label">${title}</div>${items.map((i) => `<a class="slate-nav-item" href="#${i.id}">${esc(i.name)}</a>`).join('')}</div>`);
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
    .native-exports { display: grid; gap: var(--slate-space-2); margin: 0 0 var(--slate-space-3); }
    .native-exports div { display: grid; grid-template-columns: minmax(8rem, max-content) 1fr; gap: var(--slate-space-3); }
    .native-exports dt code { font-size: var(--slate-font-size-sm); }
    .native-exports dd { margin: 0; color: var(--slate-text-muted); font-size: var(--slate-font-size-md); }
    .native-src { max-height: 26rem; overflow: auto; }
    @media (max-width: 40rem) { .native-exports div { grid-template-columns: 1fr; gap: 0; } }
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
  <section class="site-section">
    <div class="site-wrap site-wrap--narrow">
      <header class="site-section__head">
        <span class="slate-eyebrow">React Native · Expo</span>
        <h1 class="slate-h1">SlateOS Native</h1>
        <p class="slate-lead">${total} touch-first components on the same tokens as the web: 44pt targets, springs, haptics and gestures, light and dark, five brand colours or your own, tuned for AA contrast. Install the package, or copy any file below and make it yours.</p>
      </header>
      <div class="slate-stack slate-stack--lg">
        <div><h3 class="site-h3 slate-mt-0">1 · Install</h3>${code('n1', 'Terminal', `npx expo install ${PKG} react-native-reanimated react-native-worklets react-native-gesture-handler react-native-safe-area-context react-native-svg expo-haptics @expo-google-fonts/inter`)}</div>
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
