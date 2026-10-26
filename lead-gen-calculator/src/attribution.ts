/**
 * Marketing attribution merge.
 *
 * Invariant I:
 *  - every lead form (calculator, callback, contact, quote-page callback)
 *    sends the same attribution field set;
 *  - at most ONE Google click id leaves the browser (gclid > gbraid > wbraid);
 *    Google offline import rejects rows with several;
 *  - the Google id comes from ONE source — a fresh URL click never gets mixed
 *    with a stale stored/cookie id (beautyflow merged `t.gclid || a.gclid`,
 *    `t.gbraid || a.gbraid` per key and could emit both);
 *  - storage access never throws into the submit path.
 */

export const GOOGLE_CLICK_IDS = ['gclid', 'gbraid', 'wbraid'] as const;
export const ATTRIBUTION_FIELDS = [
  ...GOOGLE_CLICK_IDS,
  'fbclid',
  'msclkid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

export type AttributionField = (typeof ATTRIBUTION_FIELDS)[number];
export type Attribution = Partial<Record<AttributionField, string>>;

const MAX_LEN = 500;

function clean(v: unknown): string {
  return typeof v === 'string' ? v.trim().slice(0, MAX_LEN) : '';
}

function pickGoogle(src: Record<string, unknown>): (typeof GOOGLE_CLICK_IDS)[number] | undefined {
  return GOOGLE_CLICK_IDS.find((k) => clean(src[k]));
}

/** Merge sources in priority order (first wins per field; Google id from one source only). */
export function mergeAttribution(...sources: Array<Record<string, unknown> | null | undefined>): Attribution {
  const list = sources.filter((s): s is Record<string, unknown> => !!s && typeof s === 'object');
  const out: Attribution = {};

  for (const field of ATTRIBUTION_FIELDS) {
    if ((GOOGLE_CLICK_IDS as readonly string[]).includes(field)) continue;
    for (const src of list) {
      const v = clean(src[field]);
      if (v) {
        out[field] = v;
        break;
      }
    }
  }

  for (const src of list) {
    const key = pickGoogle(src);
    if (key) {
      out[key] = clean(src[key]);
      break;
    }
  }
  return out;
}

export function attributionFromSearch(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const out: Record<string, string> = {};
  for (const f of ATTRIBUTION_FIELDS) {
    const v = params.get(f);
    if (v) out[f] = v;
  }
  return out;
}

type StorageLike = Pick<Storage, 'getItem'>;

/** Reads `{field: {value, savedAt}}` from storage; never throws; drops expired entries. */
export function readStoredAttribution(
  getStorage: () => StorageLike | null | undefined,
  key: string,
  ttlMs: number,
  now = Date.now(),
): Record<string, string> {
  const out: Record<string, string> = {};
  let parsed: unknown;
  try {
    const raw = getStorage()?.getItem(key);
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return out;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return out;
  for (const f of ATTRIBUTION_FIELDS) {
    const e = (parsed as Record<string, unknown>)[f];
    if (!e || typeof e !== 'object') continue;
    const { value, savedAt } = e as { value?: unknown; savedAt?: unknown };
    if (typeof value === 'string' && value && typeof savedAt === 'number' && now - savedAt < ttlMs) {
      out[f] = value;
    }
  }
  return out;
}
