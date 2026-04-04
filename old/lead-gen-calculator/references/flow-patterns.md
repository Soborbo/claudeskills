# Calculator Flow Patterns

## Multi-Step Flow

```
Steps 1-N (inputs) → Lead Step (gate) → Result → Thank You Page
```

## Multi-Step Rules

| Rule | Value |
|------|-------|
| Max inputs per step | 3-4 |
| Progress indicator | Required |
| Back button | From step 2 |
| Validation | On step change |

## Lead Capture Strategies

| Strategy | When to use |
|----------|-------------|
| Gate (before result) | Price quotes, cost estimates |
| Soft (after result) | Informational calculators |

Required fields: Name + (Email OR Phone)

## GA4 Events

| Event | When | Parameters |
|-------|------|------------|
| `calculator_start` | First input | `calculator_name` |
| `calculator_step` | Step change | `calculator_name`, `step_number` |
| `calculator_complete` | Result shown | `calculator_name`, `result_value` |
| `lead_submit` | Form submit | `calculator_name`, `lead_type` |

```typescript
window.dataLayer?.push({
  event: 'calculator_complete',
  calculator_name: slug,
  result_value: result
});
```

## UTM Preservation

Session storage: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- Page load: Extract from URL to sessionStorage
- Submit: Include from sessionStorage in payload

## Validation

| Type | Rule |
|------|------|
| Email | HTML5 + regex |
| Phone | Min 9 digits |
| Number | min/max attributes |

Error messages: Below field, red color.

## Integration

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

## Thank You Page

- URL: `/thank-you?calculator={slug}`
- Conversion tracking (GA4, Ads pixel)
- `noindex` meta tag
- Upsell CTA

## Accessibility

- Label on every input
- `aria-live="polite"` for errors
- Focus management on step change
