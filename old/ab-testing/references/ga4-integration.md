# GA4 Integration

## Track Conversions

```typescript
// src/lib/ab-testing/track.ts
export function trackConversion(testId: string, conversionType: string) {
  const variant = localStorage.getItem(`ab_${testId}`);

  if (!variant) return;

  // Send to GTM/GA4
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'ab_test_conversion',
      ab_test_id: testId,
      ab_variant: variant,
      conversion_type: conversionType,
    });
  }
}

// Usage in form handler
import { trackConversion } from '@/lib/ab-testing/track';

function onFormSubmit() {
  trackConversion('hero-cta', 'form_submit');
  trackConversion('form-layout', 'form_submit');
}
```

## GA4 Custom Dimensions

Set up in GA4:

| Dimension | Scope | Description |
|-----------|-------|-------------|
| `ab_test_id` | Event | Test identifier |
| `ab_variant` | Event | Variant name |

## GTM Configuration

```javascript
// Custom HTML tag for tracking exposures
<script>
  (function() {
    var testId = {{DLV - ab_test_id}};
    var variant = {{DLV - ab_variant}};

    if (testId && variant) {
      gtag('event', 'experiment_impression', {
        experiment_id: testId,
        variant_id: variant
      });
    }
  })();
</script>
```
