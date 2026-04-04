/**
 * /api/track — Meta CAPI + beacon endpoint
 *
 * Security layers:
 *   1. Payload size limit (32 KB)
 *   2. Zod discriminated union schema (lead vs contact)
 *   3. Origin/Referer allowlist
 *   4. Optional HMAC token (TRACK_TOKEN env var)
 *   5. In-memory rate limiting (soft — supplement with Cloudflare WAF)
 *
 * Env vars:
 *   META_ACCESS_TOKEN, META_PIXEL_ID — required
 *   ALLOWED_ORIGINS — required (comma-separated)
 *   TRACK_TOKEN — optional (simple shared secret)
 *   TRACKING_SHEETS_WEBHOOK — optional
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { normalizeEmail, normalizePhone } from './persistence';

// ── Schema ─────────────────────────────────────────────────────────

const S = 256; // max general string length

const BaseFields = {
  eventId: z.string().min(8).max(64),
  sessionId: z.string().min(8).max(64).optional(),
  sourceType: z.string().max(20).optional(),
  pageUrl: z.string().max(2048).optional(),
  timestamp: z.string().max(64).optional(),
  url: z.string().max(2048).optional(),
  userAgent: z.string().max(512).optional(),
  gclid: z.string().max(S).nullable().optional(),
  fbclid: z.string().max(S).nullable().optional(),
  fbp: z.string().max(S).nullable().optional(),
  fbc: z.string().max(S).nullable().optional(),
  utm_source: z.string().max(S).optional(),
  utm_medium: z.string().max(S).optional(),
  utm_campaign: z.string().max(S).optional(),
  utm_content: z.string().max(S).optional(),
  utm_term: z.string().max(S).optional(),
  first_utm_source: z.string().max(S).optional(),
  first_utm_medium: z.string().max(S).optional(),
  first_utm_campaign: z.string().max(S).optional(),
  first_gclid: z.string().max(S).optional(),
  last_utm_source: z.string().max(S).optional(),
  last_utm_medium: z.string().max(S).optional(),
  last_utm_campaign: z.string().max(S).optional(),
  last_gclid: z.string().max(S).optional(),
};

const LeadSchema = z.object({
  type: z.literal('lead'),
  email: z.string().email().max(254),          // required for lead
  phone: z.string().max(20).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  value: z.number().positive().max(999_999).optional(),
  currency: z.string().length(3).optional(),
  contentName: z.string().max(S).optional(),
  ...BaseFields,
}).strict();

const ContactSchema = z.object({
  type: z.literal('contact'),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(20).optional(),
  ...BaseFields,
}).strict();

const BeaconSchema = z.discriminatedUnion('type', [LeadSchema, ContactSchema]);

type BeaconPayload = z.infer<typeof BeaconSchema>;

// ── SHA-256 ────────────────────────────────────────────────────────

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Rate limit (soft) ──────────────────────────────────────────────

const rlMap = new Map<string, number[]>();
const RL_WINDOW = 60_000;
const RL_MAX = 10;
const RL_MAP_MAX = 5_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const ts = (rlMap.get(ip) || []).filter(t => now - t < RL_WINDOW);
  if (ts.length >= RL_MAX) return true;
  ts.push(now);
  rlMap.set(ip, ts);
  if (rlMap.size > RL_MAP_MAX) {
    for (const [k, v] of rlMap) { if (v.every(t => now - t > RL_WINDOW)) rlMap.delete(k); }
  }
  return false;
}

// ── Origin check ───────────────────────────────────────────────────

function isOriginAllowed(req: Request, env: Record<string, string>): boolean {
  const origin = req.headers.get('Origin') || '';
  const referer = req.headers.get('Referer') || '';
  const raw = env.ALLOWED_ORIGINS;
  if (!raw) {
    console.warn('[Track] ALLOWED_ORIGINS not set — allowing all origins. Set this env var in production.');
    return true;
  }
  const allowed = raw.split(',').map(s => s.trim().toLowerCase());
  const check = (origin || referer).toLowerCase();
  return allowed.some(a => check.startsWith(a));
}

// ── Meta CAPI ──────────────────────────────────────────────────────

async function sendMeta(p: BeaconPayload, ip: string, env: Record<string, string>): Promise<boolean> {
  const pid = env.META_PIXEL_ID, tok = env.META_ACCESS_TOKEN;
  if (!pid || !tok) return false;

  const ud: Record<string, unknown> = {
    client_ip_address: ip,
    client_user_agent: p.userAgent || '',
  };
  if ('email' in p && p.email) ud.em = [await sha256(normalizeEmail(p.email))];
  if ('phone' in p && p.phone && p.phone.length >= 8) {
    ud.ph = [await sha256(normalizePhone(p.phone))];
  }
  if ('firstName' in p && p.firstName) ud.fn = [await sha256(p.firstName.trim().toLowerCase())];
  if ('lastName' in p && p.lastName) ud.ln = [await sha256(p.lastName.trim().toLowerCase())];
  if (p.fbp) ud.fbp = p.fbp;
  if (p.fbc) ud.fbc = p.fbc;

  const evName = p.type === 'contact' ? 'Contact' : 'Lead';
  const cd: Record<string, unknown> = {};
  if ('value' in p && p.value && p.value > 0) { cd.value = p.value; cd.currency = ('currency' in p && p.currency) || 'GBP'; }
  if ('contentName' in p && p.contentName) cd.content_name = p.contentName;

  const ev: Record<string, unknown> = {
    event_name: evName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: p.url || p.pageUrl || '',
    event_id: p.eventId,
    user_data: ud,
  };
  if (Object.keys(cd).length) ev.custom_data = cd;

  try {
    const r = await fetch(
      `https://graph.facebook.com/v24.0/${pid}/events?access_token=${tok}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [ev] }), signal: AbortSignal.timeout(5_000) },
    );
    if (!r.ok) { console.error('[Track] Meta CAPI:', r.status, await r.text()); return false; }
    return true;
  } catch (e) { console.error('[Track] Meta CAPI failed:', e); return false; }
}

// ── Route ──────────────────────────────────────────────────────────

const MAX_BODY = 32 * 1024;

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  const ip = clientAddress || 'unknown';
  const runtime = (locals as Record<string, unknown>).runtime as { env: Record<string, string> } | undefined;
  const env = runtime?.env ?? {} as Record<string, string>;
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

  // Rate limit
  if (isRateLimited(ip)) return json({ error: 'Too many requests' }, 429);

  // Size check
  const cl = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (cl > MAX_BODY) return json({ error: 'Payload too large' }, 413);

  // Parse
  let text: string;
  try { text = await request.text(); } catch { return json({ error: 'Read error' }, 400); }
  if (text.length > MAX_BODY) return json({ error: 'Payload too large' }, 413);

  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return json({ error: 'Invalid JSON' }, 400); }

  // Validate schema
  const parsed = BeaconSchema.safeParse(raw);
  if (!parsed.success) return json({ error: 'Invalid payload', details: parsed.error.flatten().fieldErrors }, 400);

  const payload = parsed.data;

  // Origin check
  if (!isOriginAllowed(request, env)) return json({ error: 'Forbidden' }, 403);

  // Optional token check
  const token = env.TRACK_TOKEN;
  if (token && request.headers.get('x-track-token') !== token) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // Meta CAPI
  const metaOk = await sendMeta(payload, ip, env);

  // Sheets (fire-and-forget)
  const sheets = env.TRACKING_SHEETS_WEBHOOK;
  if (sheets) {
    fetch(sheets, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, receivedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(5_000) }).catch(() => {});
  }

  return json({ ok: true, meta_sent: metaOk, event_id: payload.eventId });
};

export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
