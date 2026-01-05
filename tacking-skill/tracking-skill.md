---
name: zero-cost-tracking
description: Zero-cost conversion tracking for Astro.js lead generation sites. Use when implementing Google Ads Enhanced Conversions, Meta CAPI (via Zaraz), Safari ITP bypass, or form submission tracking. Handles consent management (CookieYes), localStorage GCLID persistence, sendBeacon delivery, and GTM dataLayer events. Replaces paid solutions like Stape ($100/mo) with free alternatives (Google Tag Gateway + Zaraz). Use for any lead gen site needing accurate attribution without server-side GTM costs.
---

# Zero-Cost Tracking

Production-ready conversion tracking for Astro.js lead gen sites. £0/month.

## When To Use

- Setting up Google Ads Enhanced Conversions
- Implementing Meta CAPI via Cloudflare Zaraz
- Safari ITP bypass (localStorage GCLID persistence)
- Form submission tracking with guaranteed delivery
- Consent-aware tracking (CookieYes/CMP integration)

## Why Not Stape/Server-Side GTM?

| Problem | Stape Solution | This Skill |
|---------|---------------|------------|
| Safari 7-day cookie | Cookie Keeper ($100/mo) | Enhanced Conversions (email match) |
| GCLID loss | Server cookie | localStorage (90 days) |
| Meta CAPI | sGTM tag | Zaraz (free) |
| Ad blockers | Custom loader | Google Tag Gateway (free) |

**Key insight:** Enhanced Conversions matches users by email/phone hash, not cookies. Safari ITP is irrelevant when you have user email.

## Architecture

```
Page Load
    │
    ├─► Consent check (CookieYes)
    │       │
    │       ▼ (if marketing consent)
    │   persistTrackingParams()
    │   └─► localStorage: GCLID, UTMs (90 days)
    │
Form Submit
    │
    ├─► reportValidity() ──► STOP if invalid
    │
    ├─► trackFullConversion()
    │       ├─► GTM dataLayer (Enhanced Conversions)
    │       └─► Zaraz (Meta CAPI)
    │
    ├─► sendBeacon() ──► /api/tracking-beacon (guaranteed)
    │
    └─► requestSubmit() (after 600ms)
```

## Quick Start

1. Copy `assets/boilerplate/` to `src/lib/tracking/`
2. Enable Google Tag Gateway in Cloudflare
3. Configure Zaraz with Meta Pixel
4. Set up GTM Enhanced Conversions
5. Add form handler to calculator

## File Structure

```
src/lib/tracking/
├── index.ts          # Unified exports
├── gclid.ts          # localStorage persistence
├── dataLayer.ts      # GTM events
├── zaraz.ts          # Meta CAPI
└── consent.ts        # CookieYes integration

src/pages/api/
└── tracking-beacon.ts  # Backup endpoint
```

## Implementation

### 1. Tracking Initialization

```typescript
import { persistTrackingParams, hasMarketingConsent, onConsentChange } from '@/lib/tracking';

document.addEventListener('astro:page-load', () => {
  onConsentChange((consent) => {
    if (consent.marketing) persistTrackingParams();
  });
  
  if (hasMarketingConsent()) persistTrackingParams();
});
```

### 2. Form Submit Handler

```typescript
import { trackFullConversion, getAllTrackingData } from '@/lib/tracking';

async function handleSubmit(e: SubmitEvent) {
  const form = e.target as HTMLFormElement;
  
  if (!form.reportValidity()) return;
  e.preventDefault();
  
  const result = trackFullConversion({
    email: formData.get('email'),
    phone: formData.get('phone'),
    value: 50,
    currency: 'GBP',
  });
  
  sendBeacon('/api/tracking-beacon', { 
    ...getAllTrackingData(),
    gclid: result.gclid 
  });
  
  await delay(600);
  form.requestSubmit();
}
```

### 3. Hidden Form Fields

```html
<input type="hidden" name="gclid" />
<input type="hidden" name="fbclid" />
<input type="hidden" name="utm_source" />
<input type="hidden" name="utm_medium" />
<input type="hidden" name="utm_campaign" />
<input type="hidden" name="transaction_id" />
```

## Cloudflare Setup

### Google Tag Gateway

```
Cloudflare → [domain] → Speed → Optimization → Google Tag Gateway → Enable
```

### Zaraz Meta Pixel

```
Cloudflare → Zaraz → Tools → Add → Facebook Pixel
├── Pixel ID: [your ID]
├── Access Token: [from Meta Events Manager] ⚠️ ONLY HERE
└── Server-Side: ✅
```

## GTM Setup

### User-Provided Data Variable

```
GTM → Variables → New
├── Type: User-Provided Data
├── Email: {{DLV - user_provided_data.email}}
└── Phone: {{DLV - user_provided_data.phone_number}}
```

### Conversion Tag

```
GTM → Tags → Google Ads Conversion
├── Include user-provided data: ✅
├── Variable: [above variable]
└── Trigger: calculator_conversion
```

### Google Ads Activation

```
Google Ads → Tools → Conversions → Settings
├── Enhanced Conversions: ON
└── Method: Google Tag Manager
```

## Critical Rules

### Security

```
❌ NEVER in code: Meta Access Token, Webhook secrets
✅ ONLY in: Cloudflare Dashboard, server-side env vars
```

### localStorage Safety

```typescript
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
```

### Form Submit Order

```typescript
if (!form.reportValidity()) return;  // 1. Validate
e.preventDefault();                   // 2. Prevent
trackFullConversion(...);             // 3. Track
sendBeacon(...);                      // 4. Beacon
await delay(600);                     // 5. Wait
form.requestSubmit();                 // 6. Submit
```

### Consent-First

```typescript
if (!hasMarketingConsent()) {
  return { success: false, consentBlocked: true };
}
pushConversion(...);
```

## References

- **TypeScript modules**: See [references/typescript-modules.md](references/typescript-modules.md)
- **Beacon API**: See [references/beacon-api.md](references/beacon-api.md)
- **GTM config**: See [references/gtm-setup.md](references/gtm-setup.md)
- **Testing**: See [references/testing.md](references/testing.md)
