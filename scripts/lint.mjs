// SlateOS cohesion lint. Components must be built from tokens, not raw values.
// Run by `npm run build` (fails on any violation) or alone: `node scripts/lint.mjs`.
// Escape hatch for a genuine one-off: add `/* lint-allow */` after the declaration.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'src/base.css',
  ...readdirSync(join(root, 'src/components')).filter((f) => f.endsWith('.css')).map((f) => `src/components/${f}`),
];

// Space scale (rem) from tokens; 1px/2px/3px are allowed for hairlines and optical nudges.
const tokens = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'));
const spaceRem = new Set(Object.values(tokens.primitive.space).map((t) => parseFloat(t.$value)));
spaceRem.add(0);
const hairline = new Set([0, 1, 2, 3]);

const LEN = /^-?(\d*\.?\d+)(px|rem)$/;
const toRem = (m) => (m[2] === 'rem' ? parseFloat(m[1]) : parseFloat(m[1]) / 16);
const violations = [];
const add = (rule, file, decl, hint) => violations.push({ rule, file, decl: decl.trim().replace(/\s+/g, ' ').slice(0, 110), hint });

for (const file of files) {
  let css = readFileSync(join(root, file), 'utf8');
  const allow = new Set();
  // mark lines with lint-allow, then strip comments and data URIs
  css = css.replace(/([^;{}]*;)\s*\/\*\s*lint-allow\s*\*\//g, (m, d) => { allow.add(d.trim()); return d; });
  css = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\((["']?)data:[^)]*\1\)/g, 'url(data)');
  // drop @keyframes bodies (animation internals may use raw values)
  css = css.replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  for (const raw of css.split(/[;{}]/)) {
    const m = /^\s*([a-z_-]+)\s*:\s*([\s\S]+)$/.exec(raw);
    if (!m) continue;
    const [, prop, value] = m;
    if (prop.startsWith('--') && !prop.startsWith('--_')) continue;
    if (allow.has(`${prop}: ${value.trim()};`)) continue;
    const decl = `${prop}: ${value}`;

    // R1 raw colours (named black/white/transparent/currentColor are fine)
    if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(value)) add('color', file, decl, 'use a semantic colour token');

    // R2 radius
    if (prop === 'border-radius' || /^border-.*-radius$/.test(prop)) {
      for (const part of value.replace(/var\([^)]*\)|calc\([^)]*\)/g, '').split(/[\s/]+/).filter(Boolean)) {
        const l = LEN.exec(part); if (l && parseFloat(l[1]) !== 0) add('radius', file, decl, 'use var(--slate-radius-*)');
      }
    }

    // R3 spacing on the scale
    if (/^(padding|margin|gap|row-gap|column-gap)(-[a-z]+)?$/.test(prop)) {
      for (const part of value.replace(/var\([^)]*\)|calc\([^)]*\)|color-mix\([^)]*\)/g, '').split(/\s+/).filter(Boolean)) {
        const l = LEN.exec(part); if (!l) continue;
        const px = l[2] === 'px' ? Math.abs(parseFloat(l[1])) : null;
        if (px !== null && hairline.has(px)) continue;
        if (!spaceRem.has(Math.abs(toRem(l)))) add('space', file, decl, 'use var(--slate-space-*)');
      }
    }

    // R4 type sizes
    if (prop === 'font-size' && LEN.test(value.trim()) && !/^0/.test(value.trim())) add('font-size', file, decl, 'use var(--slate-font-size-*)');

    // R5 sizes sit on the 2px grid
    if (/^(min-|max-)?(width|height)$/.test(prop)) {
      for (const part of value.replace(/var\([^)]*\)|calc\([^)]*\)|min\([^)]*\)|max\([^)]*\)|clamp\([^)]*\)/g, '').split(/\s+/).filter(Boolean)) {
        const l = LEN.exec(part); if (!l) continue;
        const px = Math.round(toRem(l) * 16 * 1000) / 1000;
        if (px > 3 && px % 2 !== 0) add('grid', file, decl, 'sizes sit on a 2px grid');
      }
    }

    // R6 stacking
    if (prop === 'z-index' && !/var\(--slate-z-/.test(value) && !/^-?[0-2]$/.test(value.trim())) add('z-index', file, decl, 'use var(--slate-z-*)');
    // R7 transitions use motion tokens
    if (/^transition/.test(prop) && /\b\d*\.?\d+m?s\b/.test(value.replace(/var\([^)]*\)/g, ''))) add('motion', file, decl, 'use var(--slate-motion-duration-*)');
  }
}

const byRule = {};
for (const v of violations) (byRule[v.rule] ||= []).push(v);
if (!violations.length) { console.log('Lint OK: components are built entirely from tokens.'); process.exit(0); }
console.error(`Lint failed: ${violations.length} raw value(s) in components.`);
for (const [rule, list] of Object.entries(byRule)) {
  console.error(`\n[${rule}] ${list.length}  (${list[0].hint})`);
  for (const v of list.slice(0, process.env.LINT_ALL ? 999 : 6)) console.error(`  ${v.file}  ${v.decl}`);
  if (!process.env.LINT_ALL && list.length > 6) console.error(`  … ${list.length - 6} more (LINT_ALL=1 to list)`);
}
process.exit(1);
