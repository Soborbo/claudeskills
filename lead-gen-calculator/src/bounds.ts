/**
 * One bounds definition for client AND server.
 *
 * Invariant F: the client accepts exactly what the server accepts. Every
 * mismatch is a "nem tudom beküldeni / I can't submit" complaint:
 *  - olcsokontenerhaz: UI qty 1–50, server max 20 → raw English zod error;
 *  - painlessremovals: client "non-empty" name, server letters-only regex → 400, lead lost;
 *  - trapezlemezes: roof slope > 800 cm accepted, unmanufacturable sheet;
 *  - femkeriteslec: HTML min/max not enforced in JS, 150.5 / 1e3 slip through.
 * Messages are user-facing in the site's language, never library defaults.
 */

export interface NumberBound {
  min: number;
  max: number;
  integer?: boolean;
  /** Message with {min} / {max} placeholders. */
  message: string;
}

export type BoundsSpec = Record<string, NumberBound>;

export interface BoundsResult {
  ok: boolean;
  /** Parsed numbers for valid fields. */
  values: Record<string, number>;
  /** field → user-facing message. */
  errors: Record<string, string>;
}

function format(msg: string, b: NumberBound): string {
  return msg.replace('{min}', String(b.min)).replace('{max}', String(b.max));
}

/** Strict numeric parse: rejects '', '1e3', '12abc', ' ', hex; accepts '12', '12.5', '12,5'. */
export function parseStrictNumber(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== 'string') return null;
  const s = raw.trim().replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function checkBounds(input: Record<string, unknown>, spec: BoundsSpec): BoundsResult {
  const values: Record<string, number> = {};
  const errors: Record<string, string> = {};
  for (const [field, b] of Object.entries(spec)) {
    const n = parseStrictNumber(input[field]);
    if (n === null || n < b.min || n > b.max || (b.integer && !Number.isInteger(n))) {
      errors[field] = format(b.message, b);
    } else {
      values[field] = n;
    }
  }
  return { ok: Object.keys(errors).length === 0, values, errors };
}

/** HTML attributes for an <input>, derived from the same spec (min/max/step/inputmode). */
export function inputAttrs(b: NumberBound): Record<string, string> {
  return {
    min: String(b.min),
    max: String(b.max),
    step: b.integer ? '1' : 'any',
    inputmode: b.integer ? 'numeric' : 'decimal',
  };
}
