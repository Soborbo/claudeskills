---
name: zero-cost-tracking
description: Zero-cost conversion tracking for Astro.js lead gen sites. Uses @leadgen/conversion-tracking package. GTM + GA4 + Google Ads Enhanced Conversions + Meta CAPI (via Zaraz). First/last touch attribution, Safari ITP bypass, consent-aware. Replaces Stape ($100/mo) with Cloudflare free tier.
---

# Zero-Cost Tracking

Conversion tracking for lead gen sites using `@leadgen/conversion-tracking` package.

## When To Use

- Lead gen site with Google Ads + GA4 + Meta tracking
- Calculator, contact form, or callback conversions
- Need Enhanced Conversions for Safari/iOS
- Need first + last touch UTM attribution
- Consent-aware tracking (GDPR compliant)

## Does NOT Handle

- Cross-domain tracking
- Ecommerce / product tracking
- A/B test tracking
- Real-time dashboards

## Architecture

```
Cloudflare Edge:
├── Google Tag Gateway (proxies GTM, bypasses ad blockers)
└── Zaraz (Meta CAPI server-side)

Browser:
├── dataLayer.push() → GTM → GA4 + Google Ads
├── zaraz.track() → Meta CAPI
└── fetch('/api/lead') → Sheets
```

## Installation

```bash
npm install @leadgen/conversion-tracking
```

## Setup

### 1. Add to astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';
import tracking from '@leadgen/conversion-tracking';

export default defineConfig({
  integrations: [
    tracking({
      gtmId: 'GTM-XXXXXXX',     // Required
      currency: 'GBP',          // Optional (default: GBP)
      sessionTimeoutMinutes: 30, // Optional (default: 30)
      debug: false,             // Optional
    })
  ]
});
```

This auto-injects GTM and initializes tracking on every page.

### 2. Track Form Conversions

```typescript
import { trackConversion, buildSheetsPayload } from '@leadgen/conversion-tracking/client';

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
  const result = trackConversion('quote_request', {
    email,
    phone,
    value: calculatedQuote,
    currency: 'GBP',
  });

  // 4. Send to Sheets (use crm-integrations skill)
  const payload = buildSheetsPayload({
    eventType: 'quote_request',
    name: formData.get('name') as string,
    email,
    phone,
    value: calculatedQuote,
  });

  await fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // 5. Redirect
  window.location.href = '/thank-you';
}
```

### 3. Phone Links

```astro
---
import PhoneLink from '@leadgen/conversion-tracking/components/PhoneLink.astro';
---

<!-- Header/footer - no value -->
<PhoneLink phone="+447123456789">Call us</PhoneLink>

<!-- Calculator page - with quote value -->
<PhoneLink phone="+447123456789" value={calculatedQuote} currency="GBP">
  Call for this quote
</PhoneLink>
```

### 4. Calculator Events

```typescript
import {
  pushCalculatorStart,
  pushCalculatorStep,
  pushCalculatorOption
} from '@leadgen/conversion-tracking/client';

// When calculator loads
pushCalculatorStart();

// When user advances to step
pushCalculatorStep(2);

// When user selects option
pushCalculatorOption('bedrooms', '3');
```

### 5. Form Abandonment

```typescript
import { pushFormAbandon } from '@leadgen/conversion-tracking/client';

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
      }, 60000);
    }
  }
});

form.addEventListener('submit', () => clearTimeout(abandonTimeout));
```

## Events Matrix

| Event | GA4 | GAds | Meta | Sheets | Attribution |
|-------|:---:|:----:|:----:|:------:|:-----------:|
| phone_click | yes | yes | yes | - | no |
| quote_request | yes | yes | yes | yes | yes |
| callback_request | yes | yes | yes | yes | yes |
| contact_form | yes | yes | yes | yes | yes |
| calculator_start | yes | - | - | - | no |
| calculator_step | yes | - | - | - | no |
| calculator_option | yes | - | - | - | no |
| form_abandon | yes | - | - | - | no |

## DataLayer Events

### Conversion Events (with attribution)

```typescript
dataLayer.push({
  event: 'quote_request',
  lead_id: 'LD-2025-01-15-abc',
  tracking_version: 'v2.0',
  session_id: 'sess_abc123',
  page_url: '/calculator',
  device: 'mobile',
  user_email: 'test@example.com',
  user_phone: '+447123456789',
  value: 450,
  currency: 'GBP',
  // First touch
  first_utm_source: 'google',
  first_utm_medium: 'cpc',
  first_utm_campaign: 'removal-bristol',
  first_gclid: 'CjwKCAiA...',
  // Last touch
  last_utm_source: 'google',
  last_utm_medium: 'cpc',
  last_gclid: 'CjwKCAiA...',
});
```

### Calculator Events (minimal)

```typescript
dataLayer.push({
  event: 'calculator_step',
  step: 2,
  tracking_version: 'v2.0',
  session_id: 'sess_abc123',
});
```

## Sheets Payload

`buildSheetsPayload()` returns:

| Field | Type | Example |
|-------|------|---------|
| lead_id | string | LD-2025-01-15-abc |
| event_type | string | quote_request |
| submitted_at | ISO datetime | 2025-01-15T14:32:00Z |
| tracking_version | string | v2.0 |
| session_id | string | sess_abc123 |
| consent_state | string | analytics+marketing |
| source_type | string | paid |
| name, email, phone | string | ... |
| value, currency | number, string | 450, GBP |
| first_utm_*, last_utm_* | string | ... |
| first_gclid, last_gclid | string | ... |
| idempotency_key | string | hash for dedupe |

## GTM Setup

Create these in GTM:

### Variables (Data Layer)
- DLV - value, currency, lead_id, session_id
- DLV - user_email, user_phone, device, page_url
- DLV - first_utm_source, first_utm_medium, first_gclid
- DLV - last_utm_source, last_utm_medium, last_gclid
- User Provided Data (email + phone for Enhanced Conversions)

### Triggers (Custom Event)
- phone_click, quote_request, callback_request, contact_form
- calculator_start, calculator_step, calculator_option, form_abandon

### Tags
- CookieYes CMP (Consent Init)
- Conversion Linker (Initialization, requires ad_storage)
- Google Tag (All Pages, requires analytics_storage)
- GA4 Event tags for each event
- Google Ads Conversion tags with Enhanced Conversions

GTM variables should have "Data Layer Variable" type with auto-event variable name matching the event property.

## Cloudflare Setup

### Google Tag Gateway
```
Cloudflare → [domain] → Speed → Optimization → Google Tag Gateway → Enable
```

### Zaraz (Meta CAPI)
```
Cloudflare → [domain] → Zaraz → Tools → Facebook Pixel

Settings:
- Pixel ID: [from Meta]
- Access Token: [from Meta] ← ONLY HERE, never in code!
- Server-side: Enabled

Triggers:
- phone_click → Lead
- quote_request → Lead
- callback_request → Lead
- contact_form → Lead
```

For Zaraz trigger setup, match each event name to track a corresponding Meta Lead event.

## Key Behaviors

- **Session**: localStorage + 30min inactivity timeout, same across tabs
- **Phone dedupe**: Once per session, page reload allows new fire
- **Attribution**: First touch never overwritten, last touch always updated
- **View Transitions**: Auto re-captures params on navigation

## Core Rules

1. **GTM is authority** — consent.ts is read-only helper
2. **localStorage safety** — Package handles try/catch for Safari
3. **Form order** — reportValidity() → preventDefault() → track → redirect
4. **Attribution on conversions only** — calculator events minimal
5. **Meta token in Zaraz only** — NEVER in code or env vars

## Related Skills

- **crm-integrations** — For Sheets webhook + retry queue
- **astro-forms** — For form validation patterns

## Forbidden

- Meta Access Token in code
- Blocking form on tracking failure
- Attribution data on calculator events
- Overriding GTM consent from JavaScript
