# @leadgen/tracking-v2

Zero-cost conversion tracking for Astro.js lead generation sites.

## Features

- **GTM Integration** - Auto-injected Google Tag Manager
- **GA4 + Google Ads** - Enhanced Conversions support
- **Meta CAPI** - Server-side via Cloudflare Zaraz
- **First + Last Touch** - Full attribution tracking
- **Safari ITP Bypass** - localStorage persistence
- **Session Management** - 30min timeout, cross-tab
- **Phone Click Dedupe** - Once per session
- **Consent-Aware** - CookieYes integration
- **View Transitions** - Full Astro support

## Installation

```bash
npm install @leadgen/tracking-v2
```

## Quick Start

### 1. Add Integration

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tracking from '@leadgen/tracking-v2';

export default defineConfig({
  integrations: [
    tracking({
      gtmId: 'GTM-XXXXXXX',
      currency: 'GBP',        // optional
      sessionTimeoutMinutes: 30, // optional
      debug: false,           // optional
    })
  ]
});
```

### 1b. Add GTM NoScript (Optional)

Add to your layout right after `<body>`:

```astro
---
import GTMNoScript from '@leadgen/tracking-v2/components/GTMNoScript.astro';
---

<body>
  <GTMNoScript gtmId="GTM-XXXXXXX" />
  ...
</body>
```

### 2. Track Conversions

```typescript
import { trackConversion } from '@leadgen/tracking-v2/client';

async function handleSubmit(e: SubmitEvent) {
  const form = e.target as HTMLFormElement;
  if (!form.reportValidity()) return;
  e.preventDefault();

  const formData = new FormData(form);

  // Track conversion (GTM + Zaraz)
  const result = trackConversion('quote_request', {
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    value: 450,
  });

  console.log('Lead ID:', result.leadId);
  window.location.href = '/thank-you';
}
```

### 3. Phone Links

```astro
---
import PhoneLink from '@leadgen/tracking-v2/components/PhoneLink.astro';
---

<PhoneLink phone="+447123456789">Call us</PhoneLink>
<PhoneLink phone="+447123456789" value={450}>Call for quote</PhoneLink>
```

### 4. Calculator Events

```typescript
import {
  pushCalculatorStart,
  pushCalculatorStep,
  pushCalculatorOption
} from '@leadgen/tracking-v2/client';

pushCalculatorStart();
pushCalculatorStep(2);
pushCalculatorOption('bedrooms', '3');
```

### 5. Form Abandonment

```typescript
import { pushFormAbandon } from '@leadgen/tracking-v2/client';

// After 60s inactivity
pushFormAbandon('quote', 'email');
```

## Sheets Integration

Build payload for Google Sheets:

```typescript
import { buildSheetsPayload } from '@leadgen/tracking-v2/client';

const payload = buildSheetsPayload({
  eventType: 'quote_request',
  name: 'John Smith',
  email: 'john@example.com',
  phone: '+447123456789',
  value: 450,
});

await fetch('/api/lead', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

## Events

| Event | GA4 | GAds | Meta | Attribution |
|-------|:---:|:----:|:----:|:-----------:|
| phone_click | yes | yes | yes | no |
| quote_request | yes | yes | yes | yes |
| callback_request | yes | yes | yes | yes |
| contact_form | yes | yes | yes | yes |
| calculator_start | yes | - | - | no |
| calculator_step | yes | - | - | no |
| calculator_option | yes | - | - | no |
| form_abandon | yes | - | - | no |

## API Reference

### trackConversion(type, params)

Track form submission conversion.

```typescript
trackConversion('quote_request', {
  email: 'user@example.com',  // required
  phone: '+447123456789',     // optional
  value: 450,                 // optional
  currency: 'GBP',            // optional
});
```

### trackPhoneClick(params?)

Track phone link click (deduplicated per session).

```typescript
trackPhoneClick({
  phone: '+447123456789', // optional, for Meta CAPI
  value: 450,             // optional
  currency: 'GBP',        // optional
});
```

### pushCalculatorStart/Step/Option

Track calculator funnel events.

### pushFormAbandon(formId, lastField)

Track form abandonment.

### buildSheetsPayload(input)

Build full payload for Sheets API with attribution data.

## Requirements

- Astro 4.0+ or 5.0+
- GTM container configured (see docs)
- Cloudflare Zaraz for Meta CAPI

## License

MIT
