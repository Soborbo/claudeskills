/**
 * Server-side tracking endpoint
 * POST /api/track
 * Receives conversion events for Meta CAPI, Google Ads Enhanced Conversions
 */

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { z } from 'astro/zod';
import { config } from '../../config/siteConfig.example';

const trackSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('lead'),
    event_id: z.string().max(100),
    email: z.string().email(),
    phone: z.string().max(20).optional(),
    form_id: z.string().max(50),
    value: z.number().optional(),
  }),
  z.object({
    type: z.literal('contact'),
    event_id: z.string().max(100),
    email: z.string().email(),
    phone: z.string().max(20).optional(),
    form_id: z.string().max(50),
  }),
  z.object({
    type: z.literal('phone_click'),
    event_id: z.string().max(100).optional(),
    phone: z.string().max(20),
  }),
]);

export const POST: APIRoute = async ({ request }) => {
  // Payload size limit (32KB)
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > 32768) {
    return new Response('Payload too large', { status: 413 });
  }

  // Origin check using site URL from config
  const origin = request.headers.get('origin') || '';
  const siteOrigin = new URL(config.url).origin;
  const allowedOriginsEnv = ((env.ALLOWED_ORIGINS as string) || '').split(',').filter(Boolean);
  const allowedOrigins = [siteOrigin, ...allowedOriginsEnv];
  if (origin && !allowedOrigins.some(o => origin === o)) {
    return new Response('Forbidden', { status: 403 });
  }

  // Token authentication
  const trackToken = (env.TRACK_TOKEN as string) || '';
  if (trackToken) {
    const authHeader = request.headers.get('x-track-token') || '';
    if (authHeader !== trackToken) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const parsed = trackSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = parsed.data;

    // TODO: Send to Meta CAPI
    // TODO: Send to Google Ads Enhanced Conversions
    // These integrations happen via their respective APIs

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response('Bad request', { status: 400 });
  }
};
