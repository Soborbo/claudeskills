---
name: zero-cost-tracking
version: "2.0"
description: Zero-cost conversion tracking for Astro.js lead generation sites. Handles Google Ads Enhanced Conversions, Meta CAPI (via Zaraz), GA4, Safari ITP bypass, form/phone/calculator tracking with first+last touch attribution. Consent-aware (CookieYes via GTM), server-side Sheets integration, idempotent submissions. Replaces Stape ($100/mo) with Cloudflare free tier.
---

# Zero-Cost Tracking v2

Production-ready conversion tracking for Astro.js lead gen sites. £0/month.

## When To Use

- Lead gen site with calculator, contact form, callback request
- Google Ads + GA4 + Meta CAPI tracking
- Enhanced Conversions for Safari/iOS attribution
- First + last touch UTM attribution
- Consent-aware tracking (GDPR compliant)

## What This Skill Does NOT Do

- Cross-domain tracking (rare, separate solution)
- CRM integration (Sheets = lightweight CRM)
- User stitching without login
- Offline conversion import (see Upgrade Path)
- A/B test tracking
- Ecommerce / product tracking
- Real-time dashboards

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │  Google Tag     │         │     Zaraz       │           │
│  │  Gateway        │         │                 │           │
│  │  ┌───────────┐  │         │  ┌───────────┐  │           │
│  │  │    GTM    │  │         │  │ Meta CAPI │  │           │
│  │  │  GA4      │  │         │  │ (server)  │  │           │
│  │  │  GAds     │  │         │  └───────────┘  │           │
│  │  │  CookieYes│  │         │                 │           │
│  │  └───────────┘  │         └─────────────────┘           │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
            ▲ dataLayer.push()          ▲ zaraz.track()
            │                           │
┌───────────┴───────────────────────────┴─────────────────────┐
│                       BROWSER                               │
│  Form Submit:                                               │
│  1. dataLayer.push() → GTM (GA4 + GAds + Enhanced Conv)    │
│  2. zaraz.track() → Meta CAPI                              │
│  3. fetch('/api/lead') → Sheets (with retry queue)         │
└─────────────────────────────────────────────────────────────┘
```

## Events Matrix

| Event | GA4 | GAds | Meta CAPI | Sheets | Attribution |
|-------|:---:|:----:|:---------:|:------:|:-----------:|
| phone_click | yes | yes | yes | - | - |
| callback_request | yes | yes | yes | yes | yes |
| quote_request | yes | yes | yes | yes | yes |
| contact_form | yes | yes | yes | yes | yes |
| calculator_start | yes | - | - | - | - |
| calculator_step | yes | - | - | - | - |
| calculator_option | yes | - | - | - | - |
| form_abandon | yes | - | - | - | - |

## Data Flow

| Data | localStorage | dataLayer | GA4 | Sheets | GAds EC |
|------|:------------:|:---------:|:---:|:------:|:-------:|
| first_utm_* | yes | yes* | yes* | yes | - |
| last_utm_* | yes | yes* | yes* | yes | - |
| first_gclid | yes | yes* | yes* | yes | yes |
| last_gclid | yes | yes* | yes* | yes | yes |
| first_fbclid | yes | yes* | yes* | yes | - |
| email | - | yes | - | yes | yes (hash) |
| phone | - | yes | - | yes | yes (hash) |
| value/currency | - | yes | yes | yes | yes |
| session_id | localStorage | yes | yes | yes | - |
| source_type | - | - | - | yes | - |
| consent_state | - | - | - | yes | - |

*Only on conversion events (quote_request, callback_request, contact_form)

## Quick Start

1. Copy `references/tracking/` to `src/lib/tracking/`
2. Copy `references/components/` to `src/components/tracking/`
3. Copy `references/api/lead.ts` to `src/pages/api/lead.ts`
4. Enable Google Tag Gateway in Cloudflare
5. Configure Zaraz with Meta Pixel
6. Import GTM container or set up manually
7. Add GTM snippet + TrackingInit to layout

## File Structure

```
src/
├── lib/tracking/
│   ├── index.ts          # Unified exports + trackConversion()
│   ├── constants.ts      # TRACKING_VERSION, STORAGE_KEYS, EVENT_NAMES
│   ├── storage.ts        # Safari-safe localStorage wrapper
│   ├── params.ts         # First + Last touch capture
│   ├── session.ts        # Session ID (localStorage + 30min timeout)
│   ├── source-type.ts    # paid/organic/direct/owned classification
│   ├── dataLayer.ts      # GTM events
│   ├── zaraz.ts          # Meta CAPI via Zaraz
│   ├── consent.ts        # CookieYes read-only helper
│   └── idempotency.ts    # Client-side key generation
├── components/tracking/
│   ├── GTM.astro         # GTM snippet (head + body)
│   ├── TrackingInit.astro # Page load + View Transitions
│   └── PhoneLink.astro   # Tracked tel: link with dedupe
└── pages/api/
    └── lead.ts           # Sheets webhook (idempotent)
```

## Env Variables

```bash
# Required
GTM_ID=GTM-XXXXXXX
GOOGLE_SHEETS_WEBHOOK=https://script.google.com/...
TURNSTILE_SECRET_KEY=0x...

# Optional (defaults shown)
PUBLIC_SITE_CURRENCY=GBP

# NOT needed as env (managed elsewhere)
# GA4_ID → GTM
# GOOGLE_ADS_ID → GTM
# META_PIXEL_ID → Zaraz dashboard
# META_ACCESS_TOKEN → Zaraz dashboard (NEVER in code!)
# COOKIEYES_ID → GTM
```

## Implementation

### 1. Layout Setup

```astro
---
// src/layouts/Layout.astro
import GTM from '@/components/tracking/GTM.astro';
import TrackingInit from '@/components/tracking/TrackingInit.astro';
---
<html>
  <head>
    <GTM position="head" />
  </head>
  <body>
    <GTM position="body" />
    <TrackingInit />
    <slot />
  </body>
</html>
```

### 2. Phone Link

```astro
---
import PhoneLink from '@/components/tracking/PhoneLink.astro';
---
<!-- Header/footer - no value -->
<PhoneLink phone="+447123456789">Call us</PhoneLink>

<!-- Calculator page - with value -->
<PhoneLink phone="+447123456789" value={calculatedQuote}>
  Call for this quote
</PhoneLink>
```

### 3. Form Submit

```typescript
import {
  trackConversion,
  buildSheetsPayload,
  generateIdempotencyKey,
  submitLead,
} from '@/lib/tracking';

async function handleSubmit(e: SubmitEvent) {
  const form = e.target as HTMLFormElement;

  // 1. Validate FIRST
  if (!form.reportValidity()) return;

  // 2. Prevent default
  e.preventDefault();

  const formData = new FormData(form);
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;

  // 3. Track conversion (GTM + Zaraz)
  trackConversion('quote_request', {
    email,
    phone,
    value: calculatedQuote,
  });

  // 4. Send to Sheets (with retry queue)
  await submitLead({
    eventType: 'quote_request',
    name: formData.get('name') as string,
    email,
    phone,
    value: calculatedQuote,
  });

  // 5. Redirect to thank you page
  window.location.href = '/thank-you';
}
```

### 4. Calculator Step Tracking

```typescript
import {
  pushCalculatorStart,
  pushCalculatorStep,
  pushCalculatorOption
} from '@/lib/tracking';

// When calculator loads
pushCalculatorStart();

// When user advances to step
pushCalculatorStep(2);

// When user selects option
pushCalculatorOption('bedrooms', '3');
```

### 5. Form Abandonment

```typescript
import { pushFormAbandon } from '@/lib/tracking';

let lastField = '';
let formStarted = false;
let abandonTimeout: number;

form.addEventListener('focusin', (e) => {
  const field = (e.target as HTMLElement).getAttribute('name');
  if (field) {
    lastField = field;
    if (!formStarted) {
      formStarted = true;
      abandonTimeout = window.setTimeout(() => {
        pushFormAbandon('quote', lastField);
      }, 60000); // 60 seconds
    }
  }
});

form.addEventListener('submit', () => {
  clearTimeout(abandonTimeout);
});
```

## Session Management

Sessions use localStorage with 30-minute inactivity timeout:

```typescript
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Same session across tabs
// New session after 30min inactivity
// New session after browser close + 30min
```

## Phone Click Deduplication

Phone clicks are deduplicated per session (memory-based):

```typescript
// First click in session → fires event
// Second click in session → skipped (logged)
// Page reload → can fire again (new intent)
```

## Sheets Failure Handling

Three-tier resilience:

```
1. fetch() with 5s timeout
   ↓ (if fails)
2. Queue to localStorage (max 10 items)
   ↓ (always)
3. sendBeacon() as fire-and-forget backup

On next page load:
→ Retry queued items via sendBeacon()
→ Clear queue
```

## Cloudflare Setup

### Google Tag Gateway

```
Cloudflare Dashboard
  → [domain]
  → Speed
  → Optimization
  → Google Tag Gateway
  → Enable
```

### Zaraz

```
Cloudflare Dashboard
  → [domain]
  → Zaraz
  → Tools
  → Add new tool
  → Facebook Pixel

Settings:
  ├── Pixel ID: [from Meta Events Manager]
  ├── Access Token: [from Meta Events Manager] ⚠️ ONLY HERE
  └── Enable Server-side: yes

Triggers (add for each):
  ├── phone_click → Lead event
  ├── callback_request → Lead event
  ├── quote_request → Lead event
  └── contact_form → Lead event

Consent:
  └── Marketing tools require: marketing consent
```

## GTM Setup

See [references/gtm/SETUP.md](references/gtm/SETUP.md) for detailed instructions.

### Variables (20)

| Name | Type | Key |
|------|------|-----|
| DLV - value | Data Layer | value |
| DLV - currency | Data Layer | currency |
| DLV - lead_id | Data Layer | lead_id |
| DLV - session_id | Data Layer | session_id |
| DLV - step | Data Layer | step |
| DLV - field | Data Layer | field |
| DLV - user_email | Data Layer | user_email |
| DLV - user_phone | Data Layer | user_phone |
| DLV - device | Data Layer | device |
| DLV - page_url | Data Layer | page_url |
| DLV - first_utm_source | Data Layer | first_utm_source |
| DLV - first_utm_medium | Data Layer | first_utm_medium |
| DLV - first_utm_campaign | Data Layer | first_utm_campaign |
| DLV - first_gclid | Data Layer | first_gclid |
| DLV - last_utm_source | Data Layer | last_utm_source |
| DLV - last_utm_medium | Data Layer | last_utm_medium |
| DLV - last_utm_campaign | Data Layer | last_utm_campaign |
| DLV - last_gclid | Data Layer | last_gclid |
| DLV - last_field | Data Layer | last_field |
| User Provided Data | User-Provided Data | email + phone |

### Triggers (8)

| Name | Event |
|------|-------|
| phone_click | phone_click |
| callback_request | callback_request |
| quote_request | quote_request |
| contact_form | contact_form |
| calculator_start | calculator_start |
| calculator_step | calculator_step |
| calculator_option | calculator_option |
| form_abandon | form_abandon |

### Tags (15)

| Name | Type | Trigger | Consent |
|------|------|---------|---------|
| CookieYes CMP | Template | Consent Init | - |
| Conversion Linker | Linker | Initialization | ad_storage |
| Google Tag | Config | All Pages | analytics_storage |
| GA4 - phone_click | Event | phone_click | analytics_storage |
| GA4 - callback_request | Event | callback_request | analytics_storage |
| GA4 - quote_request | Event | quote_request | analytics_storage |
| GA4 - contact_form | Event | contact_form | analytics_storage |
| GA4 - calculator_start | Event | calculator_start | analytics_storage |
| GA4 - calculator_step | Event | calculator_step | analytics_storage |
| GA4 - calculator_option | Event | calculator_option | analytics_storage |
| GA4 - form_abandon | Event | form_abandon | analytics_storage |
| GAds - phone_click | Conversion | phone_click | ad_storage, ad_user_data |
| GAds - callback_request | Conversion | callback_request | ad_storage, ad_user_data |
| GAds - quote_request | Conversion | quote_request | ad_storage, ad_user_data |
| GAds - contact_form | Conversion | contact_form | ad_storage, ad_user_data |

## DataLayer Contract

```typescript
// REQUIRED fields marked with *

// ═══════════════════════════════════════════════════════════
// PHONE CLICK (minimal - no attribution)
// ═══════════════════════════════════════════════════════════
dataLayer.push({
  event: 'phone_click',           // *
  page_url: '/calculator',        // *
  device: 'mobile',               // * 'mobile' | 'desktop' | 'tablet'
  tracking_version: 'v2.0',       // *
  session_id: 'sess_abc123',      // *
  value: 450,                     // optional (0 if not from calculator)
  currency: 'GBP',                // optional (PUBLIC_SITE_CURRENCY default)
});

// ═══════════════════════════════════════════════════════════
// FORM SUBMISSIONS (full attribution)
// ═══════════════════════════════════════════════════════════
dataLayer.push({
  event: 'quote_request',         // * 'quote_request' | 'callback_request' | 'contact_form'
  lead_id: 'LD-2025-01-15-abc',   // *
  page_url: '/calculator',        // *
  device: 'mobile',               // *
  tracking_version: 'v2.0',       // *
  session_id: 'sess_abc123',      // *
  user_email: 'test@example.com', // * (for Enhanced Conversions)
  user_phone: '+447123456789',    // * (for Enhanced Conversions)
  value: 450,                     // optional
  currency: 'GBP',                // optional

  // First touch (if consent was accepted on first visit)
  first_utm_source: 'google',
  first_utm_medium: 'cpc',
  first_utm_campaign: 'removal-bristol',
  first_utm_term: 'house removal',
  first_utm_content: 'hero-cta',
  first_gclid: 'CjwKCAiA...',
  first_fbclid: 'fb.1.1234...',
  first_referrer: 'google.com',

  // Last touch (if different from first)
  last_utm_source: 'google',
  last_utm_medium: 'cpc',
  last_utm_campaign: 'removal-bristol',
  last_utm_term: 'house removal',
  last_utm_content: 'hero-cta',
  last_gclid: 'CjwKCAiA...',
  last_fbclid: 'fb.1.1234...',
});

// ═══════════════════════════════════════════════════════════
// CALCULATOR EVENTS (minimal - no attribution)
// ═══════════════════════════════════════════════════════════
dataLayer.push({
  event: 'calculator_start',      // *
  tracking_version: 'v2.0',       // *
  session_id: 'sess_abc123',      // *
});

dataLayer.push({
  event: 'calculator_step',       // *
  step: 2,                        // *
  tracking_version: 'v2.0',       // *
  session_id: 'sess_abc123',      // *
});

dataLayer.push({
  event: 'calculator_option',     // *
  field: 'bedrooms',              // *
  value: '3',                     // * (string - option value)
  tracking_version: 'v2.0',       // *
  session_id: 'sess_abc123',      // *
});

// ═══════════════════════════════════════════════════════════
// FORM ABANDONMENT (minimal)
// ═══════════════════════════════════════════════════════════
dataLayer.push({
  event: 'form_abandon',          // *
  form_id: 'quote',               // *
  last_field: 'email',            // *
  tracking_version: 'v2.0',       // *
  session_id: 'sess_abc123',      // *
});
```

## Sheets Columns

| Column | Type | Required | Example |
|--------|------|:--------:|---------|
| lead_id | string | yes | LD-2025-01-15-abc |
| event_type | string | yes | quote_request |
| submitted_at | ISO datetime | yes | 2025-01-15T14:32:00Z |
| tracking_version | string | yes | v2.0 |
| session_id | string | yes | sess_abc123 |
| consent_state | enum | yes | analytics+marketing |
| source_type | enum | yes | paid |
| name | string | | John Smith |
| email | string | | john@example.com |
| phone | string | | +447123456789 |
| value | number | | 450 |
| currency | string | | GBP |
| page_url | string | yes | /calculator |
| device | string | yes | mobile |
| first_utm_source | string | | google |
| first_utm_medium | string | | cpc |
| first_utm_campaign | string | | removal-bristol |
| first_utm_term | string | | house removal |
| first_utm_content | string | | hero-cta |
| first_gclid | string | | CjwKCAiA... |
| first_fbclid | string | | fb.1.1234... |
| first_referrer | string | | google.com |
| last_utm_source | string | | google |
| last_utm_medium | string | | cpc |
| last_utm_campaign | string | | removal-bristol |
| last_utm_term | string | | house removal |
| last_utm_content | string | | hero-cta |
| last_gclid | string | | CjwKCAiA... |
| last_fbclid | string | | fb.1.1234... |

### consent_state values

- `none` - no consent given
- `analytics` - only analytics
- `marketing` - only marketing
- `analytics+marketing` - both accepted

### source_type values

- `paid` - gclid/fbclid present OR utm_medium is cpc/ppc/paid
- `organic` - referrer from search engine, no paid indicators
- `owned` - utm_medium is email/newsletter/sms
- `direct` - no referrer, no UTMs

## API Idempotency

**TTL:** 24 hours
**Scope:** hash(email + event_type + date)

Duplicate submissions within 24h return existing lead_id without creating new record.

## Critical Rules

### Security

```
NEVER in code:
  - Meta Access Token
  - Webhook secrets
  - API keys

ONLY in:
  - Cloudflare Zaraz dashboard (Meta token)
  - Server-side env vars (Sheets webhook)
  - GTM (CookieYes ID, GA4 ID, Ads ID)
```

### Consent Authority

```
GTM/Zaraz = AUTHORITY (they decide when to fire)
consent.ts = READ-ONLY helper (for localStorage/UI decisions)

Never override GTM consent mode from code.
```

### localStorage Safety

```typescript
// Always wrap in try/catch for Safari private mode
try {
  localStorage.setItem(key, value);
} catch {
  // Fallback to memory-only
}
```

### Form Submit Order

```typescript
if (!form.reportValidity()) return;  // 1. Validate FIRST
e.preventDefault();                   // 2. Prevent default
trackConversion(...);                 // 3. Track (GTM + Zaraz)
await submitLead(...);                // 4. Sheets (with retry)
window.location.href = '/thank-you'; // 5. Redirect
```

## Testing

### Quick Validation

```bash
# GTM Preview mode
1. Open GTM Preview
2. Navigate to site
3. Verify events fire with correct data

# Zaraz
Cloudflare → Zaraz → Logs → Real-time

# Meta Events Manager
Events Manager → Test Events → [your pixel]

# Google Ads
Tools → Conversions → [conversion] → Diagnostics
```

### Checklist

- [ ] Banner megjelenik elso latogataskor
- [ ] "Accept all" utan: localStorage-ban van tracking adat
- [ ] "Reject all" utan: localStorage URES
- [ ] Phone click: egyszer tuzel session-onkent
- [ ] Form submit: lead megjelenik Sheets-ben
- [ ] Safari private mode: nincs localStorage error
- [ ] View Transition: params ujra capture-olodnak
- [ ] Sheets timeout: queue-ba kerul, retry next page load

## Upgrade Path

| From | To | What's Added |
|------|-----|--------------|
| v2.0 | v2.1 | Offline conversion import (Sheets → Google Ads) |
| v2.0 | v2.2 | CRM sync (HubSpot/Pipedrive webhook) |
| v2.0 | v2.3 | Cross-domain tracking (if needed) |
| v2.0 | v3.0 | Real-time BI dashboard (Looker Studio) |

## References

- [TypeScript modules](references/tracking/)
- [Astro components](references/components/)
- [API endpoint](references/api/)
- [GTM setup guide](references/gtm/SETUP.md)
- [Cloudflare setup guide](references/cloudflare/SETUP.md)
