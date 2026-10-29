// Adds the SlateOS Native blocks (whole screens, native/lib/blocks/) to the registry that
// build-native-registry.mjs writes, so `npx slateos-native add sign-in` copies a screen and everything it uses.
// Run after build-native-registry.mjs: that script clears public/native/r/.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => join(root, ...s);
const PKG = '@ajinkyabhagwat/slateos-native';
const out = p('public/native/r');
if (!existsSync(join(out, 'registry.json'))) throw new Error('Run scripts/build-native-registry.mjs first: public/native/r/registry.json is missing.');

const index = JSON.parse(readFileSync(join(out, 'registry.json'), 'utf8'));
const { blocks } = JSON.parse(readFileSync(p('native/lib/blocks/blocks.json'), 'utf8'));
const version = JSON.parse(readFileSync(p('native/lib/package.json'), 'utf8')).version;

// Which registry item exports each name: every export in lib/src belongs to the item that owns its file (else core).
const src = p('native/lib/src');
const owner = Object.fromEntries(index.items.flatMap((i) => i.files.map((f) => [f, i.name])));
const exportedBy = { tokens: 'core' };
const walk = (dir) => {
  for (const e of readdirSync(join(src, dir), { withFileTypes: true })) {
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) { walk(rel); continue; }
    if (!/\.tsx?$/.test(e.name) || e.name === 'index.ts') continue;
    const text = readFileSync(join(src, rel), 'utf8');
    for (const m of text.matchAll(/export (?:declare )?(?:const|function|type|interface|class|enum) ([A-Za-z_]\w*)/g)) exportedBy[m[1]] ??= owner[rel] ?? 'core';
    for (const m of text.matchAll(/export (?:type )?\{([^}]*)\}/g)) for (const n of m[1].split(',')) {
      const name = n.trim().split(/\s+as\s+/).pop()?.replace(/^type\s+/, '');
      if (name) exportedBy[name] ??= owner[rel] ?? 'core';
    }
  }
};
walk('');

const items = blocks.map((b) => {
  const file = `${b.name}.tsx`;
  const text = readFileSync(p('native/lib/blocks', file), 'utf8');
  const kitImport = new RegExp(`import \\{([^}]*)\\} from '${PKG.replace('/', '\\/')}';`);
  const m = kitImport.exec(text);
  if (!m) throw new Error(`native/lib/blocks/${file} must import the kit from '${PKG}'.`);
  const names = m[1].split(',').map((n) => n.trim().replace(/^type\s+/, '')).filter(Boolean);
  const unknown = names.filter((n) => !exportedBy[n]);
  if (unknown.length) throw new Error(`native/lib/blocks/${file}: no registry item exports ${unknown.join(', ')}.`);
  const deps = new Set(names.map((n) => exportedBy[n]));
  deps.add('core');
  const npm = [...new Set([...text.matchAll(/from '([^.'][^']*)'/g)].map((x) => x[1]).filter((s) => s !== PKG)
    .map((s) => (s.startsWith('@') ? s.split('/').slice(0, 2).join('/') : s.split('/')[0])))]
    .filter((s) => s !== 'react' && s !== 'react-native').sort();
  return {
    name: b.name, type: 'registry:block', title: b.title, group: 'blocks', category: b.category, description: b.description,
    registryDependencies: [...deps].sort((a, c) => (a === 'core' ? -1 : c === 'core' ? 1 : a.localeCompare(c))),
    dependencies: npm,
    usage: `import { ${b.export} } from './blocks/${b.name}';\n\n<${b.export} />`,
    // Copied into <dir>/blocks/, next to the barrel (<dir>/index.ts) that re-exports the kit.
    files: [{ path: `blocks/${file}`, content: text.replace(m[0], `import {${m[1]}} from '..';`) }],
  };
});

for (const it of items) writeFileSync(join(out, `${it.name}.json`), JSON.stringify({ ...it, version }, null, 2) + '\n');
index.items = index.items.filter((i) => i.type !== 'registry:block').concat(
  items.map(({ name, type, title, group, category, description, registryDependencies, dependencies, files }) =>
    ({ name, type, title, group, category, description, registryDependencies, dependencies, files: files.map((f) => f.path) })),
);
writeFileSync(join(out, 'registry.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`SlateOS Native blocks: ${items.length} screens -> public/native/r/`);
