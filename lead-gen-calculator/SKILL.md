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
| H | Conversions and "quote viewed" fire **once per entity** (quote/event id) via localStorage → sessionStorage → memory, and only **after** the server accepted the lead. | `once-guard.ts`, `submit-guard.ts` |
| I | Every form (calculator, callback, contact, quote-page callback) sends the same attribution set; ≤1 Google click id (gclid > gbraid > wbraid) from **one** source; storage access never throws into submit. | `attribution.ts` |
| J | Funnel events: `quote_calculator_opened` once per session (not behind a consent timeout that drops it); `quote_calculator_step_completed` on **forward completion**, once per step — not on render/back/restore; `value` is always numeric, choices go to `option_value`; GA4 custom dimensions exist for `step_id`, `option_value`, `calculator_name`. | `step-tracker.ts` |
| K | The server **recomputes the price** from answers with the shared pricing module; that value goes to CRM, e-mail, Sheets and conversion `value`. Dedupe: check before delivery, **mark after success**. A lead stored in any durable sink is a success even if the notification mail failed. | `server-price.ts`, `dedupe.ts` |
| L | No silent failure: never `fetch().catch(()=>{})`; never show "we e-mailed you" before a 2xx; every gate shows a message; allowlist/maintenance gates normalise the path and keep the query string. | `submit-guard.ts`, `path-gate.ts` |

## When building or changing a calculator

1. Put pricing + answer→items logic in a **pure TS module** shared by the page
   script and the API route. Describe branches with a `BranchSpec`.
2. Define bounds once (`BoundsSpec`) and generate input attributes from it.
3. Submit through `createSubmitGuard`; push the conversion in `onSuccess` with
   the guard's `event_id`; send the same `event_id` to the server for dedupe and
   Pixel↔CAPI dedup.
4. Server: validate with the same bounds → recompute price → `deliverOnce` keyed
   by `event_id` → durable sinks first, e-mail best-effort.
5. Track with `createStepTracker`; register the GA4 custom dimensions.
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
