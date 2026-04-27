/**
 * Form abandonment beacon endpoint — Next.js App Router.
 *
 * Mount at `app/api/track/abandonment/route.ts`.
 *
 * See ../astro/abandonment.ts for the rationale on Origin allowlist,
 * rate limiting, and IP handling.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  checkRateLimit,
  corsPreflightResponse,
  deriveClientId,
  isAllowedOrigin,
  sendGA4MP,
  type ServerEnv,
} from '@/lib/tracking/server';
import { RATE_LIMIT_ABANDONMENT_MAX } from '@/lib/tracking/config';

export const runtime = 'edge'; // or 'nodejs'

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

function envFromProcess(): ServerEnv {
  return {
    GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID,
    GA4_API_SECRET: process.env.GA4_API_SECRET,
  };
}

export async function OPTIONS(request: NextRequest): Promise<Response> {
  return corsPreflightResponse(request.headers.get('Origin'), ALLOWED_ORIGINS);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get('Origin');
  if (!isAllowedOrigin(origin, ALLOWED_ORIGINS)) {
    return new NextResponse(null, { status: 204 });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('cf-connecting-ip') ||
    '';
  if (!checkRateLimit(`abandon:${ip}`, RATE_LIMIT_ABANDONMENT_MAX)) {
    return new NextResponse(null, { status: 429 });
  }

  try {
    const raw = (await request.json()) as unknown;
    const payload = sanitize(raw);

    const ua = request.headers.get('user-agent') || '';
    const clientId = deriveClientId(`${ip}${ua}`.replace(/[^a-f0-9]/gi, '').padEnd(32, '0'));

    await sendGA4MP(envFromProcess(), clientId, [
      { name: 'form_abandonment', params: payload as Record<string, unknown> },
    ]);
  } catch (err) {
    console.warn('[Abandonment] Failed to process beacon', err);
  }
  return new NextResponse(null, { status: 204 });
}
