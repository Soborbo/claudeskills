/**
 * Postcode → City API route — Cloudflare Workers compatible
 *
 * HU: Static lookup from bundled map (4-digit postcodes, ~3400 entries).
 * UK: Proxy to postcodes.io (free, no API key, rate-limited at 2 req/s).
 *
 * Usage: GET /api/postcode?code=BS1+4DJ&locale=en-GB
 *        GET /api/postcode?code=1011&locale=hu-HU
 *
 * Returns: { city: "Bristol" } or { city: null }
 */

import type { APIRoute } from 'astro';

// ── HU postcode data (loaded at build time) ───────────────────────
// Import the JSON map: { "1011": "Budapest", "3300": "Eger", ... }
// Generate with: scripts/build-hu-postcodes.ts or download from
// Magyar Posta / KSH and convert to JSON.
import huPostcodes from '../data/hu-postcodes.json';

const huMap = huPostcodes as Record<string, string>;

// ── UK: postcodes.io proxy ────────────────────────────────────────

async function lookupUK(code: string): Promise<string | null> {
  const cleaned = code.replace(/\s+/g, '').toUpperCase();
  if (cleaned.length < 5 || cleaned.length > 8) return null;

  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}`,
      { signal: AbortSignal.timeout(3_000) },
    );
    if (!res.ok) return null;
    const data = await res.json() as { result?: { admin_district?: string; admin_ward?: string } };
    return data.result?.admin_district || null;
  } catch {
    return null;
  }
}

// ── HU: static map lookup ─────────────────────────────────────────

function lookupHU(code: string): string | null {
  const cleaned = code.replace(/\s+/g, '');
  if (!/^\d{4}$/.test(cleaned)) return null;
  return huMap[cleaned] || null;
}

// ── Route ─────────────────────────────────────────────────────────

export const GET: APIRoute = async ({ url }) => {
  const code = url.searchParams.get('code')?.trim();
  const locale = url.searchParams.get('locale') || 'en-GB';

  if (!code) {
    return new Response(JSON.stringify({ city: null, error: 'Missing code param' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const city = locale === 'hu-HU'
    ? lookupHU(code)
    : await lookupUK(code);

  return new Response(JSON.stringify({ city }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': city ? 'public, max-age=86400' : 'no-store',
    },
  });
};
