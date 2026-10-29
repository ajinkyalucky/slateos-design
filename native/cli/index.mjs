#!/usr/bin/env node
// slateos-native: copy SlateOS Native components into a React Native / Expo app, shadcn-style.
// The code lands in your project (default components/slate/) and is yours to change.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const VERSION = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'package.json'), 'utf8')).version;
const DEFAULT_REGISTRY = 'https://slateos.ajinkya.design/native/r';
const CONFIG = 'slateos.json';
const GROUPS = ['general', 'forms', 'feedback', 'navigation', 'overlays', 'data'];

// --- output ------------------------------------------------------------------------
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = paint(1), dim = paint(2), green = paint(32), yellow = paint(33), red = paint(31);
const log = (...a) => console.log(...a);
const fail = (msg) => { console.error(red('✗ ') + msg); process.exit(1); };

// --- args ----------------------------------------------------------------------------
const argv = process.argv.slice(2);
const flags = { yes: false, overwrite: false, install: true };
const rest = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '-y' || a === '--yes') flags.yes = true;
  else if (a === '-o' || a === '--overwrite') flags.overwrite = true;
  else if (a === '--no-install') flags.install = false;
  else if (a === '--dir' || a === '--registry' || a === '--cwd') flags[a.slice(2)] = argv[++i];
  else if (a.startsWith('--dir=') || a.startsWith('--registry=') || a.startsWith('--cwd=')) { const [k, v] = a.slice(2).split('='); flags[k] = v; }
  else if (a === '-h' || a === '--help') flags.help = true;
  else if (a === '-v' || a === '--version') flags.version = true;
  else rest.push(a);
}
const [command, ...names] = rest;
const cwd = resolve(flags.cwd ?? process.cwd());
const interactive = process.stdin.isTTY && !flags.yes;

async function ask(question, fallback) {
  if (!interactive) return fallback;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(question)).trim();
  rl.close();
  return answer || fallback;
}
const confirm = async (q) => /^y/i.test(await ask(`${q} ${dim('(y/N)')} `, 'n'));

// --- project -------------------------------------------------------------------------
function readJson(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}
function project() {
  const pkg = readJson(join(cwd, 'package.json'));
  if (!pkg) fail(`No package.json in ${cwd}. Run this in your app's folder.`);
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return { pkg, deps, expo: 'expo' in deps };
}
function loadConfig() {
  const cfg = readJson(join(cwd, CONFIG));
  if (!cfg) fail(`No ${CONFIG} here. Run ${bold('npx slateos-native init')} first.`);
  return cfg;
}

// --- registry ------------------------------------------------------------------------
async function fetchJson(registry, name) {
  if (/^https?:\/\//.test(registry)) {
    const res = await fetch(`${registry.replace(/\/$/, '')}/${name}.json`).catch((e) => fail(`Could not reach ${registry}: ${e.message}`));
    if (res.status === 404) return null;
    if (!res.ok) fail(`${registry}/${name}.json returned ${res.status}.`);
    return res.json();
  }
  const file = resolve(cwd, registry, `${name}.json`);
  return existsSync(file) ? readJson(file) : null;
}

function suggest(index, name) {
  const all = [...index.items.filter((i) => i.type === 'registry:ui' || i.type === 'registry:block').map((i) => i.name), ...Object.keys(index.aliases)];
  const score = (a) => { let s = 0; for (const ch of new Set(name)) if (a.includes(ch)) s++; return s - Math.abs(a.length - name.length) / 2; };
  return all.filter((a) => a.includes(name) || name.includes(a)).concat(all.sort((a, b) => score(b) - score(a))).filter((v, i, x) => x.indexOf(v) === i).slice(0, 3);
}

async function resolveItems(index, registry, wanted) {
  const byName = Object.fromEntries(index.items.map((i) => [i.name, i]));
  const order = [], seen = new Set();
  const visit = (name) => {
    const real = byName[name] ? name : index.aliases[name];
    if (!real) fail(`Unknown component "${name}". Did you mean ${suggest(index, name).map((s) => bold(s)).join(', ')}? See ${bold('npx slateos-native list')}.`);
    if (seen.has(real)) return;
    seen.add(real);
    byName[real].registryDependencies.forEach(visit);
    order.push(real);
  };
  wanted.forEach((n) => visit(n.toLowerCase()));
  return Promise.all(order.map(async (n) => (await fetchJson(registry, n)) ?? fail(`Registry is missing ${n}.json.`)));
}

// --- install -------------------------------------------------------------------------
function packageManager() {
  if (existsSync(join(cwd, 'bun.lock')) || existsSync(join(cwd, 'bun.lockb'))) return 'bun';
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  return 'npm';
}
function install(packages, expo) {
  if (!packages.length) return true;
  const pm = packageManager();
  const [bin, args] = expo
    ? [pm === 'bun' ? 'bunx' : 'npx', ['expo', 'install', ...packages]]
    : [pm, [pm === 'npm' ? 'install' : 'add', ...packages]];
  log(dim(`\n$ ${bin} ${args.join(' ')}`));
  const r = spawnSync(bin, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  return r.status === 0;
}

// --- barrel --------------------------------------------------------------------------
// index.ts re-exports the core and every installed component, so the app imports from one place.
function writeBarrel(dir, index) {
  const files = [];
  const walk = (d) => {
    if (!existsSync(join(dir, d))) return;
    for (const e of readdirSync(join(dir, d), { withFileTypes: true })) {
      const rel = d ? `${d}/${e.name}` : e.name;
      if (e.isDirectory()) walk(rel); else if (/\.tsx?$/.test(e.name)) files.push(rel);
    }
  };
  walk('components');
  const known = new Set(index.items.flatMap((i) => i.files));
  const rank = (f) => GROUPS.indexOf(f.split('/')[1]);
  const lines = files.filter((f) => known.has(f)).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((f) => `export * from './${f.replace(/\.tsx?$/, '')}';`);
  writeFileSync(join(dir, 'index.ts'), [
    '// Generated by slateos-native: the core plus every component in this folder.',
    '// `npx slateos-native add` rewrites it; the components themselves are yours to edit.',
    '', ...index.barrel.core, '', ...lines, '',
  ].join('\n'));
}

// --- commands ------------------------------------------------------------------------
async function add(wanted, { config, quietIntro } = {}) {
  const cfg = config ?? loadConfig();
  const registry = flags.registry ?? cfg.registry ?? DEFAULT_REGISTRY;
  const { deps, expo } = project();
  const index = (await fetchJson(registry, 'registry')) ?? fail(`No registry.json at ${registry}.`);
  const items = await resolveItems(index, registry, wanted);
  const dir = resolve(cwd, cfg.dir);

  if (!quietIntro) log(`\n${bold('slateos-native')} ${dim(VERSION)}  ${dim('→')} ${relative(cwd, dir) || '.'}`);
  const written = [], same = [], kept = [];
  for (const item of items) {
    for (const file of item.files) {
      const target = join(dir, ...file.path.split('/'));
      if (existsSync(target)) {
        const current = readFileSync(target, 'utf8');
        if (current === file.content) { same.push(file.path); continue; }
        const replace = flags.overwrite || (await confirm(`${yellow('!')} ${file.path} differs from the registry (your edits?). Overwrite?`));
        if (!replace) { kept.push(file.path); continue; }
      }
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.content);
      written.push(file.path);
    }
  }
  writeBarrel(dir, index);

  const changed = new Set(written);
  const added = items.filter((i) => (i.type === 'registry:ui' || i.type === 'registry:block') && i.files.some((f) => changed.has(f.path))).map((i) => i.name);
  const current = wanted.filter((w) => !added.includes(w) && w !== 'core');
  for (const f of written) log(`${green('+')} ${f}`);
  if (kept.length) log(`${yellow('•')} kept your version of ${kept.join(', ')} ${dim('(pass --overwrite to replace)')}`);
  if (current.length && !kept.length) log(dim(`  Up to date: ${current.join(', ')}`));

  const needed = [...new Set(items.flatMap((i) => i.dependencies))].filter((d) => !(d in deps));
  if (needed.length && flags.install && !install(needed, expo)) {
    log(yellow(`\nInstall failed. Run it yourself: ${expo ? 'npx expo install' : packageManager() + ' install'} ${needed.join(' ')}`));
  } else if (needed.length && !flags.install) {
    log(yellow(`\nSkipped installing: ${needed.join(' ')}`));
  }
  if (added.length) log(`\n${green('✓')} ${added.length === 1 ? 'Added' : `Added ${added.length}:`} ${added.map(bold).join(', ')}`);
  return { dir, index };
}

function importPath(dir) {
  const tsconfig = readJson(join(cwd, 'tsconfig.json'));
  const alias = tsconfig?.compilerOptions?.paths?.['@/*']?.[0];
  if (alias) {
    const base = resolve(cwd, alias.replace(/\*$/, ''));
    if (dir.startsWith(base)) return '@/' + relative(base, dir).split(sep).join('/');
  }
  const layout = ['app/_layout.tsx', 'src/app/_layout.tsx'].find((f) => existsSync(join(cwd, f)));
  const from = layout ? dirname(join(cwd, layout)) : cwd;
  const rel = relative(from, dir).split(sep).join('/');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

async function init() {
  const { expo } = project();
  if (!expo) log(yellow('! No expo dependency found. SlateOS Native targets Expo; bare React Native works if Reanimated 4 and Gesture Handler 3 are set up.'));
  const existing = readJson(join(cwd, CONFIG));
  const fallback = existing?.dir ?? (existsSync(join(cwd, 'src')) ? 'src/components/slate' : 'components/slate');
  const dirAnswer = flags.dir ?? (await ask(`Where should components go? ${dim(`(${fallback})`)} `, fallback));
  const config = { dir: dirAnswer };
  if (flags.registry) config.registry = flags.registry;
  writeFileSync(join(cwd, CONFIG), JSON.stringify(config, null, 2) + '\n');
  log(`${green('+')} ${CONFIG}`);

  const { dir } = await add(['core', ...names], { config, quietIntro: false });
  const from = importPath(dir);
  const layout = ['app/_layout.tsx', 'src/app/_layout.tsx'].find((f) => existsSync(join(cwd, f))) ?? 'your root component';
  log(`
${bold('Next: wrap the app')} in ${bold(layout)}

  import { GestureHandlerRootView } from 'react-native-gesture-handler';
  import { SafeAreaProvider } from 'react-native-safe-area-context';
  import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
  import { SlateProvider } from '${from}';

  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SlateProvider>{/* your navigator */}</SlateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

Then add components: ${bold('npx slateos-native add button sheet toast')}
`);
}

async function list() {
  const cfg = readJson(join(cwd, CONFIG));
  const registry = flags.registry ?? cfg?.registry ?? DEFAULT_REGISTRY;
  const index = (await fetchJson(registry, 'registry')) ?? fail(`No registry.json at ${registry}.`);
  const dir = cfg ? resolve(cwd, cfg.dir) : null;
  // Blocks are whole screens; they land in <dir>/blocks/ and import from the folder's index.
  for (const g of [...GROUPS, 'blocks']) {
    const items = index.items.filter((i) => i.group === g && (i.type === 'registry:ui' || i.type === 'registry:block'));
    if (!items.length) continue;
    log(`\n${bold(g[0].toUpperCase() + g.slice(1))}`);
    for (const i of items) {
      const have = dir && i.files.every((f) => existsSync(join(dir, f)));
      const desc = i.description.length > 64 ? i.description.slice(0, 63) + '…' : i.description;
      log(`  ${have ? green('●') : dim('○')} ${i.name.padEnd(18)} ${dim(desc)}`);
    }
  }
  const blocks = index.items.filter((i) => i.type === 'registry:block').length;
  log(dim(`\n${index.items.filter((i) => i.type === 'registry:ui').length} components${blocks ? ` · ${blocks} blocks` : ''} · ${registry}`));
}

const HELP = `${bold('slateos-native')} ${VERSION}: SlateOS components for React Native and Expo, copied into your app.

${bold('Usage')}
  npx slateos-native init [components...]   set up slateos.json, the theme and primitives
  npx slateos-native add <components...>    copy components and what they need, install packages
  npx slateos-native list                   every component (● = in this app)

${bold('Options')}
  --dir <path>        where components go (init; default components/slate)
  --registry <url>    another registry URL or a local folder
  -o, --overwrite     replace files you changed
  -y, --yes           no questions (keeps your changed files unless --overwrite)
  --no-install        copy files only
  --cwd <path>        run in another folder

Docs: https://slateos.ajinkya.design/native/`;

if (flags.version) log(VERSION);
else if (flags.help || !command) log(HELP);
else if (command === 'init') await init();
else if (command === 'add') { if (!names.length) fail('Name at least one component, e.g. npx slateos-native add button'); await add(names); }
else if (command === 'list' || command === 'ls') await list();
else fail(`Unknown command "${command}".\n\n${HELP}`);
