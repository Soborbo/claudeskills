/**
 * Meta CAPI mirror endpoint — Next.js App Router.
 *
 * Mount at `app/api/meta/capi/route.ts`.
 *
 * See ../astro/meta-capi.ts for the full hardening notes (origin gate,
 * rate limit, custom_data whitelist, fbp/fbc validation, event_source_url
 * pinning, consent gate). The two files are equivalent except for the
 * framework idioms.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  checkRateLimit,
  corsPreflightResponse,
  isAllowedOrigin,
  isValidConversionValue,
  isValidCurrency,
  isValidEventId,
  isValidEmail,
  isValidFbc,
  isValidFbp,
  metaCapiConsentAllowed,
  pickEventSourceUrl,
  sendMetaCapi,
  type MetaCapiEvent,
  type ServerEnv,
} from '@/lib/tracking/server';
import { DEFAULT_COUNTRY, RATE_LIMIT_CAPI_MAX } from '@/lib/tracking/config';

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

function sanitizeCustomData(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (isValidConversionValue(input.value)) out.value = input.value;
  if (isValidCurrency(input.currency)) out.currency = input.currency;
  if (typeof input.content_name === 'string' && input.content_name.length <= 200) {
    out.content_name = input.content_name;
  }
  return out;
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
  consent_state?: Record<string, unknown>;
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
  if (!checkRateLimit(`capi:${ip}`, RATE_LIMIT_CAPI_MAX)) {
    return new NextResponse(null, { status: 429 });
  }

  try {
    const body = (await request.json()) as IncomingPayload;
    if (!isValidEventId(body?.event_id)) {
      return NextResponse.json({ error: 'invalid event_id' }, { status: 400 });
    }
    if (typeof body.event_name !== 'string' || !ALLOWED_EVENTS.has(body.event_name)) {
      return NextResponse.json({ error: 'event_name not allowed' }, { status: 400 });
    }
    if (!metaCapiConsentAllowed(body.consent_state)) {
      return new NextResponse(null, { status: 204 });
    }

    const ua = request.headers.get('user-agent') || undefined;
    const incomingUserData = isPlainObject(body.user_data) ? body.user_data : {};
    const incomingCustom = isPlainObject(body.custom_data) ? body.custom_data : {};

    const userData: NonNullable<MetaCapiEvent['user_data']> = {};
    if (isValidEmail(incomingUserData.email)) userData.email = incomingUserData.email;
    if (typeof incomingUserData.phone_number === 'string' && incomingUserData.phone_number.length <= 32) {
      userData.phone_number = incomingUserData.phone_number;
    }
    if (typeof incomingUserData.first_name === 'string' && incomingUserData.first_name.length <= 100) {
      userData.first_name = incomingUserData.first_name;
    }
    if (typeof incomingUserData.last_name === 'string' && incomingUserData.last_name.length <= 100) {
      userData.last_name = incomingUserData.last_name;
    }
    if (typeof incomingUserData.city === 'string' && incomingUserData.city.length <= 100) {
      userData.city = incomingUserData.city;
    }
    if (typeof incomingUserData.postal_code === 'string' && incomingUserData.postal_code.length <= 20) {
      userData.postal_code = incomingUserData.postal_code;
    }
    userData.country = typeof incomingUserData.country === 'string' && incomingUserData.country.length === 2
      ? incomingUserData.country
      : DEFAULT_COUNTRY;
    if (isValidFbp(incomingUserData.fbp)) userData.fbp = incomingUserData.fbp;
    if (isValidFbc(incomingUserData.fbc)) userData.fbc = incomingUserData.fbc;
    if (ua) userData.client_user_agent = ua.slice(0, 500);
    if (ip) userData.client_ip_address = ip;

    const event: MetaCapiEvent = {
      event_name: body.event_name,
      event_id: body.event_id,
      event_time: clampEventTime(body.event_time),
      action_source: 'website',
      user_data: userData,
      custom_data: sanitizeCustomData(incomingCustom),
    };
    const sourceUrl = pickEventSourceUrl(
      body.event_source_url,
      request.headers.get('referer'),
      ALLOWED_ORIGINS,
    );
    if (sourceUrl) event.event_source_url = sourceUrl;

    await sendMetaCapi(envFromProcess(), [event], { countryCode: DEFAULT_COUNTRY });
  } catch (err) {
    console.warn('[MetaCAPI] Failed to process mirror request', err);
  }

  return new NextResponse(null, { status: 204 });
}
