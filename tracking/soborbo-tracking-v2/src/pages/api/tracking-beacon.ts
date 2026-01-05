/**
 * Tracking Beacon API Endpoint
 * 
 * Backup endpoint a form tracking adatokhoz.
 * sendBeacon() ide küldi az adatokat - garantált delivery.
 * 
 * Ez biztosítja, hogy a tracking adat MINDIG megérkezzen,
 * még ha a form gyorsan redirect-el is.
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';

// Validation schema
const BeaconSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  transactionId: z.string().optional(),
  gclid: z.string().nullable().optional(),
  fbclid: z.string().nullable().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  timestamp: z.string().optional(),
  url: z.string().url().optional(),
  userAgent: z.string().optional(),
});

// Rate limiting (simple in-memory, use KV in production)
const recentRequests = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const key = `beacon:${ip}`;
  
  // Clean old entries
  for (const [k, v] of recentRequests) {
    if (now - v > RATE_LIMIT_WINDOW) {
      recentRequests.delete(k);
    }
  }
  
  const count = [...recentRequests.entries()]
    .filter(([k]) => k.startsWith(`beacon:${ip}:`))
    .length;
    
  if (count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  recentRequests.set(`${key}:${now}`, now);
  return false;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Rate limiting
  const ip = clientAddress || 'unknown';
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limited' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Validate
  const result = BeaconSchema.safeParse(body);
  if (!result.success) {
    // Don't expose validation errors - just accept and move on
    // Tracking is best-effort
    console.warn('[Beacon] Invalid payload:', result.error.flatten());
  }
  
  const data = result.success ? result.data : body;
  
  // Log (in production: send to your analytics/logging service)
  console.info('[Beacon] Received:', {
    transactionId: (data as Record<string, unknown>).transactionId,
    gclid: (data as Record<string, unknown>).gclid,
    timestamp: (data as Record<string, unknown>).timestamp,
  });
  
  // Optional: Forward to Google Sheets
  const sheetsWebhook = import.meta.env.TRACKING_SHEETS_WEBHOOK;
  if (sheetsWebhook && result.success) {
    try {
      await fetch(sheetsWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'beacon',
          ...result.data,
          receivedAt: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(5000), // 5s timeout
      });
    } catch (err) {
      // Log but don't fail - Sheets is optional backup
      console.warn('[Beacon] Sheets webhook failed:', err);
    }
  }
  
  // Always return success (tracking is best-effort)
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};

// Reject other methods
export const ALL: APIRoute = () => {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
};
