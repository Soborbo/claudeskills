/**
 * Form abandonment beacon endpoint — Next.js App Router.
 *
 * Mount at `app/api/track/abandonment/route.ts`.
 *
 * See ../astro/abandonment.ts for the rationale on Origin allowlist,
 * rate limiting, and IP handling.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { deriveClientId, sendGA4MP, type ServerEnv } from '@/lib/tracking/server';

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

async function checkRateLimit(_req: NextRequest): Promise<boolean> {
  return true;
}

function envFromProcess(): ServerEnv {
  return {
    GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID,
    GA4_API_SECRET: process.env.GA4_API_SECRET,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get('Origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new NextResponse(null, { status: 204 });
  }
  if (!(await checkRateLimit(request))) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const raw = (await request.json()) as unknown;
    const payload = sanitize(raw);

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('cf-connecting-ip') ||
      '';
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
