// src/pages/api/error-log.ts
//
// Receives client-side error reports and forwards them via console.error.
// The Workers runtime captures the log; the error-notifier Tail Worker reads
// it and handles persistence + email.
//
// Critical-path goals:
//   - Return 204 in <5ms
//   - No awaits, no external fetches, no KV reads
//   - All heavy work happens in the Tail Worker, not here

import type { APIRoute } from 'astro';

const MAX_BODY_BYTES = 8 * 1024;
// CATEGORY-SUBCATEGORY-NNN. Sub-category len up to 12 to admit codes like
// JS-UNHANDLED-001 / NET-OFFLINE-001 / RESEND-SEND-001 already in use.
const CODE_PATTERN = /^[A-Z]{2,6}-[A-Z]{2,12}-\d{3}$/;

export const POST: APIRoute = async ({ request }) => {
  // Quick body-size guard before allocating a string.
  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  let payload: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return new Response(null, { status: 413 });
    }
    payload = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }

  // Minimum viable validation. Everything else is the Tail Worker's problem.
  if (!payload || typeof payload !== 'object') {
    return new Response(null, { status: 400 });
  }
  if (typeof payload.code !== 'string' || !CODE_PATTERN.test(payload.code)) {
    return new Response(null, { status: 400 });
  }
  if (payload.__pipeline !== 'error') {
    return new Response(null, { status: 400 });
  }

  // The Tail Worker keys off this exact marker + structure.
  // Synchronous — no network round-trip, just a runtime log capture.
  console.error(JSON.stringify(payload));

  return new Response(null, { status: 204 });
};

// Block other methods with a 405 — keeps logs tidy.
export const GET: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'POST' } });
