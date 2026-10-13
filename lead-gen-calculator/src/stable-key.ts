/**
 * Deterministic serialisation for client idempotency keys.
 *
 * Invariant A: an idempotency key must cover EVERY field that makes two
 * submissions different. `JSON.stringify(obj, Object.keys(obj).sort())` looks
 * like it sorts keys, but the array is a *whitelist* applied at every depth:
 * nested objects whose keys are not top-level keys serialise as `{}`.
 * Two different carts / quotes then share a key and the second submission is
 * silently suppressed (trapezlemezes.hu, 2026-04 → 2026-10).
 */

export function stableStringify(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') {
    // NaN / Infinity serialise as null in JSON — keep that behaviour.
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

/** FNV-1a 32-bit — enough for a client-side dedupe key, not for security. */
export function hashString(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function keyFromPayload(payload: unknown, prefix = 'idem'): string {
  return `${prefix}_${hashString(stableStringify(payload))}`;
}
