# GTM DataLayer Reference

Push events for conversion tracking and analytics.

## Event Types

| Event | When | Data |
|-------|------|------|
| `calculator_start` | First step loaded | sessionId |
| `calculator_step` | Step viewed | step, stepIndex |
| `calculator_option` | Option selected | step, value |
| `calculator_submit` | Form submitted | quoteId |
| `calculator_value` | Price calculated | value, currency |

## Implementation

```typescript
// src/calculator/lib/gtm.ts

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

function push(data: Record<string, unknown>): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}

export const gtm = {
  start(sessionId: string) {
    push({ event: 'calculator_start', sessionId });
  },
  
  step(stepId: string, stepIndex: number) {
    push({ 
      event: 'calculator_step', 
      step: stepId, 
      stepIndex,
      stepName: stepId, // for readable reports
    });
  },
  
  option(stepId: string, value: string | string[]) {
    push({ 
      event: 'calculator_option', 
      step: stepId, 
      value: Array.isArray(value) ? value.join(',') : value,
    });
  },
  
  submit(quoteId: string) {
    push({ 
      event: 'calculator_submit', 
      quoteId,
      conversionType: 'lead',
    });
  },
  
  value(amount: number, currency: string = 'HUF') {
    push({ 
      event: 'calculator_value', 
      value: amount,
      currency,
    });
  },
};
```

## Usage in Client

```typescript
// On step load
gtm.step('service-type', 0);

// On option select (in radio/checkbox handler)
gtm.option('service-type', 'premium');

// On form submit
gtm.submit('Q-ABC123');
gtm.value(150000, 'HUF');
```

## GTM Container Setup

Create these triggers in GTM:

1. **Calculator Start**
   - Trigger: Custom Event = `calculator_start`
   - Tag: GA4 Event

2. **Calculator Step**
   - Trigger: Custom Event = `calculator_step`
   - Variables: `step`, `stepIndex`

3. **Calculator Submit (Conversion)**
   - Trigger: Custom Event = `calculator_submit`
   - Tag: GA4 Conversion + Google Ads Conversion

4. **Calculator Value**
   - Trigger: Custom Event = `calculator_value`
   - Variables: `value`, `currency`
   - Use for: Enhanced conversions, value tracking

## Enhanced Ecommerce (Optional)

For detailed funnel analysis:

```typescript
// Step as funnel stage
gtm.step('service-type', 0);
push({
  event: 'checkout_progress',
  ecommerce: {
    checkout: {
      actionField: { step: 1, option: 'service-type' }
    }
  }
});
```

## Debug Mode

```typescript
// Add to client.ts for debugging
if (import.meta.env.DEV) {
  window.dataLayer = new Proxy(window.dataLayer || [], {
    get(target, prop) {
      if (prop === 'push') {
        return (data: unknown) => {
          console.log('[GTM]', data);
          return target.push(data);
        };
      }
      return target[prop as keyof typeof target];
    },
  });
}
```
