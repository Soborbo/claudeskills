/**
 * Form abandonment beacon endpoint — Astro + Cloudflare Pages.
 *
 * Mount at `src/pages/api/track/abandonment.ts` in your Astro project.
 *
 * Receives `navigator.sendBeacon()` payloads from form-tracking.ts and
 * forwards them to GA4 Measurement Protocol so we have a server-side
 * record even when the browser failed to flush its dataLayer push during
 * `pagehide` (common on mobile).
 *
 * Always returns 204 — sendBeacon doesn't read the body and we don't
 * want a noisy retry loop on failure. Rate-limit + Origin gating
 * matters here because the endpoint forwards to GA4 MP and a flood
 * would burn quota and pollute reports.
 */

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  checkRateLimit,
  corsPreflightResponse,
  deriveClientId,
  isAllowedOrigin,
  sendGA4MP,
} from '@/lib/tracking/server';
import { RATE_LIMIT_ABANDONMENT_MAX } from '@/lib/tracking/config';

export const prerender = false;

// --- CUSTOMIZE: your allowed origins. ---
const ALLOWED_ORIGINS = new Set<string>([
  'https://example.com',
  'https://www.example.com',
]);

const ALLOWED_KEYS = new Set([
  'form_name',
  'last_step',
  'last_field',
  'time_spent_seconds',
  'exit_page_path',
  'exit_page_title',
  'exit_page_url',
]);

interface AbandonmentPayload {
  form_name?: string;
  last_step?: string;
  last_field?: string;
  time_spent_seconds?: number;
  exit_page_path?: string;
  exit_page_title?: string;
  exit_page_url?: string;
}

function sanitize(input: unknown): AbandonmentPayload {
  if (!input || typeof input !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (!ALLOWED_KEYS.has(k)) continue;
    if (typeof v === 'string') out[k] = v.slice(0, 500);
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out as AbandonmentPayload;
}

export const OPTIONS: APIRoute = async ({ request }) => {
  return corsPreflightResponse(request.headers.get('Origin'), ALLOWED_ORIGINS);
};

export const POST: APIRoute = async (context) => {
  const { request } = context;
  const origin = request.headers.get('Origin');

  if (!isAllowedOrigin(origin, ALLOWED_ORIGINS)) {
    return new Response(null, { status: 204 });
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!checkRateLimit(`abandon:${ip}`, RATE_LIMIT_ABANDONMENT_MAX)) {
    return new Response(null, { status: 429 });
  }

  try {
    const raw = (await request.json()) as unknown;
    const payload = sanitize(raw);

    // Caller-supplied IP is unreliable; we use the CF-Connecting-IP for
    // a fingerprint-only client_id. We do NOT send the IP to GA4 — that
    // would breach our own consent posture for analytics_storage=denied
    // sessions.
    const ua = request.headers.get('User-Agent') || '';
    const clientId = deriveClientId(`${ip}${ua}`.replace(/[^a-f0-9]/gi, '').padEnd(32, '0'));

    await sendGA4MP(env as Parameters<typeof sendGA4MP>[0], clientId, [
      {
        name: 'form_abandonment',
        params: payload as Record<string, unknown>,
      },
    ]);
  } catch (err) {
    console.warn('[Abandonment] Failed to process beacon', err);
  }
  return new Response(null, { status: 204 });
};
