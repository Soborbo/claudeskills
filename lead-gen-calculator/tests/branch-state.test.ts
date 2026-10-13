import { describe, expect, it } from 'vitest';
import { type BranchSpec, collectFromBranches, pruneToActiveBranches } from '../src/branch-state';

type B = 'roof' | 'fence' | 'fenceSimple' | 'fenceSides';
const spec: BranchSpec<B> = {
  activeBranches: (a) => {
    const out: B[] = [];
    if (a.usage === 'teto' || a.usage === 'teto_es_oldalfal') out.push('roof');
    if (a.usage === 'kerites' || a.usage === 'teto_es_oldalfal') {
      out.push('fence');
      out.push(a.fence_mode === 'sides' ? 'fenceSides' : 'fenceSimple');
    }
    return out;
  },
  owns: {
    roof: ['roof_*'],
    fence: ['fence_mode'],
    fenceSimple: ['fence_length', 'fence_height'],
    fenceSides: ['fence_side_*'],
  },
};

describe('collectFromBranches (invariant B — additive)', () => {
  const contribute = {
    roof: (a: Record<string, unknown>) => (a.roof_1_a ? [`roof ${a.roof_1_a}`] : []),
    fence: () => [],
    fenceSimple: (a: Record<string, unknown>) => (a.fence_length ? [`fence ${a.fence_length}`] : []),
    fenceSides: (a: Record<string, unknown>) => Object.keys(a).filter((k) => k.startsWith('fence_side_')).map((k) => `side ${a[k]}`),
  };

  it('regression trapezlemezes: roof + wall keeps BOTH parts', () => {
    const items = collectFromBranches({ usage: 'teto_es_oldalfal', roof_1_a: 500, fence_length: 2000, fence_height: 200 }, spec, contribute);
    expect(items).toEqual(['roof 500', 'fence 2000']);
  });

  it('regression trapezlemezes: fence mode "sides" ignores hidden simple-mode values', () => {
    const items = collectFromBranches(
      { usage: 'kerites', fence_mode: 'sides', fence_length: 9999, fence_side_1: 400, fence_side_2: 300 },
      spec,
      contribute,
    );
    expect(items).toEqual(['side 400', 'side 300']);
  });
});

describe('pruneToActiveBranches (invariant C — no stale keys)', () => {
  it('drops keys of a deselected branch, keeps shared keys', () => {
    const out = pruneToActiveBranches({ usage: 'kerites', roof_1_a: 500, fence_length: 10, email: 'a@b.hu' }, spec);
    expect(out).toEqual({ usage: 'kerites', fence_length: 10, email: 'a@b.hu' });
  });

  it('keeps a key owned by several branches while any owner is active', () => {
    const s: BranchSpec<'a' | 'b'> = { activeBranches: () => ['b'], owns: { a: ['shared'], b: ['shared'] } };
    expect(pruneToActiveBranches({ shared: 1 }, s)).toEqual({ shared: 1 });
  });

  it('regression olcsokontenerhaz: WC product drops the bathroom add-on', () => {
    const s: BranchSpec<'container' | 'wc'> = {
      activeBranches: (a) => [String(a.product).startsWith('wc') ? 'wc' : 'container'],
      owns: { container: ['bathroomExtra', 'bathroomExtraPrice', 'color'], wc: [] },
    };
    const out = pruneToActiveBranches({ product: 'wc', bathroomExtra: 'wc', bathroomExtraPrice: 378900, qty: 1 }, s);
    expect(out).toEqual({ product: 'wc', qty: 1 });
  });
});
