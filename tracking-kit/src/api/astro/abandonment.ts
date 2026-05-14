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
  isAllowedOrigin,
  readGa4IdsFromCookie,
  sendGA4MP,
  type ServerEnv,
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

    // `navigator.sendBeacon` on `pagehide` is same-origin, so the visitor's
    // real `_ga` / `_ga_<container>` cookies ride along on this request —
    // read the client_id + session_id from them so the abandonment event
    // attributes to the actual session. Never fabricate a client_id (see
    // INVARIANT #17): a synthetic id files every abandonment under a zombie
    // (not set)/(not set) session.
    const serverEnv = env as ServerEnv;
    const { clientId, sessionId } = readGa4IdsFromCookie(
      request.headers.get('cookie'),
      serverEnv.GA4_MEASUREMENT_ID,
    );

    if (clientId) {
      await sendGA4MP(
        serverEnv,
        clientId,
        [{ name: 'form_abandonment', params: payload as Record<string, unknown> }],
        { sessionId },
      );
    }
    // No `_ga` cookie (consent denied / fresh visitor) → skip the send.
  } catch (err) {
    console.warn('[Abandonment] Failed to process beacon', err);
  }
  return new Response(null, { status: 204 });
};
