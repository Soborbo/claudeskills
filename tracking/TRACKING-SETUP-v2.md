# Soborbo Lead Gen Tracking Setup v2

## Production-Ready Implementation

**Verzió:** 2.0  
**Dátum:** 2025-01-01  
**Review score:** 9/10 (javított)

---

## Javítások a v1-hez képest

| Probléma | v1 | v2 |
|----------|----|----|
| `require()` ESM-ben | ❌ Hibás | ✅ Clean ESM imports |
| `form.submit()` | ❌ Bypasses validation | ✅ `reportValidity()` + `requestSubmit()` |
| localStorage error | ❌ Nem kezelt | ✅ try/catch wrapper |
| Consent | ❌ Nincs | ✅ CookieYes integráció |
| 400ms delay | ❌ Fix, unreliable | ✅ sendBeacon + adaptive wait |
| Phone normalization | ❌ Túl agresszív | ✅ Minimal, backend normalizes |
| Cookie fallback | ❌ Megbízhatatlan | ✅ Kikerült, csak localStorage |
| Token security | ❌ Nincs mention | ✅ Explicit rules |
| Backend webhook | ❌ Hiányos | ✅ Headers, validation, timeout |

---

## Fájl Struktúra

```
src/
├── lib/
│   └── tracking/
│       ├── index.ts        # Unified exports
│       ├── gclid.ts        # localStorage persistence
│       ├── dataLayer.ts    # GTM events
│       ├── zaraz.ts        # Meta CAPI
│       └── consent.ts      # CookieYes integration
├── calculator/
│   └── lib/
│       └── form-handler.ts # Form submit with tracking
└── pages/
    └── api/
        └── tracking-beacon.ts  # Backup endpoint
```

---

## 1. Consent Flow (KRITIKUS)

### Működés

```
Page Load
    │
    ├── CookieYes banner megjelenik
    │
    ├── User ELFOGAD marketing cookies
    │       │
    │       ▼
    │   persistTrackingParams() fut
    │   GCLID/UTM mentődik localStorage-ba
    │
    └── User ELUTASÍT
            │
            ▼
        Nincs tracking storage
        Form submit: consentBlocked: true
```

### Kód

```typescript
import { hasMarketingConsent, onConsentChange, persistTrackingParams } from '@/lib/tracking';

// Page load-on
onConsentChange((consent) => {
  if (consent.marketing) {
    persistTrackingParams();
  }
});

if (hasMarketingConsent()) {
  persistTrackingParams();
}
```

---

## 2. Form Submit Flow

### Működés

```
User clicks Submit
    │
    ▼
reportValidity() ──► Ha invalid → STOP, browser shows errors
    │
    ▼ (valid)
preventDefault()
    │
    ▼
trackFullConversion()
    │
    ├── Consent check ──► Ha nincs consent → skip, de return GCLID
    │
    ├── pushConversion() → GTM dataLayer
    │
    └── trackMetaLead() → Zaraz
    │
    ▼
sendBeacon() → /api/tracking-beacon (garantált delivery)
    │
    ▼
waitForTrackingRequests(600ms)
    │
    ▼
form.requestSubmit()
```

### Miért `requestSubmit()` és nem `submit()`?

```javascript
// ❌ ROSSZ: submit() bypasses validation
form.submit();

// ✅ JÓ: requestSubmit() triggers validation + submit event
form.requestSubmit(submitButton);
```

### Miért `sendBeacon()`?

```javascript
// ❌ ROSSZ: fetch() megszakadhat page unload-on
await fetch('/api/track', { body: data });
form.submit(); // fetch még nem ért véget!

// ✅ JÓ: sendBeacon() garantáltan kimegy
navigator.sendBeacon('/api/tracking-beacon', blob);
form.submit(); // beacon MINDIG delivery-zik
```

---

## 3. localStorage Safety

### Safari Private Mode kezelés

```typescript
// ❌ ROSSZ: localStorage.setItem() THROW-ol private mode-ban
localStorage.setItem('key', 'value'); // Error!

// ✅ JÓ: try/catch wrapper
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    console.warn('[Tracking] localStorage not available');
    return false;
  }
}
```

---

## 4. Security Rules

### ⚠️ Meta Access Token

```
❌ SOHA NE TEDD:
- Kódba (tracking.ts, .env, .env.example)
- Git repo-ba
- Console log-ba
- Dokumentációba (kivéve placeholder)

✅ CSAK IDE:
Cloudflare Dashboard → Zaraz → Tools → Facebook Pixel → Access Token
```

### Backend Webhook

```typescript
// ❌ ROSSZ: Hiányos
await fetch(WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify(data),
});

// ✅ JÓ: Teljes
await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
  signal: AbortSignal.timeout(5000), // 5s timeout
});
```

---

## 5. GTM Beállítások

### User-Provided Data Változó

```
GTM → Variables → New → User-Defined Variable
├── Type: User-Provided Data
├── Source: Manual Configuration
├── Email: {{DLV - user_provided_data.email}}
└── Phone: {{DLV - user_provided_data.phone_number}}
```

### Conversion Tag

```
GTM → Tags → Google Ads Conversion
├── Conversion ID: [AW-XXXXXXXXX]
├── Conversion Label: [XXXXXXXXX]
├── Include user-provided data: ✅
├── User-provided data variable: [fenti változó]
└── Trigger: calculator_conversion (Custom Event)
```

### Consent Mode (FONTOS!)

```
GTM → Admin → Container Settings → Consent Settings
├── Enable consent overview: ✅
└── Consent Mode: Enabled

Tag-eknél:
├── Google Ads Conversion → Requires: ad_storage, ad_user_data
└── GA4 → Requires: analytics_storage
```

---

## 6. Cloudflare Beállítások

### Google Tag Gateway

```
Cloudflare → [domain] → Speed → Optimization → Google Tag Gateway → Enable
```

### Zaraz

```
Cloudflare → [domain] → Zaraz → Tools → Add

Facebook Pixel:
├── Pixel ID: [XXXXXXXXXX]
├── Access Token: [Meta Events Manager-ből] ⚠️ CSAK ITT!
├── Server-Side: ✅
└── Triggers: Lead → calculator_conversion match
```

### Zaraz Consent Integration

```
Cloudflare → Zaraz → Consent
├── Enable Consent Management: ✅
├── Provider: CookieYes (or your CMP)
└── Marketing tools require: marketing consent
```

---

## 7. CookieYes Beállítások

```
CookieYes Dashboard → Consent Categories:

├── Necessary (always on)
│   └── [alapvető működés]
│
├── Analytics
│   └── GA4
│
└── Marketing
    ├── Google Ads
    ├── Facebook Pixel
    └── Zaraz tools
```

---

## 8. Tesztelés Checklist

### Consent Flow
- [ ] Banner megjelenik első látogatáskor
- [ ] "Accept all" után: localStorage-ban van tracking adat
- [ ] "Reject all" után: localStorage ÜRES
- [ ] trackFullConversion() visszatér `consentBlocked: true` ha nincs consent

### Form Submit
- [ ] Invalid form: böngésző hibaüzenetet mutat, NEM submit-ol
- [ ] Valid form: tracking events kimennek, AZTÁN redirect
- [ ] sendBeacon request látható Network tab-ban
- [ ] Hidden mezők kitöltődnek (gclid, utm_*)

### Safari Tesztelés
- [ ] Private mode: oldal működik, localStorage hiba NINCS console-ban
- [ ] Normal mode: GCLID mentődik localStorage-ba
- [ ] 7+ nap múlva: GCLID még mindig ott van (localStorage nem törlődik)

### GTM Preview
- [ ] `calculator_conversion` event tüzel
- [ ] `user_provided_data.email` látható az event-ben
- [ ] Consent Mode: tag-ek CSAK consent után tüzelnek

### Meta Events Manager
- [ ] Lead event megjelenik
- [ ] Server event (nem csak browser)
- [ ] Event Match Quality: 6/10+

---

## 9. Hibakeresés

### "Tracking not working"

```
1. Console errors? → localStorage disabled?
2. GTM Preview → event tüzel?
3. Network tab → request kimegy?
4. Zaraz dashboard → events?
5. Consent → user elfogadta?
```

### "GCLID missing at submit"

```
1. URL-ben volt GCLID landing-kor?
2. localStorage-ban van? (DevTools → Application → Local Storage)
3. hasMarketingConsent() === true?
4. persistTrackingParams() lefutott?
```

### "Enhanced Conversions not active"

```
Google Ads → Tools → Conversions → [conversion] → Diagnostics
├── "Enhanced Conversions are active" → OK
├── "Waiting for data" → várj 24-48 órát
└── "Not receiving data" → GTM setup hiba
```

---

## 10. Claude Code Prompt (v2)

```
Implementáld a Soborbo tracking v2 rendszert.

## Fájlok

Hozd létre PONTOSAN ezeket a fájlokat:

1. src/lib/tracking/gclid.ts
   - safeGetItem/safeSetItem wrapper (try/catch)
   - persistTrackingParams() - CSAK consent után hívható
   - getGclid(), getFbclid(), getAllTrackingData()
   - 90 napos expiry
   - Cookie fallback NINCS (unreliable)

2. src/lib/tracking/dataLayer.ts
   - pushConversion() - user_provided_data structure
   - pushStepEvent(), pushOptionEvent()
   - Minimal phone normalization (backend does E.164)

3. src/lib/tracking/zaraz.ts
   - trackMetaLead() - em, ph property names
   - isZarazAvailable() check
   - NINCS access token a kódban!

4. src/lib/tracking/consent.ts
   - hasMarketingConsent(), hasAnalyticsConsent()
   - onConsentChange() listener
   - waitForConsent() promise
   - CookieYes getCkyConsent() integration

5. src/lib/tracking/index.ts
   - Clean ESM re-exports (NO require!)
   - trackFullConversion() with consent check

6. src/calculator/lib/form-handler.ts
   - reportValidity() BEFORE preventDefault()
   - requestSubmit() NOT submit()
   - sendBeacon() for guaranteed delivery
   - Adaptive wait (max 600ms)

7. src/pages/api/tracking-beacon.ts
   - Zod validation
   - Rate limiting
   - Proper error handling
   - Optional Sheets forwarding

## Requirements

- TypeScript strict
- ESM only (no require)
- All localStorage access wrapped in try/catch
- Consent checked before any tracking
- sendBeacon for reliable delivery
- reportValidity + requestSubmit for forms

## Security

- Meta Access Token: NEVER in code, only Cloudflare dashboard
- Validate all inputs server-side
- Rate limit API endpoints
```

---

## Összefoglaló

| Komponens | Megoldás | Költség |
|-----------|----------|:-------:|
| Safari ITP | Enhanced Conversions + localStorage | £0 |
| Ad block | Google Tag Gateway | £0 |
| Meta CAPI | Zaraz | £0 |
| Consent | CookieYes + Consent Module | £0* |
| Reliable tracking | sendBeacon + beacon API | £0 |
| **Összesen** | | **£0/hó** |

*CookieYes ingyenes tier elég lehet, vagy meglévő CMP

**Stape ($100/hó) NEM KELL** mert:
- Enhanced Conversions megkerüli Safari cookie problémát
- localStorage 90 napos, Safari nem törli
- Zaraz = ingyenes Meta CAPI
- sendBeacon = garantált tracking delivery
