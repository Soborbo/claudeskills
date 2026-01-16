# GTM Leadgen Tracking v2 - Import Guide

## Javítások az eredetihez képest

1. **Trigger ID-k** — Minden trigger kap numerikus `triggerId`-t (10-17)
2. **Tag → Trigger kapcsolat** — `firingTriggerId` most a tényleges trigger ID-kra mutat
3. **Enhanced Conversions** — Javított struktúra (`enhancedConversionsData` list)
4. **Variable ID-k** — Minden változó kap egyedi `variableId`-t

## Import lépések

### 1. GTM → Admin → Import Container

```
GTM Dashboard → Admin → Import Container
↓
Choose file: gtm-leadgen-tracking-v2.json
↓
Workspace: Existing (vagy New)
↓
Import option: MERGE (Overwrite conflicting)
```

### 2. Import után KÖTELEZŐ teendők

#### Konstansok kitöltése

| Változó | Hol találod |
|---------|-------------|
| `CONST - GA4 Measurement ID` | GA4 → Admin → Data Streams → Measurement ID |
| `CONST - GAds Conversion ID` | Google Ads → Tools → Conversions → Tag setup |
| `CONST - GAds Quote Label` | Conversion action → Tag setup → Label |
| `CONST - GAds Callback Label` | Conversion action → Tag setup → Label |
| `CONST - GAds Contact Label` | Conversion action → Tag setup → Label |
| `CONST - GAds Phone Label` | Conversion action → Tag setup → Label |

#### Enhanced Conversions aktiválása

```
Google Ads → Tools & Settings → Conversions
↓
[Conversion action] → Settings
↓
Enhanced conversions: Turn ON
↓
Method: Google Tag Manager
```

### 3. DataLayer push formátum

A frontend kódnak így kell pusholnia:

```javascript
// Quote request példa
dataLayer.push({
  event: 'quote_request',
  lead_id: 'QR-2025-001234',
  session_id: 'sess_abc123',
  value: 150,
  currency: 'GBP',
  device: 'mobile',
  user_email: 'test@example.com',     // lowercase, trimmed
  user_phone: '+447123456789',        // E.164 format
  first_utm_source: 'google',
  first_utm_medium: 'cpc',
  last_utm_source: 'google',
  last_utm_medium: 'cpc'
});

// Calculator step példa
dataLayer.push({
  event: 'calculator_step',
  session_id: 'sess_abc123',
  step: 2
});

// Form abandon példa
dataLayer.push({
  event: 'form_abandon',
  session_id: 'sess_abc123',
  form_id: 'quote-calculator',
  last_field: 'postcode'
});
```

### 4. Tesztelés

#### GTM Preview Mode

```
GTM → Preview → Connect to site
↓
Trigger form submit
↓
Ellenőrizd:
- Tags Fired: GA4 Event + GAds Conversion
- Variables: lead_id, user_email stb. kitöltve
```

#### GA4 DebugView

```
GA4 → Admin → DebugView
↓
Ellenőrizd:
- generate_lead event megjelenik
- conversion_type paraméter helyes
```

#### Google Ads Tag Assistant

```
tagassistant.google.com
↓
Ellenőrizd:
- Conversion fires
- Enhanced Conversions data present
```

## Trigger → Tag mapping

| Trigger ID | Event | GA4 Tag | GAds Tag |
|------------|-------|---------|----------|
| 10 | phone_click | GA4 Event - phone_click | GAds - Phone Click |
| 11 | quote_request | GA4 Event - quote_request | GAds - Quote Request |
| 12 | callback_request | GA4 Event - callback_request | GAds - Callback Request |
| 13 | contact_form | GA4 Event - contact_form | GAds - Contact Form |
| 14 | calculator_start | GA4 Event - calculator_start | — |
| 15 | calculator_step | GA4 Event - calculator_step | — |
| 16 | calculator_option | GA4 Event - calculator_option | — |
| 17 | form_abandon | GA4 Event - form_abandon | — |

## Consent beállítások

Minden tag `consentStatus: NEEDED` — a CookieYes (vagy más CMP) által beállított consent state-re vár.

Required consent signals:
- `analytics_storage` → GA4 tags
- `ad_storage` → GAds tags, Conversion Linker

## Gyakori hibák

### "Tag not firing"

1. Ellenőrizd Preview mode-ban, hogy a trigger fired-e
2. Ellenőrizd, hogy a dataLayer.push `event` neve pontosan egyezik-e

### "Enhanced Conversions not working"

1. `user_email` lowercase és trimmed legyen
2. `user_phone` E.164 formátum (`+44...`)
3. Google Ads-ben be legyen kapcsolva az Enhanced Conversions

### "Duplicate conversions"

1. Ellenőrizd, hogy `lead_id` (orderId) egyedi-e minden submitnál
2. Ne legyen dupla dataLayer.push
