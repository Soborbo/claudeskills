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

const FNV64_PRIME = 0x100000001b3n;
const FNV64_OFFSET = 0xcbf29ce484222325n;
// Second, independent lane: a different offset basis AND the bytes in reverse
// order, so a collision in one lane does not imply a collision in the other.
const FNV64_OFFSET_B = 0x84222325cbf29ce4n;
const MASK64 = 0xffffffffffffffffn;

function fnv1a64(bytes: Uint8Array, offset: bigint, reverse: boolean): bigint {
  let h = offset;
  for (let i = 0; i < bytes.length; i++) {
    h ^= BigInt(bytes[reverse ? bytes.length - 1 - i : i]);
    h = (h * FNV64_PRIME) & MASK64;
  }
  return h;
}

/**
 * 128-bit dedupe digest: two independent 64-bit FNV-1a lanes over the UTF-8
 * bytes, as 32 hex characters. Synchronous on purpose (no SubtleCrypto await in
 * the submit path). A 32-bit hash hits ~1% collision odds after ~10,000 distinct
 * payloads, and a collision silently suppresses a real submission (invariant A);
 * at 128 bits accidental collisions are negligible. Not for security: an
 * attacker can still construct collisions, which a client dedupe key does not
 * need to resist.
 */
export function hashString(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const a = fnv1a64(bytes, FNV64_OFFSET, false);
  const b = fnv1a64(bytes, FNV64_OFFSET_B, true);
  return a.toString(16).padStart(16, '0') + b.toString(16).padStart(16, '0');
}

export function keyFromPayload(payload: unknown, prefix = 'idem'): string {
  return `${prefix}_${hashString(stableStringify(payload))}`;
}
