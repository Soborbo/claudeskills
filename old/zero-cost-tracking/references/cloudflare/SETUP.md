# Cloudflare Setup Guide

Cloudflare configuration for Zero-Cost Tracking v2.

## Prerequisites

- Domain on Cloudflare (free plan is fine)
- Meta Business account with Pixel
- Meta Conversions API access token

## 1. Google Tag Gateway

Google Tag Gateway proxies GTM through Cloudflare, bypassing ad blockers.

### Enable

```
Cloudflare Dashboard
  → [your domain]
  → Speed
  → Optimization
  → Content Optimization
  → Google Tag Gateway
  → Enable ✅
```

### Verify

After enabling, GTM requests will go through:
`https://[your-domain].com/cdn-cgi/zaraz/gtm`

Instead of:
`https://www.googletagmanager.com/gtm.js`

## 2. Zaraz Setup

Zaraz handles server-side Meta CAPI tracking.

### Enable Zaraz

```
Cloudflare Dashboard
  → [your domain]
  → Zaraz
  → Settings
  → Enable Zaraz ✅
```

### Add Facebook Pixel

```
Cloudflare Dashboard
  → [your domain]
  → Zaraz
  → Tools
  → Add new tool
  → Facebook Pixel
```

### Configure Pixel

```
Tool Settings:
├── Pixel ID: [from Meta Events Manager]
├── Dataset ID: (leave empty)
├── Access Token: [from Meta Events Manager] ⚠️
└── Enable Server-side Events: ✅
```

#### Getting Access Token

```
Meta Events Manager
  → [your pixel]
  → Settings
  → Conversions API
  → Generate Access Token
```

**CRITICAL: The access token goes ONLY in Cloudflare Zaraz dashboard. NEVER put it in code!**

### Add Triggers

Create triggers for each conversion event:

#### Trigger: phone_click → Lead

```
Zaraz → Tools → Facebook Pixel → Edit
  → Triggers → Add
  ├── Rule type: Match rule
  ├── Variable: Event Name
  ├── Match operation: Equals
  ├── Match string: phone_click
  └── Save

  → Events → Add
  ├── Trigger: phone_click
  ├── Event Name: Lead
  └── Save
```

#### Trigger: quote_request → Lead

```
  → Triggers → Add
  ├── Rule type: Match rule
  ├── Variable: Event Name
  ├── Match operation: Equals
  ├── Match string: quote_request
  └── Save

  → Events → Add
  ├── Trigger: quote_request
  ├── Event Name: Lead
  └── Save
```

Repeat for: callback_request, contact_form

### Configure Consent

```
Cloudflare Dashboard
  → [your domain]
  → Zaraz
  → Consent
  ├── Enable Consent Management: ✅
  └── Marketing tools require consent: ✅
```

This ensures Zaraz respects CookieYes consent state.

## 3. Zaraz Variables

Map dataLayer variables to Zaraz for enhanced matching:

```
Zaraz → Variables → Add
├── Name: User Email
├── Type: Data layer
└── Key path: user_email

Zaraz → Variables → Add
├── Name: User Phone
├── Type: Data layer
└── Key path: user_phone

Zaraz → Variables → Add
├── Name: Event Value
├── Type: Data layer
└── Key path: value
```

Then in Facebook Pixel tool settings:

```
Event Parameters:
├── em (email): {{User Email}}
├── ph (phone): {{User Phone}}
└── value: {{Event Value}}
```

## 4. Testing

### Zaraz Debug

```
Cloudflare Dashboard
  → [your domain]
  → Zaraz
  → Logs
  → Real-time
```

Submit a test form and verify Lead event appears.

### Meta Events Manager

```
Meta Events Manager
  → [your pixel]
  → Test Events
  → Enter your website URL
  → Open website
  → Submit test form
  → Verify Lead event appears
```

Check for:
- Event received
- Server event (not just browser)
- Event Match Quality score (aim for 6+/10)

## 5. Event Match Quality

To improve Event Match Quality (EMQ):

### Required User Data

Zaraz automatically hashes and sends:
- `em` (email) - from user_email
- `ph` (phone) - from user_phone

### Optional Enhancements

Add these if available:
- `fn` (first name)
- `ln` (last name)
- `ct` (city)
- `st` (state)
- `zp` (zip code)
- `country`

### Check EMQ Score

```
Meta Events Manager
  → [your pixel]
  → Overview
  → Event Match Quality
```

Score interpretation:
- 10/10: Excellent matching
- 6-9/10: Good matching
- Below 6/10: May need more user data

## Troubleshooting

### Zaraz not firing

1. Check consent - Zaraz respects consent mode
2. Check triggers - event name must match exactly
3. Check Zaraz logs for errors

### Meta events not appearing

1. Wait 5-10 minutes (server events have delay)
2. Check access token is valid
3. Check Pixel ID is correct
4. Verify server-side is enabled

### Low Event Match Quality

1. Ensure email is normalized (lowercase, trimmed)
2. Ensure phone includes country code
3. Add additional user data if available
4. Check Meta's EMQ recommendations

### Google Tag Gateway issues

1. Verify it's enabled in Cloudflare
2. Check browser DevTools → Network for gtm.js requests
3. Request should go to your domain, not google.com
