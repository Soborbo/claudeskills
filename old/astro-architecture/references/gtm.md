# GTM, GA4 & GDPR Setup

## GTM Installation (via Partytown)

Partytown moves GTM to a web worker = no main thread blocking.

```astro
---
// src/layouts/BaseLayout.astro
import { site } from '@/config/site';
---

<head>
  <!-- Partytown config -->
  <script>
    partytown = {
      forward: ['dataLayer.push'],
    };
  </script>
  <script src="/~partytown/partytown.js"></script>
  
  <!-- GTM via Partytown -->
  <script type="text/partytown">
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','{site.gtm.id}');
  </script>
</head>

<body>
  <!-- GTM noscript fallback -->
  <noscript>
    <iframe 
      src={`https://www.googletagmanager.com/ns.html?id=${site.gtm.id}`}
      height="0" 
      width="0" 
      style="display:none;visibility:hidden"
    ></iframe>
  </noscript>
</body>
```

## DataLayer Helper

```typescript
// src/lib/gtm.ts
export function pushEvent(
  event: string, 
  params?: Record<string, any>
) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event,
      ...params,
    });
  }
}

// Pre-defined events
export const gtmEvents = {
  ctaClick: (location: string, text: string) => 
    pushEvent('cta_click', { cta_location: location, cta_text: text }),
  
  phoneClick: (location: string) => 
    pushEvent('phone_click', { click_location: location }),
  
  whatsappClick: (location: string) => 
    pushEvent('whatsapp_click', { click_location: location }),
  
  formStart: (formName: string) => 
    pushEvent('form_start', { form_name: formName }),
  
  formSubmit: (formName: string) => 
    pushEvent('form_submit', { form_name: formName }),
  
  scrollDepth: (percent: number) => 
    pushEvent('scroll_depth', { scroll_percent: percent }),
};
```

## Click Tracking

```astro
---
// Track important clicks
---

<a 
  href="tel:+44123456789" 
  onclick="gtmEvents.phoneClick('header')"
  data-gtm="phone-header"
>
  Call Us
</a>

<a 
  href="https://wa.me/44123456789"
  onclick="gtmEvents.whatsappClick('sticky')"
  data-gtm="whatsapp-sticky"
>
  WhatsApp
</a>

<button 
  onclick="gtmEvents.ctaClick('hero', 'Get Free Quote')"
  data-gtm="cta-hero"
>
  Get Free Quote
</button>
```

## GA4 Events to Track

Configure these in GTM:

| Event | Trigger | Parameters |
|-------|---------|------------|
| `cta_click` | Custom Event | cta_location, cta_text |
| `phone_click` | Custom Event | click_location |
| `whatsapp_click` | Custom Event | click_location |
| `form_start` | Custom Event | form_name |
| `form_submit` | Custom Event | form_name |
| `scroll_depth` | Scroll Depth | scroll_percent (25, 50, 75, 90) |

## CookieYes GDPR Integration

CookieYes loads via GTM. Setup in GTM:

### 1. Create CookieYes Tag

```
Tag Type: Custom HTML
Trigger: All Pages

<script 
  id="cookieyes" 
  type="text/javascript" 
  src="https://cdn-cookieyes.com/client_data/{COOKIEYES_ID}/script.js"
></script>
```

### 2. Consent Mode Setup

Add before GTM:

```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  
  // Default: deny all until consent
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'wait_for_update': 500
  });
</script>
```

### 3. CookieYes Updates Consent

CookieYes automatically pushes consent updates to dataLayer.

## GTM Container Structure

```
GTM Container
├── Tags
│   ├── GA4 Configuration
│   ├── GA4 Events (cta_click, phone_click, etc.)
│   ├── CookieYes Script
│   └── Conversion Tracking (if needed)
├── Triggers
│   ├── All Pages
│   ├── Custom Event - cta_click
│   ├── Custom Event - phone_click
│   ├── Custom Event - form_submit
│   └── Scroll Depth (25%, 50%, 75%, 90%)
└── Variables
    ├── GA4 Measurement ID
    └── CookieYes ID
```

## Testing Checklist

- [ ] GTM loads via Partytown (check Network tab)
- [ ] dataLayer events fire correctly
- [ ] GA4 receives events in DebugView
- [ ] CookieYes banner appears
- [ ] Consent blocks GA4 until accepted
- [ ] No console errors
