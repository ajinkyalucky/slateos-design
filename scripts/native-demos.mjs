// Reads the Expo showcase's demo pages (name, description, demos with their copyable code) so the docs
// and the registry describe components in the same words as the app.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => join(root, ...s);

export const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
const str = (chunk, key) => {
  const m = new RegExp(`${key}:\\s*(['"])((?:\\\\.|(?!\\1)[^\\\\])*)\\1`).exec(chunk);
  return m ? m[2].replace(/\\(['"\\])/g, '$1') : '';
};
export const pagesOf = (dir) => {
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
