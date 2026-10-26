/**
 * Branch-scoped calculator state.
 *
 * Invariant B (additive branches): when the user picks a composite option
 * ("roof AND wall", "packing AND storage"), every active branch contributes.
 * Never `if (sizes.length === 0) { otherBranch() }` — trapezlemezes dropped the
 * wall from "roof + wall" quotes for two years.
 *
 * Invariant C (no stale keys): switching a branch-selecting answer (product,
 * service type, mode, extras gateway) removes the keys owned by branches that
 * are no longer active — from state AND from anything priced or submitted.
 * Seen: olcsokontenerhaz WC product still charged the bathroom add-on;
 * painlessremovals deselected extras still priced; lomtalan "hazard" carried
 * from lakás into tárgyak; trapezlemezes fence mode summed both modes.
 */

export interface BranchSpec<S extends string = string> {
  /** Which branches are active for the given answers. */
  activeBranches: (answers: Record<string, unknown>) => S[];
  /** Keys owned by each branch. A key may be owned by several branches. Patterns end with `*`. */
  owns: Record<S, string[]>;
}

function matches(key: string, pattern: string): boolean {
  return pattern.endsWith('*') ? key.startsWith(pattern.slice(0, -1)) : key === pattern;
}

function ownedBy<S extends string>(spec: BranchSpec<S>, key: string): S[] {
  return (Object.keys(spec.owns) as S[]).filter((b) => spec.owns[b].some((p) => matches(key, p)));
}

/**
 * Returns a copy of `answers` without keys that belong ONLY to inactive branches.
 * Keys not owned by any branch (contact data, shared answers) are kept.
 */
export function pruneToActiveBranches<S extends string>(
  answers: Record<string, unknown>,
  spec: BranchSpec<S>,
): Record<string, unknown> {
  const active = new Set(spec.activeBranches(answers));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(answers)) {
    const owners = ownedBy(spec, k);
    if (owners.length === 0 || owners.some((b) => active.has(b))) out[k] = v;
  }
  return out;
}

/**
 * Sum per-branch contributions over ALL active branches (additive, never exclusive).
 */
export function collectFromBranches<S extends string, T>(
  answers: Record<string, unknown>,
  spec: BranchSpec<S>,
  contribute: Record<S, (answers: Record<string, unknown>) => T[]>,
): T[] {
  const pruned = pruneToActiveBranches(answers, spec);
  return spec.activeBranches(answers).flatMap((b) => contribute[b](pruned));
}
