/**
 * Meta CAPI mirror endpoint — Next.js App Router.
 *
 * Mount at `app/api/meta/capi/route.ts`.
 *
 * See ../astro/meta-capi.ts for the rationale on origin allowlist,
 * rate limiting, allowed events, and event_time clamping. The two
 * files are equivalent except for the framework idioms.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { sendMetaCapi, type MetaCapiEvent, type ServerEnv } from '@/lib/tracking/server';
import { DEFAULT_COUNTRY } from '@/lib/tracking/config';

export const runtime = 'edge'; // or 'nodejs' if you prefer

const ALLOWED_ORIGINS = new Set<string>([
  'https://example.com',
  'https://www.example.com',
]);
const ALLOWED_EVENTS = new Set(['Lead', 'Contact', 'ViewContent']);
const EVENT_TIME_MIN_AGE_S = 24 * 60 * 60;
const EVENT_TIME_FUTURE_S = 5 * 60;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function clampEventTime(input: unknown): number {
  const now = Math.floor(Date.now() / 1000);
  if (typeof input !== 'number' || !Number.isFinite(input)) return now;
  if (input < now - EVENT_TIME_MIN_AGE_S) return now;
  if (input > now + EVENT_TIME_FUTURE_S) return now;
  return Math.floor(input);
}

async function checkRateLimit(_req: NextRequest): Promise<boolean> {
  // Plug in @upstash/ratelimit, @vercel/kv-based limiter, or your own.
  return true;
}

function envFromProcess(): ServerEnv {
  return {
    GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID,
    GA4_API_SECRET: process.env.GA4_API_SECRET,
    META_PIXEL_ID: process.env.META_PIXEL_ID,
    META_CAPI_ACCESS_TOKEN: process.env.META_CAPI_ACCESS_TOKEN,
    META_CAPI_TEST_EVENT_CODE: process.env.META_CAPI_TEST_EVENT_CODE,
  };
}

interface IncomingPayload {
  event_name?: string;
  event_id?: string;
  event_time?: number;
  event_source_url?: string;
  user_data?: Record<string, unknown>;
  custom_data?: Record<string, unknown>;
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
    const body = (await request.json()) as IncomingPayload;
    if (!body?.event_name || !body?.event_id) {
      return NextResponse.json({ error: 'event_name and event_id required' }, { status: 400 });
    }
    if (!ALLOWED_EVENTS.has(body.event_name)) {
      return NextResponse.json({ error: 'event_name not allowed' }, { status: 400 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('cf-connecting-ip') ||
      undefined;
    const ua = request.headers.get('user-agent') || undefined;
    const incomingUserData = isPlainObject(body.user_data) ? body.user_data : {};
    const incomingCustom = isPlainObject(body.custom_data) ? body.custom_data : {};

    const userData: NonNullable<MetaCapiEvent['user_data']> = {};
    if (typeof incomingUserData.email === 'string') userData.email = incomingUserData.email;
    if (typeof incomingUserData.phone_number === 'string') userData.phone_number = incomingUserData.phone_number;
    if (typeof incomingUserData.first_name === 'string') userData.first_name = incomingUserData.first_name;
    if (typeof incomingUserData.last_name === 'string') userData.last_name = incomingUserData.last_name;
    if (typeof incomingUserData.city === 'string') userData.city = incomingUserData.city;
    if (typeof incomingUserData.postal_code === 'string') userData.postal_code = incomingUserData.postal_code;
    userData.country = typeof incomingUserData.country === 'string' ? incomingUserData.country : DEFAULT_COUNTRY;
    if (typeof incomingUserData.fbp === 'string') userData.fbp = incomingUserData.fbp;
    if (typeof incomingUserData.fbc === 'string') userData.fbc = incomingUserData.fbc;
    if (ua) userData.client_user_agent = ua;
    if (ip) userData.client_ip_address = ip;

    const event: MetaCapiEvent = {
      event_name: body.event_name,
      event_id: String(body.event_id).slice(0, 200),
      event_time: clampEventTime(body.event_time),
      action_source: 'website',
      user_data: userData,
      custom_data: incomingCustom,
    };
    if (typeof body.event_source_url === 'string') {
      event.event_source_url = body.event_source_url.slice(0, 2000);
    }

    await sendMetaCapi(envFromProcess(), [event], { countryCode: DEFAULT_COUNTRY });
  } catch (err) {
    console.warn('[MetaCAPI] Failed to process mirror request', err);
  }

  return new NextResponse(null, { status: 204 });
}
