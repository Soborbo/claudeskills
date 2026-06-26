import { describe, it, expect } from 'vitest';
import * as lib from '../lib/index';

// Guards the component → lib import contract. The .astro components are not bundled by
// the unit tests, so a broken import path (e.g. the old `@/lib/tracking` alias that
// resolved to nothing and broke `astro build`) would otherwise ship green. We load each
// component's source via Vite's import.meta.glob (?raw) and assert:
//   1. no component uses the old undefined `@/lib/tracking` alias, and
//   2. every symbol a component imports from '../lib' is actually exported by lib/index.
const components = (import.meta as unknown as {
  glob: (p: string, o: unknown) => Record<string, string>;
}).glob('../components/*.astro', { query: '?raw', eager: true, import: 'default' });

const libExports = new Set(Object.keys(lib));

function namedLibImports(src: string): string[] {
  const names: string[] = [];
  const re = /import\s*\{([^}]+)\}\s*from\s*'\.\.\/lib'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    for (const n of m[1].split(',').map((s) => s.trim()).filter(Boolean)) names.push(n);
  }
  return names;
}

describe('component → lib import contract', () => {
  for (const [path, src] of Object.entries(components)) {
    const file = path.split('/').pop()!;

    it(`${file} does not use the old undefined @/lib/tracking alias`, () => {
      expect(src.includes('@/lib/tracking')).toBe(false);
    });

    const names = namedLibImports(src);
    if (names.length === 0) continue;

    it(`${file} only imports symbols that ../lib actually exports`, () => {
      for (const name of names) {
        const clean = name.replace(/^type\s+/, ''); // tolerate `type X` specifiers
        expect(libExports.has(clean), `${file}: ../lib has no export '${clean}'`).toBe(true);
      }
    });
  }
});
