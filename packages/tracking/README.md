# @leadgen/tracking

Zero-cost conversion tracking Astro integration for lead generation websites.

## Features

- **GTM Integration** - Google Tag Manager with Cloudflare Gateway support
- **Enhanced Conversions** - User data hashing for better attribution
- **Consent-Aware** - CookieYes integration, GDPR compliant
- **GCLID Persistence** - Safari ITP bypass with localStorage
- **Deduplication** - Prevents duplicate conversion tracking
- **View Transitions** - Full Astro View Transitions support
- **Meta CAPI Ready** - Cloudflare Zaraz integration

## Architecture

```
User Browser
    │
    ├─► CookieYes (consent) ──► cookieyes_consent_update event
    │
    ├─► GTM (via CF Gateway) ──► GA4 + Google Ads
    │
    └─► Zaraz (CF edge) ──► Meta CAPI (server-side)
```

## Installation

```bash
npm install @leadgen/tracking
```

## Quick Start

### 1. Add the Integration

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tracking from '@leadgen/tracking';

export default defineConfig({
  integrations: [
    tracking({
      gtmId: 'GTM-XXXXXXX',     // Required
      gclidPersistDays: 90,     // Optional (default: 90)
      debug: false,             // Optional (default: false)
    })
  ]
});
```

### 2. Track Conversions

```typescript
// In your form component
import { trackConversion, getFormTrackingData } from '@leadgen/tracking/client';

async function handleSubmit(formData: FormData) {
  // Track conversion (consent-aware, deduplicated)
  const result = trackConversion({
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    value: 150,
    currency: 'GBP',
    formId: 'contact-form'
  });

  if (result.duplicate) {
    console.warn('Conversion already tracked');
    return;
  }

  // Add tracking data to form
  const trackingData = getFormTrackingData();
  formData.set('gclid', trackingData.gclid);
  formData.set('event_id', result.eventId);

  // Submit form
  await fetch('/api/lead', { method: 'POST', body: formData });
}
```

## API Reference

### Integration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `gtmId` | `string` | - | **Required.** GTM container ID |
| `gclidPersistDays` | `number` | `90` | Days to persist GCLID in localStorage |
| `debug` | `boolean` | `false` | Enable console logging |

### Client API

#### Conversion Tracking

```typescript
import { trackConversion } from '@leadgen/tracking/client';

const result = trackConversion({
  email: 'user@example.com',    // Required
  phone: '+441234567890',       // Optional
  firstName: 'John',            // Optional
  lastName: 'Doe',              // Optional
  value: 150,                   // Optional
  currency: 'GBP',              // Optional (default: GBP)
  formId: 'calculator',         // Optional
  transactionId: 'custom-id',   // Optional (auto-generated if not provided)
});

// Result:
// {
//   success: boolean,
//   eventId: string,
//   gclid: string | null,
//   consentBlocked: boolean,
//   duplicate: boolean
// }
```

#### Phone Click Tracking

```typescript
import { trackPhoneClick } from '@leadgen/tracking/client';

<a
  href="tel:+441234567890"
  onclick={() => trackPhoneClick('+441234567890')}
>
  Call Us
</a>
```

#### CTA Click Tracking

```typescript
import { trackCtaClick } from '@leadgen/tracking/client';

<button onclick={() => trackCtaClick('hero-cta', 'Get Free Quote')}>
  Get Free Quote
</button>
```

#### Form Interaction Tracking

```typescript
import { trackFormStart, trackFormSubmit } from '@leadgen/tracking/client';

// Track first interaction
input.addEventListener('focus', () => trackFormStart('contact-form'), { once: true });

// Track submission (for non-conversion forms)
trackFormSubmit('newsletter-form');
```

#### Consent Checking

```typescript
import {
  hasMarketingConsent,
  hasAnalyticsConsent,
  onConsentChange,
  waitForConsent
} from '@leadgen/tracking/client';

// Check current consent
if (hasMarketingConsent()) {
  // Safe to track conversions
}

// Listen for changes
onConsentChange((consent) => {
  console.log('Consent updated:', consent);
});

// Wait for consent
await waitForConsent('marketing', 5000); // 5s timeout
```

#### Tracking Parameters

```typescript
import {
  getGclid,
  getTrackingParams,
  getFormTrackingData,
  persistTrackingParams
} from '@leadgen/tracking/client';

// Get GCLID (URL priority, localStorage fallback)
const gclid = getGclid();

// Get all stored params
const params = getTrackingParams();
// { gclid, fbclid, utm_source, utm_medium, ... }

// Get data for hidden form fields
const formData = getFormTrackingData();

// Manually persist (usually done automatically)
persistTrackingParams(90); // 90 days TTL
```

## Event Naming Convention

| Event | Trigger | GTM Tag | Dedup? |
|-------|---------|---------|--------|
| `page_view` | Page load | GA4 Page View | No |
| `conversion` | Form submit | GA4 Event + Google Ads | **Yes** |
| `form_start` | First interaction | GA4 Event | No |
| `phone_click` | tel: link | GA4 Event + Google Ads | **Yes** |
| `cta_click` | CTA button | GA4 Event | No |

## DataLayer Format

```javascript
// Conversion event (Enhanced Conversions + Dedup)
{
  event: 'conversion',
  transaction_id: 'uuid-here',  // REQUIRED for deduplication
  user_provided_data: {
    email: 'user@example.com',
    phone_number: '+441234567890'
  },
  value: 150,
  currency: 'GBP',
  form_id: 'calculator'
}

// Simple event
{
  event: 'cta_click',
  cta_id: 'hero-cta',
  cta_text: 'Get Free Quote'
}
```

## GTM Setup

### Required Tags

1. **GA4 Configuration Tag**
   - Measurement ID from GA4
   - Trigger: All Pages

2. **GA4 Event - Conversion**
   - Event name: `conversion`
   - Trigger: Custom Event = `conversion`
   - Enable Enhanced Conversions

3. **Google Ads Conversion**
   - Conversion ID + Label from Google Ads
   - Trigger: Custom Event = `conversion`
   - Use `{{transaction_id}}` for deduplication

### Required Variables

- `{{DLV - transaction_id}}` - Data Layer Variable: `transaction_id`
- `{{DLV - user_provided_data}}` - Data Layer Variable: `user_provided_data`
- `{{DLV - value}}` - Data Layer Variable: `value`
- `{{DLV - currency}}` - Data Layer Variable: `currency`

## Cloudflare Setup

### Google Tag Gateway

```
Cloudflare Dashboard → [domain] → Speed → Optimization → Google Tag Gateway → Enable
```

This proxies GTM through Cloudflare, bypassing ad blockers.

### Zaraz Meta Pixel (Server-Side)

```
Cloudflare Dashboard → Zaraz → Tools → Add → Facebook Pixel
├── Pixel ID: [from Meta]
├── Access Token: [from Meta Events Manager]
└── Server-Side: ✅ Enabled
```

Meta events are automatically synced via `window.zaraz.track()`.

## Testing

1. **GTM Preview Mode** - Test all events before publishing
2. **GA4 DebugView** - Real-time event verification
3. **Browser Console** - `window.dataLayer` inspection
4. **Zaraz Debug** - `window.zaraz` object inspection
5. **Dedup Test** - Submit same form twice, second should be blocked

## Troubleshooting

### Events not firing

1. Check consent: `hasMarketingConsent()` in console
2. Check dataLayer: `window.dataLayer` in console
3. Enable debug mode: `tracking({ debug: true })`

### Duplicate conversions

- Each conversion needs a unique `transaction_id`
- The integration auto-generates UUIDs if not provided
- Check `isConversionTracked(eventId)` before manual tracking

### GCLID not persisting

- Check localStorage: `localStorage.getItem('leadgen_tracking')`
- Verify marketing consent is granted
- Safari Private Mode disables localStorage

## License

MIT
