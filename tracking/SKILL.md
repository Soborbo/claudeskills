---
name: soborbo-tracking
description: >-
  Lead gen tracking for Astro.js on Cloudflare Workers. Drop-in components:
  <Tracking />, <TrackedForm />, <PhoneLink />, <CallbackButton />.
  GA4, Meta Pixel + CAPI (server-side via Worker endpoint), Google Ads
  Enhanced Conversions. Calculator funnel, form abandonment, phone dedup,
  first/last touch attribution, scroll depth, sessions, consent (CookieYes),
  debug mode. Discriminated Zod schema, origin check, optional HMAC token.
  No Zaraz, no Stape. £0/month.
---

# Soborbo Lead Gen Tracking v4

## When To Use

- New lead gen site needs GA4 + Meta + Google Ads
- Calculator/quiz funnel, phone/callback/contact tracking

## Consent Policy

| Action | No consent | Analytics | Marketing |
|--------|:----------:|:---------:|:---------:|
| localStorage (GCLID/UTM) | ❌ | ❌ | ✅ |
| sessionStorage (session) | ❌ | ✅ | ✅ |
| Scroll depth | ❌ | ✅ | ✅ |
| Calculator steps | ❌ | ✅ | ✅ |
| Phone click | ❌ | ✅ | ✅ |
| Callback click | ❌ | ✅ | ✅ |
| Form abandon | ❌ | ✅ | ✅ |
| Lead/contact submit | ❌ | ❌ | ✅ |
| Meta CAPI beacon | ❌ | ❌ | ✅ |
| Google Ads Enhanced Conv | ❌ | ❌ | ✅ |

Every tracking function checks consent in code. GTM Consent Mode v2
provides a second layer at the tag level.

## File Structure

```
src/
├── components/tracking/
│   ├── Tracking.astro          # <head>
│   ├── TrackingNoscript.astro  # <body> top
│   ├── TrackedForm.astro       # form wrapper
│   ├── PhoneLink.astro
│   └── CallbackButton.astro
├── lib/tracking/
│   ├── index.ts     # unified exports, beacon, debug
│   ├── events.ts    # dataLayer events, scroll, abandon
│   ├── persistence.ts  # storage, attribution, normalization
│   └── consent.ts   # CookieYes bridge
└── pages/api/
    └── track.ts     # Meta CAPI, Zod validation
```

## Quick Setup

1. Copy `assets/boilerplate/` into your `src/`
2. Add to Layout:
   ```astro
   <head>
     <Tracking gtmId="GTM-XXX" cookieYesId="abc123" />
   </head>
   <body>
     <TrackingNoscript gtmId="GTM-XXX" />
   ```
3. Enable Google Tag Gateway in Cloudflare
4. Set env vars: `META_ACCESS_TOKEN`, `META_PIXEL_ID`, `ALLOWED_ORIGINS`
5. Set up GTM (see `references/gtm-setup.md`)
6. Set `output: 'server'` in astro.config

## Usage

### Lead Form
```astro
<TrackedForm action="/api/lead" eventType="lead" contentName="Calculator">
  <input name="email" type="email" required />
  <input name="phone" type="tel" />
  <input name="price" type="hidden" value={price} />
  <button type="submit">Get Quote</button>
</TrackedForm>
```

Custom field names:
```astro
<TrackedForm emailField="user_email" phoneField="tel" valueField="quote_total" />
```

### Calculator (manual)
```typescript
import { trackCalculatorStart, trackCalculatorStep } from '@/lib/tracking';
trackCalculatorStart('removal-calculator');
trackCalculatorStep('property-size', 2, 8);
```

### Debug mode
Add `?debugTracking=1` to any URL → all events logged to console.

## TrackedForm Props

| Prop | Default | Notes |
|------|---------|-------|
| eventType | 'lead' | 'lead' or 'contact' |
| contentName | document.title | For Meta CAPI |
| emailField | 'email' | Maps your form field name |
| phoneField | 'phone' | |
| valueField | 'price' | Conversion value |
| formId | 'tracked-form' | **Must be unique if multiple forms on page** |
| abandonTimeout | 60000 | ms before form_abandon fires |

## Key Behaviors

- **Submit**: validate → prevent → track → hidden fields → wait → `form.submit()`. Guard flag prevents recursion. Submitter button name/value preserved.
- **TrackedForm assumes classic HTML form submit.** For fetch/XHR submit, use `trackLeadSubmit()` directly.
- **Session**: memory-only before analytics consent, sessionStorage after.
- **Phone dedup**: sessionStorage — survives page reload within session.
- **Attribution**: first touch never overwritten, last touch always updated.
- **URL params**: captured into memory on page load, persisted only after marketing consent.
- **Scroll**: listener cleaned up on route change (no stacking).
- **Abandon**: per-form closure state, cleanup on `astro:before-swap`.

## Server Endpoint

`/api/track.ts` — 5 security layers:

1. **32 KB payload limit**
2. **Zod discriminated union** — lead requires email, contact doesn't
3. **Origin/Referer allowlist** (`ALLOWED_ORIGINS` env var)
4. **Optional HMAC token** (`TRACK_TOKEN` env var)
5. **In-memory rate limit** (soft — supplement with Cloudflare WAF)

## Click ID (fbc) coverage

The Pixel-set `_fbc` cookie only exists **after marketing consent runs**.
A user who lands with `?fbclid=…`, doesn't accept the banner immediately,
navigates, then submits a form arrives at the server with `_fbc = null` —
even though the click came from Meta. Meta's CAPI EMQ diagnostic flags
this as low Click ID coverage (often 0%), with up to 0.7 EMQ score lost.

`getFbc()` in `persistence.ts` closes this:
- Cookie wins when present (canonical Pixel value).
- Otherwise reconstruct: `fb.1.<fbclidAt>.<fbclid>`, where `fbclidAt`
  is captured the **first time** fbclid is persisted (re-stamping on
  every persist would drift the timestamp away from the actual click).
- Subdomain index `1` is correct for apex-domain cookies (most sites).

**Don't try to "patch" `_fbc` cookie ourselves** (`document.cookie = …`)
— it conflicts with the Pixel and creates dueling values. Reconstruct
in memory at send-time only.

For projects that need pre-consent capture (lossy GDPR-strict mode is
the default in this skill), add fbclid to a non-consent inline IIFE that
writes localStorage on every pageload. This is a per-project legal call;
the skill stays consent-first.

## Meta CAPI custom_data invariants

`value` handling is **event-type-aware**, not a blanket "always send 1":

- **Lead / ViewContent** are revenue-relevant. Meta's
  `s2s_invalid_custom_data_value` diagnostic flags missing `value`, and
  attribution / Smart Bidding suffers. Callsites must always pass a real
  monetary value. The `/api/track` endpoint keeps a token `1` fallback
  *only* for Lead as a regression safety net — never as a normal path.
- **Contact** is naturally value-less for many flows (a `tel:` click
  without a quote has no monetary amount). Faking `value: 1` here would
  poison value-based Smart Bidding — Meta would optimise for "cheap
  leads" and crush ad performance. The endpoint omits `value` entirely
  when the client didn't send one.

Browser-side (GTM Meta Pixel tags) follows the same rule: when the tag
template references `{{DLV - value}}`, gate it with a runtime check so
standalone clicks don't render `value: undefined, currency: 'undefined'`:

```js
var v = {{DLV - value}};
var cd = (typeof v === 'number' && v > 0)
  ? { value: v, currency: '{{DLV - currency}}' }
  : {};
fbq('track', 'Contact', cd, { eventID: '{{DLV - event_id}}' });
```

**Don't set GTM DLV defaults to 1+HUF** — that propagates fake values to
every Pixel call AND every Google Ads conversion tag, polluting bidding
across the whole stack. Use the conditional template instead.

Currency: pass `currency` whenever you pass a meaningful `value`. Default
is `GBP` (override via `DEFAULT_CURRENCY` env var per project — e.g. HUF
for HU sites).

## Normalization

Single canonical normalizer used everywhere (dataLayer, hidden fields, Meta CAPI, Sheets):
- Email: lowercase, trimmed, max 254 chars
- Phone: formatting stripped, UK 07→+44, HU 06→+36, max 20 chars
- Names: trimmed, max 100 chars

## Env Vars

```
META_ACCESS_TOKEN  = EAA...    (encrypted, production)
META_PIXEL_ID      = 123456789
ALLOWED_ORIGINS    = https://example.com,https://www.example.com
DEFAULT_CURRENCY   = GBP        (optional; HUF/EUR/USD per project)
TRACK_TOKEN        = random-secret-here  (optional)
TRACKING_SHEETS_WEBHOOK = https://script.google.com/...  (optional)
```

## Limitations

- Rate limiting is in-memory (resets on cold start). Use Cloudflare WAF for real protection.
- sendBeacon is best-effort (browser queues but delivery not guaranteed).
- Google Tag Gateway helps reduce some ad blocker impact, not all.
- localStorage survives Safari ITP (which targets cookies), but not all privacy tools.
- 600ms tracking wait is best-effort, not a guarantee.
- TrackedForm uses `form.submit()` which does not pass submitter info natively — the component works around this with a hidden field, but test if you have complex multi-button logic.

## Integration with astro-forms Skill

This skill provides client-side tracking. The **astro-forms** skill provides the server-side form pipeline. When used together:

1. `<TrackedForm>` wraps the form (this skill)
2. On submit: `trackLeadSubmit()` fires dataLayer event + Meta CAPI beacon to `/api/track`
3. Hidden fields (`event_id`, `gclid`, UTM) are populated
4. Native form POST goes to `/api/submit` (astro-forms skill)
5. `event_id` links the conversion event to the lead record in Sheets

Both `/api/track` and `/api/submit` are separate endpoints with separate env vars.

## References

- `references/gtm-setup.md`
- `references/cloudflare-setup.md`
- `references/testing.md`
