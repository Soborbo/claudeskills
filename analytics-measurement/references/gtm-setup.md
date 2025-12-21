# GTM Setup Guide

## Installation (Astro + Partytown)

### 1. Install Partytown

```bash
npm install @astrojs/partytown
```

### 2. Configure Astro

```javascript
// astro.config.mjs
import partytown from '@astrojs/partytown';

export default defineConfig({
  integrations: [
    partytown({
      config: {
        forward: ['dataLayer.push'],
      },
    }),
  ],
});
```

### 3. Add GTM to Layout

```astro
---
// src/layouts/BaseLayout.astro
import { site } from '@/config/site';
---

<head>
  <!-- Consent default (before GTM) -->
  <script is:inline>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      'analytics_storage': 'denied',
      'ad_storage': 'denied',
      'wait_for_update': 500
    });
  </script>

  <!-- GTM via Partytown -->
  <script type="text/partytown">
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-XXXXXXX');
  </script>
</head>

<body>
  <!-- GTM noscript fallback -->
  <noscript>
    <iframe 
      src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
      height="0" 
      width="0" 
      style="display:none;visibility:hidden"
    ></iframe>
  </noscript>
  
  <slot />
</body>
```

## GTM Container Setup

### Variables

Create these variables:

| Variable Name | Type | Value |
|---------------|------|-------|
| GA4 Measurement ID | Constant | G-XXXXXXXXXX |
| DLV - cta_location | Data Layer Variable | cta_location |
| DLV - cta_text | Data Layer Variable | cta_text |
| DLV - click_location | Data Layer Variable | click_location |
| DLV - form_name | Data Layer Variable | form_name |
| DLV - form_type | Data Layer Variable | form_type |
| DLV - video_title | Data Layer Variable | video_title |
| DLV - video_percent | Data Layer Variable | video_percent |
| DLV - calculator_type | Data Layer Variable | calculator_type |
| DLV - step_number | Data Layer Variable | step_number |
| DLV - result_value | Data Layer Variable | result_value |

### Triggers

Create these triggers:

| Trigger Name | Type | Fires On |
|--------------|------|----------|
| All Pages | Page View | All Pages |
| Consent Granted | Custom Event | consent_granted |
| CE - cta_click | Custom Event | Event equals `cta_click` |
| CE - phone_click | Custom Event | Event equals `phone_click` |
| CE - whatsapp_click | Custom Event | Event equals `whatsapp_click` |
| CE - form_start | Custom Event | Event equals `form_start` |
| CE - form_submit | Custom Event | Event equals `form_submit` |
| CE - video_play | Custom Event | Event equals `video_play` |
| CE - calculator_complete | Custom Event | Event equals `calculator_complete` |
| Scroll Depth | Scroll Depth | Vertical, 25, 50, 75, 90 percent |

### Tags

#### GA4 Configuration

| Setting | Value |
|---------|-------|
| Tag Type | GA4 Configuration |
| Measurement ID | {{GA4 Measurement ID}} |
| Send page_view | Yes |
| Trigger | Consent Granted |

#### GA4 Event - cta_click

| Setting | Value |
|---------|-------|
| Tag Type | GA4 Event |
| Configuration Tag | GA4 Configuration |
| Event Name | cta_click |
| Parameters | cta_location: {{DLV - cta_location}}, cta_text: {{DLV - cta_text}} |
| Trigger | CE - cta_click |

#### GA4 Event - form_submit

| Setting | Value |
|---------|-------|
| Tag Type | GA4 Event |
| Configuration Tag | GA4 Configuration |
| Event Name | form_submit |
| Parameters | form_name: {{DLV - form_name}}, form_type: {{DLV - form_type}} |
| Trigger | CE - form_submit |

## Consent Mode (CookieYes)

### CookieYes Tag

| Setting | Value |
|---------|-------|
| Tag Type | Custom HTML |
| HTML | `<script id="cookieyes" src="https://cdn-cookieyes.com/client_data/XXXXX/script.js"></script>` |
| Trigger | All Pages |

### Consent Update

CookieYes automatically fires consent updates. GTM Consent Mode listens for:
- `analytics_storage`: granted/denied
- `ad_storage`: granted/denied

## Testing

### GTM Preview Mode

1. Click "Preview" in GTM
2. Enter site URL
3. Check each event fires correctly
4. Verify parameters are populated

### GA4 DebugView

1. GA4 → Configure → DebugView
2. Enable debug mode in browser
3. Verify events appear in real-time

### Debug Mode (Browser)

Add to URL: `?gtm_debug=1`

Or in console:
```javascript
localStorage.setItem('gtm.debug', 'true');
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Events not firing | Check dataLayer.push syntax |
| Double-firing | Check trigger conditions |
| Missing parameters | Check DLV variable names match |
| Consent blocking | Test with consent granted |
| Partytown issues | Check forward config |

## Export & Backup

Always export GTM container before major changes:
1. Admin → Export Container
2. Save JSON file with date
3. Version control recommended
