# GTM DataLayer Events

## Required Events

| Event | When | Data |
|-------|------|------|
| `calculator_step` | Step viewed | step, stepIndex |
| `calculator_option` | Option selected | step, value |
| `calculator_submit` | Form submitted | quoteId |
| `calculator_value` | Quote calculated | value, currency |

## Implementation

```typescript
// src/calculator/lib/gtm.ts

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

export function pushEvent(event: string, data: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}

// Step viewed
export function trackStepView(stepId: string, stepIndex: number) {
  pushEvent('calculator_step', {
    step: stepId,
    stepIndex,
  });
}

// Option selected
export function trackOptionSelect(stepId: string, value: string) {
  pushEvent('calculator_option', {
    step: stepId,
    value,
  });
}

// Form submitted
export function trackSubmit(quoteId: string) {
  pushEvent('calculator_submit', {
    quoteId,
  });
}

// Quote value
export function trackQuoteValue(value: number, currency: string = 'HUF') {
  pushEvent('calculator_value', {
    value,
    currency,
  });
}
```

## Usage in Components

```typescript
// On step load
trackStepView('service-type', 1);

// On option click
radioCard.addEventListener('change', (e) => {
  trackOptionSelect('service-type', e.target.value);
});

// On form submit
trackSubmit('Q-abc123');
trackQuoteValue(150000, 'HUF');
```

## GTM Configuration

### Trigger: calculator_step
- Type: Custom Event
- Event name: `calculator_step`
- Variables: `step`, `stepIndex`

### Trigger: calculator_submit
- Type: Custom Event
- Event name: `calculator_submit`
- Variables: `quoteId`

### Tag: GA4 Event (Calculator)
- Type: GA4 Event
- Event name: `calculator_interaction`
- Parameters from dataLayer

## Conversion Tracking

```javascript
// Google Ads conversion on submit
gtag('event', 'conversion', {
  'send_to': 'AW-XXXXXXXXX/XXXXXXX',
  'value': {{calculator_value}},
  'currency': 'HUF'
});
```

## Verification Checklist

- [ ] dataLayer exists before push
- [ ] calculator_step fires on each step
- [ ] calculator_option fires on selection
- [ ] calculator_submit fires once
- [ ] calculator_value includes amount
- [ ] GTM Preview shows all events
