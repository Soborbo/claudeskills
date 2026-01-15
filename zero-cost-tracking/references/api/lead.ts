/**
 * Lead API Endpoint
 *
 * Receives lead submissions and forwards to Google Sheets.
 * Handles idempotency, validation, and Turnstile verification.
 *
 * POST /api/lead
 */

import type { APIRoute } from 'astro';

// =============================================================================
// Types
// =============================================================================

interface LeadPayload {
  lead_id: string;
  event_type: string;
  submitted_at: string;
  tracking_version: string;
  session_id: string;
  consent_state: string;
  source_type: string;
  name: string;
  email: string;
  phone: string;
  value: number;
  currency: string;
  page_url: string;
  device: string;
  first_utm_source: string;
  first_utm_medium: string;
  first_utm_campaign: string;
  first_utm_term: string;
  first_utm_content: string;
  first_gclid: string;
  first_fbclid: string;
  first_referrer: string;
  last_utm_source: string;
  last_utm_medium: string;
  last_utm_campaign: string;
  last_utm_term: string;
  last_utm_content: string;
  last_gclid: string;
  last_fbclid: string;
  idempotency_key: string;
  turnstile_token?: string;
}

// =============================================================================
// Idempotency Store (in-memory, replace with KV in production)
// =============================================================================

const idempotencyStore = new Map<string, { leadId: string; timestamp: number }>();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

function cleanExpiredKeys(): void {
  const now = Date.now();
  for (const [key, value] of idempotencyStore) {
    if (now - value.timestamp > IDEMPOTENCY_TTL) {
      idempotencyStore.delete(key);
    }
  }
}

function checkIdempotency(key: string): string | null {
  cleanExpiredKeys();
  const existing = idempotencyStore.get(key);
  return existing?.leadId || null;
}

function storeIdempotency(key: string, leadId: string): void {
  idempotencyStore.set(key, { leadId, timestamp: Date.now() });
}

// =============================================================================
// Turnstile Verification
// =============================================================================

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn('[Lead API] TURNSTILE_SECRET_KEY not set - skipping verification');
    return true;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('[Lead API] Turnstile verification failed:', error);
    return false;
  }
}

// =============================================================================
// Sheets Webhook
// =============================================================================

async function sendToSheets(payload: LeadPayload): Promise<boolean> {
  const webhookUrl = import.meta.env.GOOGLE_SHEETS_WEBHOOK;

  if (!webhookUrl) {
    console.error('[Lead API] GOOGLE_SHEETS_WEBHOOK not configured');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      console.error('[Lead API] Sheets webhook failed:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Lead API] Sheets webhook error:', error);
    return false;
  }
}

// =============================================================================
// Validation
// =============================================================================

function validatePayload(data: unknown): data is LeadPayload {
  if (!data || typeof data !== 'object') return false;

  const payload = data as Record<string, unknown>;

  // Required fields
  const requiredFields = [
    'lead_id',
    'event_type',
    'submitted_at',
    'email',
    'idempotency_key',
  ];

  for (const field of requiredFields) {
    if (!payload[field] || typeof payload[field] !== 'string') {
      return false;
    }
  }

  // Valid event types
  const validEvents = ['quote_request', 'callback_request', 'contact_form'];
  if (!validEvents.includes(payload.event_type as string)) {
    return false;
  }

  // Basic email validation
  const email = payload.email as string;
  if (!email.includes('@') || email.length < 5) {
    return false;
  }

  return true;
}

// =============================================================================
// API Handler
// =============================================================================

export const POST: APIRoute = async ({ request }) => {
  // Parse body
  let payload: LeadPayload;

  try {
    const body = await request.json();

    if (!validatePayload(body)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    payload = body;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check Turnstile (if token provided)
  if (payload.turnstile_token) {
    const isValid = await verifyTurnstile(payload.turnstile_token);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Turnstile verification failed' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Check idempotency
  const existingLeadId = checkIdempotency(payload.idempotency_key);
  if (existingLeadId) {
    // Return existing lead_id without creating duplicate
    return new Response(
      JSON.stringify({
        success: true,
        lead_id: existingLeadId,
        duplicate: true,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Send to Sheets
  const sent = await sendToSheets(payload);

  if (!sent) {
    return new Response(
      JSON.stringify({ error: 'Failed to submit lead' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Store idempotency key
  storeIdempotency(payload.idempotency_key, payload.lead_id);

  return new Response(
    JSON.stringify({
      success: true,
      lead_id: payload.lead_id,
      duplicate: false,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

// Handle sendBeacon (may come as text/plain)
export const prerender = false;
