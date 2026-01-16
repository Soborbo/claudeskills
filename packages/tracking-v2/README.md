# @leadgen/tracking-v2

Zero-cost conversion tracking for Astro.js lead generation sites.

## Features

### Core
- **GTM Integration** - Auto-injected Google Tag Manager
- **GA4 + Google Ads** - Enhanced Conversions support
- **Meta CAPI** - Server-side via Cloudflare Zaraz
- **First + Last Touch** - Full attribution tracking
- **Safari ITP Bypass** - localStorage persistence
- **Session Management** - 30min timeout, cross-tab
- **Phone Click Dedupe** - Once per session
- **Consent-Aware** - CookieYes integration
- **View Transitions** - Full Astro support

### Advanced
- **Custom Events** - Track any event with `trackEvent()`
- **Offline Queue** - IndexedDB queue with retry for failed requests
- **Cross-Domain** - Share session/attribution across domains
- **Plugin System** - Extensible architecture for integrations
- **Debug Overlay** - Visual debugging panel (Ctrl+Shift+T)
- **Schema Validation** - Dev-mode event validation
- **Funnel Analytics** - Built-in conversion funnel tracking
- **Server Dedupe** - Helpers for server-side deduplication

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
      currency: 'GBP',              // optional
      sessionTimeoutMinutes: 30,    // optional
      debug: false,                 // optional - enables debug overlay
      linkedDomains: [],            // optional - for cross-domain tracking
      enableOfflineQueue: true,     // optional - queue failed requests
    })
  ]
});
```

### 2. Track Conversions

```typescript
import { trackConversion } from '@leadgen/tracking-v2/client';

const result = trackConversion('quote_request', {
  email: 'user@example.com',
  phone: '+447123456789',
  value: 450,
});

console.log('Lead ID:', result.leadId);
```

### 3. Phone Links

```astro
---
import PhoneLink from '@leadgen/tracking-v2/components/PhoneLink.astro';
---

<PhoneLink phone="+447123456789">Call us</PhoneLink>
<PhoneLink phone="+447123456789" value={450}>Call for quote</PhoneLink>
```

## Custom Events

Track any event beyond the built-in types:

```typescript
import { trackEvent } from '@leadgen/tracking-v2/client';

trackEvent('pricing_viewed', { plan: 'pro', price: 99 });
trackEvent('chat_opened', { page: '/calculator' });
trackEvent('video_played', { videoId: 'abc123', duration: 120 });
```

## Funnel Analytics

Track and analyze conversion funnels:

```typescript
import { createFunnel, enableAutoTracking } from '@leadgen/tracking-v2/client';

// Define funnel
const quoteFunnel = createFunnel('quote_flow', [
  { name: 'start', event: 'calculator_start' },
  { name: 'step2', event: 'calculator_step:2' },
  { name: 'step3', event: 'calculator_step:3' },
  { name: 'complete', event: 'quote_request' },
]);

// Enable auto-tracking (optional - tracks based on dataLayer events)
enableAutoTracking();

// Or manually record steps
quoteFunnel.recordStep('start');

// Get stats
const stats = quoteFunnel.getStats();
console.log('Conversion rate:', stats.conversionRate);
```

## Offline Queue

Failed requests are automatically queued and retried:

```typescript
import { fetchWithQueue, getQueueStats } from '@leadgen/tracking-v2/client';

// Use fetchWithQueue instead of fetch for automatic retry
await fetchWithQueue('/api/lead', {
  method: 'POST',
  body: JSON.stringify(payload),
});

// Check queue status
const stats = await getQueueStats();
console.log('Pending requests:', stats.pending);
```

## Cross-Domain Tracking

Share session and attribution data across domains:

```javascript
// astro.config.mjs
tracking({
  gtmId: 'GTM-XXXXXXX',
  linkedDomains: ['checkout.example.com', 'app.example.com'],
})
```

Links to these domains will automatically include tracking data.

## Plugin System

Extend tracking with plugins:

```typescript
import { registerPlugin, createConsoleLoggerPlugin } from '@leadgen/tracking-v2/client';

// Built-in console logger (for debugging)
registerPlugin(createConsoleLoggerPlugin());

// Custom plugin
registerPlugin({
  name: 'my-analytics',
  version: '1.0.0',
  onConversion: (type, params) => {
    // Send to custom analytics
    myAnalytics.track(type, params);
  },
  onError: (error, context) => {
    // Send to error tracking
    Sentry.captureException(error);
  },
});
```

## Debug Overlay

Press `Ctrl+Shift+T` to toggle the debug overlay, or enable in config:

```javascript
tracking({ gtmId: 'GTM-XXX', debug: true })
```

Shows:
- Live event stream
- Session & attribution data
- Consent state
- Integration status

## Server-Side Deduplication

Prevent duplicate leads on the server:

```typescript
// In your API route
import {
  createMemoryStore,
  createRedisStore,
  checkDuplicate
} from '@leadgen/tracking-v2/server';

// For development
const store = createMemoryStore();

// For production (with Redis)
// const store = createRedisStore(redisClient);

export async function POST({ request }) {
  const body = await request.json();

  const result = await checkDuplicate(store, body.idempotency_key);
  if (result.isDuplicate) {
    return new Response('Duplicate', { status: 409 });
  }

  // Process lead...
}
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
| *custom events* | yes | - | - | no |

## API Reference

### Core

- `trackConversion(type, params)` - Track form conversion
- `trackPhoneClick(params?)` - Track phone click
- `trackEvent(name, params)` - Track custom event
- `buildSheetsPayload(input)` - Build Sheets payload

### Funnel

- `createFunnel(id, steps)` - Create funnel tracker
- `enableAutoTracking()` - Auto-track from dataLayer
- `getConversionRate(funnelId)` - Get conversion rate
- `getDropoffAnalysis(funnelId)` - Get dropoff stats

### Offline

- `fetchWithQueue(url, options)` - Fetch with retry queue
- `getQueueStats()` - Get queue statistics
- `clearQueue()` - Clear pending requests

### Plugins

- `registerPlugin(plugin)` - Register a plugin
- `unregisterPlugin(name)` - Remove a plugin
- `createConsoleLoggerPlugin()` - Built-in logger

### Debug

- `showDebugOverlay()` - Show debug panel
- `hideDebugOverlay()` - Hide debug panel
- `toggleDebugOverlay()` - Toggle (or Ctrl+Shift+T)

## Requirements

- Astro 4.0+ or 5.0+
- GTM container configured
- Cloudflare Zaraz for Meta CAPI

## License

MIT
