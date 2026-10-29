// Builds the SlateOS Native registry in public/native/r/: one JSON file per item (its source files, npm
// packages and the other items it needs) plus registry.json, the index the CLI reads.
// Files keep the kit's own layout (theme.tsx, primitives/…, components/<group>/…), so the copies' relative
// imports work unchanged in an app.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { norm, pagesOf } from './native-demos.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => join(root, ...s);
const src = p('native/lib/src');
const pkg = JSON.parse(readFileSync(p('native/lib/package.json'), 'utf8'));
const BASE = 'https://slateos.ajinkya.design/native/r';
if (!existsSync(p('public'))) throw new Error('Run scripts/build.mjs first: public/ is missing.');

const GROUPS = ['general', 'forms', 'feedback', 'navigation', 'overlays', 'data'];
const kebab = (t) => t.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();
const read = (rel) => readFileSync(join(src, rel), 'utf8');

// --- import graph -----------------------------------------------------------------
const all = [];
const walk = (dir) => {
  for (const e of readdirSync(join(src, dir), { withFileTypes: true })) {
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) walk(rel);
    else if (/\.tsx?$/.test(e.name) && !/^index\.ts$/.test(e.name)) all.push(rel);
  }
};
walk('');
const resolveRel = (from, spec) => {
  const base = posix.normalize(posix.join(posix.dirname(from), spec));
  return [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find((c) => all.includes(c) || existsSync(join(src, c)));
};
const graph = Object.fromEntries(all.map((f) => {
  const text = read(f);
  const specs = [...text.matchAll(/(?:from|require\()\s*'([^']+)'/g)].map((m) => m[1]);
  const local = specs.filter((s) => s.startsWith('.')).map((s) => resolveRel(f, s)).filter(Boolean);
  // react and react-native come with every app; everything else is a package the item needs.
  const npm = specs.filter((s) => !s.startsWith('.')).map((s) => (s.startsWith('@') ? s.split('/').slice(0, 2).join('/') : s.split('/')[0]))
    .filter((s) => s !== 'react' && s !== 'react-native');
  return [f, { local: [...new Set(local)], npm: [...new Set(npm)] }];
}));
const closure = (files) => {
  const seen = new Set();
  const visit = (f) => { if (seen.has(f)) return; seen.add(f); graph[f].local.forEach(visit); };
  files.forEach(visit);
  return [...seen];
};

// --- items --------------------------------------------------------------------------
// core: the provider, tokens and primitives every component builds on (what `init` installs).
const coreFiles = closure(['theme.tsx', 'primitives/Text.tsx', 'primitives/Icon.tsx', 'primitives/Touchable.tsx', 'primitives/Portal.tsx'])
  .filter((f) => !f.startsWith('components/')).sort();
const owner = {};
coreFiles.forEach((f) => (owner[f] = 'core'));
const items = [{ name: 'core', type: 'registry:core', title: 'Core', group: null, description: 'SlateProvider and theme, tokens, colour helpers, haptics, and the Text, Icon, Touchable and Portal primitives.', files: coreFiles }];

for (const group of GROUPS) {
  const pages = pagesOf(group);
  for (const f of readdirSync(join(src, 'components', group)).filter((x) => /\.tsx?$/.test(x) && !/^index\./.test(x)).sort()) {
    const rel = `components/${group}/${f}`;
    const base = f.replace(/\.tsx?$/, '');
    const helper = /^[a-z]/.test(base);
    const name = helper ? `${group}-${base}` : kebab(base);
    owner[rel] = name;
    if (helper) {
      items.push({ name, type: 'registry:lib', title: `${group}/${base}`, group, description: `Helpers shared by the ${group} components.`, files: [rel] });
      continue;
    }
    const text = read(rel);
    const exportsNamed = [...text.matchAll(/export (?:const|function) ([A-Z]\w*)/g)].map((m) => m[1]);
    const mine = pages.filter((pg) => norm(pg.slug) === norm(base) || exportsNamed.some((n) => norm(n) === norm(pg.slug)));
    const lead = mine.find((pg) => norm(pg.slug) === norm(base)) ?? mine[0];
    const doc = /\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*export (?:const|function) [A-Z]/.exec(text)?.[1].replace(/\s*\*\s?/g, ' ').trim();
    items.push({
      name, type: 'registry:ui', title: lead?.name && mine.length === 1 ? lead.name : base, group,
      description: lead?.description || doc || '', exports: [...new Set(exportsNamed)],
      example: lead?.demos[0]?.code, files: [rel],
    });
  }
}

for (const item of items) {
  const deps = new Set(), npm = new Set();
  for (const f of item.files) {
    graph[f].npm.forEach((n) => npm.add(n));
    for (const l of graph[f].local) if (owner[l] !== item.name) deps.add(owner[l] ?? 'core');
  }
  // init also sets up the app root (gesture root, safe area, fonts), so core brings those packages too.
  if (item.name === 'core') ['react-native-gesture-handler', 'react-native-safe-area-context', 'react-native-worklets', 'expo-font', '@expo-google-fonts/inter'].forEach((n) => npm.add(n));
  item.dependencies = [...npm].sort();
  item.registryDependencies = [...deps].sort((a, b) => (a === 'core' ? -1 : b === 'core' ? 1 : a.localeCompare(b)));
}

// Other names people will type: every exported component, e.g. `add alert-dialog` → dialog, `add tooltip` → popover.
const aliases = {};
for (const it of items.filter((i) => i.type === 'registry:ui')) {
  for (const e of it.exports) if (kebab(e) !== it.name && !items.some((i) => i.name === kebab(e))) aliases[kebab(e)] = it.name;
}

// The barrel the CLI writes into the app: the package's own core exports, then one line per installed file.
const barrelCore = read('index.ts').split('\n').filter((l) => /^export /.test(l) && !l.includes('./components/'));

// --- write --------------------------------------------------------------------------
const out = p('public/native/r');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const it of items) {
  const { files, exports: _e, ...meta } = it;
  writeFileSync(join(out, `${it.name}.json`), JSON.stringify({
    ...meta, version: pkg.version,
    files: files.map((f) => ({ path: f, content: read(f) })),
  }, null, 2) + '\n');
}
writeFileSync(join(out, 'registry.json'), JSON.stringify({
  name: 'slateos-native', version: pkg.version, homepage: 'https://slateos.ajinkya.design/native/', base: BASE,
  barrel: { core: barrelCore },
  aliases,
  items: items.map(({ name, type, title, group, description, registryDependencies, dependencies, files }) =>
    ({ name, type, title, group, description, registryDependencies, dependencies, files })),
}, null, 2) + '\n');

const ui = items.filter((i) => i.type === 'registry:ui').length;
console.log(`SlateOS Native registry: core + ${ui} components + ${items.length - ui - 1} helpers, ${Object.keys(aliases).length} aliases -> public/native/r/`);
