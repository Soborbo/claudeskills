# Calculator Skill

## Alapelv

Multi-step kalkulátor → lead capture → eredmény → thank you page.
Cél: lead gyűjtés, nem csak számolás.

---

## Flow

```
Steps 1-N (inputok) → Lead Step (gate) → Result → Thank You Page
```

---

## Multi-step szabályok

| Szabály | Érték |
|---------|-------|
| Max input / step | 3-4 |
| Progress indicator | Kötelező |
| Vissza gomb | Step 2-től |
| Validation | Lépésváltáskor |

---

## Lead capture

| Stratégia | Mikor használd |
|-----------|----------------|
| Gate (eredmény előtt) | Árajánlat, költségbecslés |
| Soft (eredmény után) | Informatív kalkulátor |

Mezők: Név + (Email VAGY Telefon) kötelező.

---

## GA4 Events

| Event | Mikor | Paraméterek |
|-------|-------|-------------|
| `calculator_start` | Első input | `calculator_name` |
| `calculator_step` | Lépésváltás | `calculator_name`, `step_number` |
| `calculator_complete` | Eredmény | `calculator_name`, `result_value` |
| `lead_submit` | Form submit | `calculator_name`, `lead_type` |

```typescript
window.dataLayer?.push({
  event: 'calculator_complete',
  calculator_name: slug,
  result_value: result
});
```

---

## UTM megőrzés

Session storage: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- Page load: URL-ből sessionStorage-be
- Submit: sessionStorage-ből payload-ba

---

## Validation

| Típus | Szabály |
|-------|---------|
| Email | HTML5 + regex |
| Telefon | Min 9 szám |
| Szám | min/max attribútumok |

Hibaüzenet: magyarul, mező alatt, piros.

---

## Integráció

Webhook payload → Google Sheets / n8n / Make / CRM

```json
{
  "calculator": "slug",
  "inputs": {},
  "result": {},
  "lead": {},
  "utm": {},
  "timestamp": "ISO8601"
}
```

---

## Thank You Page

- URL: `/koszonjuk?calculator={slug}`
- Conversion tracking (GA4, Ads pixel)
- `noindex` meta
- Upsell CTA

---

## Accessibility

- Label minden inputon
- `aria-live="polite"` hibákra
- Focus management lépésváltáskor

---

## Tiltott

- Eredmény lead capture nélkül (gate stratégiánál)
- 4+ input egy lépésben
- Validation csak submit-kor
- Hiányzó progress indicator
- UTM elvesztése
- Submit thank you page nélkül
