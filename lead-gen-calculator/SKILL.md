---
name: lead-gen-calculator
description: Correctness rules for multi-step lead-gen calculators (quote tools, price estimators, quizzes) on Astro/Cloudflare — composite selections, stale branch state, client/server bounds, idempotency, server price recompute, one-shot conversions, attribution, funnel tracking. Use when building, changing, reviewing or auditing any calculator or quote flow, or when a customer reports "can't submit / can't add to cart / wrong price".
---

# Lead-gen calculator — integrity rules

Every rule below comes from a real production bug found in the 2026-10 audit of
six Soborbo calculators (trapezlemezes, femkeriteslec, olcsokontenerhaz,
painlessremovals, lomtalan, beautyflow). Details: `references/incidents.md`.

`src/` holds small, dependency-free reference modules that implement each rule;
`tests/` pins them with regression tests named after the incident. Copy a module
into the site (`src/lib/calculator/…`) rather than re-deriving it, and copy its
tests with it.

For the form backend (zod, Resend/Brevo, Sheets, Turnstile) see `astro-forms-v3`.
For GA4/Meta/Ads event plumbing see `soborbo-tracking` in the Serverside repo.
The old UI-pattern skill is archived at `old/lead-gen-calculator`.

## The invariants

| # | Rule | Reference module |
|---|---|---|
| A | An idempotency / dedupe key covers **every** field that distinguishes two submissions. Never `JSON.stringify(obj, Object.keys(obj).sort())` — the array is a whitelist at every depth and empties nested objects. | `stable-key.ts` |
| B | Composite choices are **additive**: "roof AND wall" sums every active branch. No `if (sizes.length === 0) otherBranch()`. | `branch-state.ts` → `collectFromBranches` |
| C | Switching a branch-selecting answer (product, service, mode, extras gateway, property type) **removes the other branch's keys** from state, price and payload. Hidden DOM inputs still post — clear them too. | `branch-state.ts` → `pruneToActiveBranches` |
| D | Dynamic rows: remove = delete from DOM **and** state; new row index from a monotonic counter, never `rows.length`. | (pattern; see incidents) |
| E | One click = one request: in-flight guard; listeners bound once (no `addEventListener` inside a click/open handler without removal). | `submit-guard.ts` |
| F | **One bounds spec** drives the HTML attributes, the client check and the server schema. Messages in the site language — never raw zod. A lead is never dropped for formatting (sanitise names, don't reject). | `bounds.ts` |
| G | "Start over" resets everything: extra rows, counters, hidden sections, warnings, persisted state — and re-applies attribution. | (pattern) |
| H | Conversions and "quote viewed" fire **once per entity** (quote/event id) via localStorage → sessionStorage → memory, and only **after** the server durably accepted the lead (`state: 'accepted'`, never on `pending`). The once-mark is written only **after a successful send**: a callback that throws, returns `false` (no consent / no dataLayer), or whose promise rejects leaves the id retryable. `fireOnce` is sync-only and refuses a Promise; use `fireOnceAsync` for async sends. | `once-guard.ts`, `submit-guard.ts` |
| I | Every form (calculator, callback, contact, quote-page callback) sends the same attribution set; ≤1 Google click id (gclid > gbraid > wbraid) from **one** source; storage access never throws into submit. | `attribution.ts` |
| J | Funnel events: `quote_calculator_opened` once per session (not behind a consent timeout that drops it); `quote_calculator_step_completed` on **forward completion**, once per step — not on render/back/restore; `value` is always numeric, choices go to `option_value`; GA4 custom dimensions exist for `step_id`, `option_value`, `calculator_name`. "Once" is marked only after the push succeeded — a throwing / `false` / rejected push (also for `opened`) stays retryable, and tracking errors never throw into the UI. | `step-tracker.ts` |
| K | The server **recomputes the price** from answers with the shared pricing module; that value goes to CRM, e-mail, Sheets and conversion `value`. Dedupe: check before delivery, **mark after success**. A lead stored in any durable sink is a success (`leadAccepted`) even if the notification mail failed — answer it (and its `duplicate` retry) as accepted. | `server-price.ts`, `dedupe.ts` |
| L | No silent failure and **2xx ≠ business success**: never `fetch().catch(()=>{})`; success only on an explicit acceptance (`isAccepted`; default: `leadAccepted`/`success`/`ok`/`accepted` `true`) — `success:false`, `ok:false`, an empty 2xx body are rejections, 202 / `deferred` / `pending` is a separate **pending** outcome; never show "we e-mailed you" unless the server says the customer e-mail went out. A durably accepted lead is **never** reported as failed because a notification, tracking or `onSuccess` step failed (`callbackError`). Every gate shows a message; allowlist/maintenance gates normalise the path and keep the query string. | `submit-guard.ts`, `dedupe.ts`, `path-gate.ts` |

### Four states — never collapse them

| State | Source of truth | UI may say |
|---|---|---|
| Request in flight | `guard.inFlight` / `state: 'skipped'` | "Sending…" (button disabled) |
| Lead durably accepted | server `leadAccepted` (≥1 durable sink: CRM / DB / Sheets) → `state: 'accepted'` | "We got your request" + conversion push |
| Customer e-mail sent | explicit server field (e.g. `emailDelivered: true`) | "We e-mailed you" — **only** then |
| Background delivery queued | 202 / `deferred` / `pending` → `state: 'pending'` | neutral "processing" message; no conversion, no error; retry with the same `event_id` |

A notification / e-mail / tracking failure after durable acceptance is logged
and reported (server log, `callbackError`), never turned into a failure
response — a "failed" lead that was stored invites a resubmit and a duplicate.

## When building or changing a calculator

1. Put pricing + answer→items logic in a **pure TS module** shared by the page
   script and the API route. Describe branches with a `BranchSpec`.
2. Define bounds once (`BoundsSpec`) and generate input attributes from it.
3. Submit through `createSubmitGuard` (set `isAccepted` to the site's response
   contract); push the conversion in `onSuccess` with the guard's `event_id`;
   send the same `event_id` to the server for dedupe and Pixel↔CAPI dedup.
   Branch the UI on `state`, not on `res.ok`:

   ```ts
   const guard = createSubmitGuard({
     fallbackError: 'Nem sikerült elküldeni. Kérjük, hívjon minket.',
     isAccepted: (_res, d) => {
       const b = d as { leadAccepted?: boolean; deferred?: boolean } | undefined;
       return b?.deferred ? 'pending' : b?.leadAccepted === true;
     },
   });
   const out = await guard.submit<{ emailDelivered?: boolean }>('/api/submit', payload, (_d, eventId) =>
     // `false` = not sent (no dataLayer yet) → not marked, a later retry still fires
     once.fireOnce(`conv:${eventId}`, () => (window.dataLayer ? (window.dataLayer.push({ event: 'quote_submitted', event_id: eventId }), true) : false)),
   );
   if (out.state === 'accepted') showThanks({ emailed: out.data?.emailDelivered === true });
   else if (out.state === 'pending') showProcessing();          // not success, not error
   else if (out.state !== 'skipped') showError(out.error!);     // rejected / network-error
   if (out.callbackError) console.error(out.callbackError);     // lead is still accepted
   ```
4. Server: validate with the same bounds → recompute price → `deliverOnce` keyed
   by `event_id` (mark **after** success) → durable sinks first; answer
   `leadAccepted: true` as soon as one durable sink took it; customer e-mail and
   notifications best-effort, reported in their own fields (`emailDelivered`).
5. Track with `createStepTracker`
   (`push: (e) => (window.dataLayer ? window.dataLayer.push(e) : false)` —
   `false` means "not sent" and keeps the event retryable) and register the GA4
   custom dimensions.
6. Copy the matching tests from `tests/` and add site-specific cases for each
   branch combination the UI offers.

## When auditing

Walk `references/audit-checklist.md` — it lists the exact greps, the manual
repro for each invariant, and the GA4/GTM checks (container live? tag forwards
the params? custom dimensions registered? event counts plausible: opened ≥ step
users ≥ submitted). Report per invariant: ÉRINTETT / RÉSZBEN / NEM ÉRINTETT,
with file:line, and verify every HIGH claim yourself before reporting.

## Running the tests

```bash
cd lead-gen-calculator && npm ci && npm run test:ci
```
