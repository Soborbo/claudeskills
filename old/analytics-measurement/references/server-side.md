# Server-Side Tracking Setup

## Architecture Overview

```
┌─────────────────┐
│  User Browser   │
│  (your site)    │
└────────┬────────┘
         │ dataLayer.push()
         ▼
┌─────────────────┐
│  Web GTM        │
│  (client-side)  │
└────────┬────────┘
         │ HTTP request to first-party domain
         ▼
┌─────────────────┐
│  Cloudflare     │
│  Worker         │
│  (data.site.com)│
└────────┬────────┘
         │ Proxy to sGTM
         ▼
┌─────────────────┐
│  Server-Side    │
│  GTM Container  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌─────────┐
│  GA4  │ │ Google  │
│       │ │  Ads    │
└───────┘ └─────────┘
```

## Why This Setup

| Benefit | Impact |
|---------|--------|
| First-party context | Bypasses ad blockers |
| Enhanced conversions | Better attribution |
| Consent compliance | Control what's sent |
| Data quality | Consistent tracking |
| Cloudflare integration | Fast, global edge |

## Step 1: Cloudflare DNS

Add subdomain for tracking:

```
Type: CNAME
Name: data
Target: your-sgtm-url.a]run.app (or custom domain)
Proxy: ON (orange cloud)
```

## Step 2: Cloudflare Worker

Create worker at `data.yourdomain.com`:

```javascript
// cloudflare-worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Rewrite to sGTM endpoint
    const sgtmUrl = new URL(url.pathname + url.search, env.SGTM_URL);
    
    // Forward request
    const response = await fetch(sgtmUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    // Return with CORS headers
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers),
        'Access-Control-Allow-Origin': 'https://yourdomain.com',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  },
};
```

Worker environment variables:
```
SGTM_URL = https://your-sgtm-container.a]run.app
```

## Step 3: Server-Side GTM Container

### Create Container

1. GTM → Admin → Create Container
2. Select "Server" as target platform
3. Deploy to Google Cloud Run (or custom)

### Configure Client

Create "GA4" client in sGTM:
- Default GA4 path: `/g/collect`
- Enable: "Claims GA4 requests"

### Tags in sGTM

#### GA4 Tag (Server)

| Setting | Value |
|---------|-------|
| Tag Type | GA4 |
| Measurement ID | G-XXXXXXXXXX |
| Event | Use incoming event |

#### Google Ads Conversion Tag

| Setting | Value |
|---------|-------|
| Tag Type | Google Ads Conversion Tracking |
| Conversion ID | AW-XXXXXXXXX |
| Conversion Label | xxxxxxxxxx |
| Trigger | form_submit, phone_click, whatsapp_click |

#### Google Ads Remarketing Tag

| Setting | Value |
|---------|-------|
| Tag Type | Google Ads Remarketing |
| Conversion ID | AW-XXXXXXXXX |
| Trigger | All Pages |

## Step 4: Web GTM Updates

Update web GTM to send to first-party endpoint:

### GA4 Configuration Tag

| Setting | Value |
|---------|-------|
| Transport URL | https://data.yourdomain.com |
| First Party Collection | Enabled |

### First-Party Cookies

sGTM can set first-party cookies:
- `_ga` cookie set by your domain
- Better persistence than third-party

## Enhanced Conversions

### What Data to Send

| Field | Format | Example |
|-------|--------|---------|
| email | SHA256 hash | `a1b2c3...` |
| phone_number | SHA256 hash, E.164 | `d4e5f6...` |
| first_name | SHA256 hash | `g7h8i9...` |
| last_name | SHA256 hash | `j0k1l2...` |

### Hashing Function

```javascript
// src/lib/hash.ts
export async function hashSHA256(value: string): Promise<string> {
  const normalized = value.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Send with Form Submit

```javascript
// On form submission
const hashedEmail = await hashSHA256(formData.email);
const hashedPhone = await hashSHA256(formData.phone);

dataLayer.push({
  event: 'form_submit',
  form_name: 'contact',
  user_data: {
    sha256_email_address: hashedEmail,
    sha256_phone_number: hashedPhone,
  },
});
```

### sGTM User Data Variable

In sGTM, create variable:
- Type: Event Data
- Key Path: user_data

Use in Google Ads Conversion tag → User-provided data.

## Google Ads Linking

### In Google Ads

1. Tools → Conversions → New conversion action
2. Select "Import" → "Google Analytics 4 properties"
3. Or create "Website" conversion with sGTM

### Conversion Actions to Import

| Event | Conversion Name | Value |
|-------|-----------------|-------|
| form_submit | Lead - Form | Dynamic or fixed |
| phone_click | Lead - Phone | Fixed (e.g., £50) |
| whatsapp_click | Lead - WhatsApp | Fixed (e.g., £30) |

## Testing Server-Side

### sGTM Preview

1. sGTM → Preview
2. Enter site URL
3. Check requests arrive at sGTM
4. Verify tags fire correctly

### GA4 DebugView

Same as client-side — events should appear with server source.

### Google Ads

1. Tag Assistant (legacy) for remarketing
2. Conversions report (24-48h delay)

## Troubleshooting

| Issue | Check |
|-------|-------|
| No requests to sGTM | Cloudflare Worker logs |
| CORS errors | Worker CORS headers |
| Missing conversions | sGTM Preview, tag triggers |
| Enhanced conv. not matching | Hash format, consent |

## Checklist

- [ ] Cloudflare subdomain configured
- [ ] Worker deployed and tested
- [ ] sGTM container deployed
- [ ] GA4 client claiming requests
- [ ] GA4 tag sending to property
- [ ] Ads conversion tags configured
- [ ] Enhanced conversions enabled
- [ ] First-party cookies working
- [ ] Consent mode respected
- [ ] All tested end-to-end
