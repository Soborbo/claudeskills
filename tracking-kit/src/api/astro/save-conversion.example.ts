/**
 * EXAMPLE — server-side mirror of a primary-completion event.
 *
 * Mount this kind of logic in YOUR existing form-success endpoint —
 * whichever route handles the "save quote / save signup / save lead"
 * action that produces the primary conversion. This file is not meant
 * to be dropped in as-is; it shows where the GA4 MP mirror call goes.
 *
 * Why mirror server-side: the browser dataLayer push for
 * `primary_conversion` (or whatever you name your engagement event)
 * can be lost — adblockers, tab-close immediately after submit, mobile
 * background-tab pause. A server-side GA4 MP send from the same
 * request that wrote the lead to your DB guarantees engagement
 * coverage.
 *
 * The CLIENT must pass `event_id` in the request body so the same
 * dedup key is shared with whatever browser-side event fires later.
 * Without that, GA4 will count two distinct sessions instead of one.
 *
 * Why no Meta CAPI mirror here: this endpoint fires on the engagement
 * event (`primary_conversion_complete`), which is intentionally NOT
 * mirrored to Meta — the conversion-state machine owns the Meta side
 * and fires `Lead` via CAPI on upgrade or on the late-fire timer (with
 * the same `event_id`). Mirroring CAPI here too would double-count.
 * For the Meta `ViewContent` engagement signal, see the client-side
 * `primary_first_view` flow in form-success-handler.ts.
 */

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { readGa4IdsFromCookie, sendGA4MP, type ServerEnv } from '@/lib/tracking/server';

export const prerender = false;

interface SaveBody {
  // Your domain payload (lead fields, calculator output, etc.)
  service?: string;
  total?: number;
  currency?: string;
  // Tracking
  event_id?: string;
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as SaveBody;

  // === Your domain logic here: persist the lead, send the email,
  //     etc. — exactly as before. The tracking call goes after. ===

  // Server-side GA4 MP mirror. The client_id + session_id come from the
  // visitor's REAL `_ga` / `_ga_<container>` cookies — this endpoint is
  // same-origin so the form POST carries them automatically. Never
  // substitute a synthetic id here (see INVARIANT #17): it would file the
  // conversion under a zombie (not set)/(not set) session that GA4 can't
  // dedup against the browser event and that poisons Ads imports.
  try {
    const serverEnv = env as ServerEnv;
    const { clientId, sessionId } = readGa4IdsFromCookie(
      request.headers.get('cookie'),
      serverEnv.GA4_MEASUREMENT_ID,
    );

    if (clientId) {
      await sendGA4MP(
        serverEnv,
        clientId,
        [
          {
            name: 'primary_conversion_complete',
            params: {
              event_id: body.event_id, // shared dedup key with the browser
              service: body.service,
              value: body.total,
              currency: body.currency || 'EUR',
            },
          },
        ],
        { sessionId },
      );
    }
    // No `_ga` cookie → fresh visitor or analytics consent denied. Skip
    // the send rather than fabricate a client_id; the browser-side event
    // is the only source of truth in that case.
  } catch {
    // best-effort
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
