---
name: ab-testing
description: A/B testing patterns for lead generation sites. Client-side experiments, Google Optimize alternative, analytics integration. Use for conversion optimization.
---

# A/B Testing Skill

## Purpose

Enables experimentation on lead generation sites to optimize conversion rates. Simple, privacy-friendly approach.

## Core Rules

1. **One test at a time** — Per page, avoid interaction effects
2. **Statistical significance** — Don't call winners too early
3. **Track conversions** — Not just clicks
4. **Minimize flicker** — Apply variants before paint
5. **Respect privacy** — No PII in experiments

## Simple A/B Test Component

```astro
---
interface Props {
  testId: string;
  variants: string[];
  weights?: number[]; // Default: equal distribution
}

const { testId, variants, weights } = Astro.props;

// Ensure weights sum to 1
const normalizedWeights = weights
  ? weights.map(w => w / weights.reduce((a, b) => a + b, 0))
  : variants.map(() => 1 / variants.length);
---

<div
  data-ab-test={testId}
  data-ab-variants={JSON.stringify(variants)}
  data-ab-weights={JSON.stringify(normalizedWeights)}
>
  <!-- Variants rendered by JS to avoid flicker -->
  <slot />
</div>

<script>
  function initABTests() {
    const tests = document.querySelectorAll('[data-ab-test]');

    tests.forEach((container) => {
      const testId = container.getAttribute('data-ab-test');
      const variants = JSON.parse(container.getAttribute('data-ab-variants') || '[]');
      const weights = JSON.parse(container.getAttribute('data-ab-weights') || '[]');

      // Check for existing assignment
      let variant = localStorage.getItem(`ab_${testId}`);

      if (!variant || !variants.includes(variant)) {
        // Assign variant based on weights
        const random = Math.random();
        let cumulative = 0;

        for (let i = 0; i < variants.length; i++) {
          cumulative += weights[i];
          if (random <= cumulative) {
            variant = variants[i];
            break;
          }
        }

        variant = variant || variants[0];
        localStorage.setItem(`ab_${testId}`, variant);
      }

      // Apply variant
      container.setAttribute('data-ab-variant', variant);

      // Track exposure
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'ab_test_exposure',
          ab_test_id: testId,
          ab_variant: variant,
        });
      }
    });
  }

  // Run immediately to prevent flicker
  initABTests();
  document.addEventListener('astro:page-load', initABTests);
</script>

<style>
  /* Hide until variant applied */
  [data-ab-test]:not([data-ab-variant]) {
    visibility: hidden;
  }
</style>
```

## Variant Content Component

```astro
---
interface Props {
  testId: string;
  variant: string;
}

const { testId, variant } = Astro.props;
---

<div
  class="ab-variant"
  data-ab-test-id={testId}
  data-ab-variant-id={variant}
  style="display: none;"
>
  <slot />
</div>

<script>
  function showVariants() {
    document.querySelectorAll('.ab-variant').forEach((el) => {
      const testId = el.getAttribute('data-ab-test-id');
      const variantId = el.getAttribute('data-ab-variant-id');
      const activeVariant = localStorage.getItem(`ab_${testId}`);

      if (variantId === activeVariant) {
        el.style.display = '';
      }
    });
  }

  showVariants();
  document.addEventListener('astro:page-load', showVariants);
</script>
```

## Usage Example

```astro
---
import ABTest from '@/components/ABTest.astro';
import ABVariant from '@/components/ABVariant.astro';
---

<ABTest testId="hero-cta" variants={['control', 'urgency', 'social-proof']}>
  <ABVariant testId="hero-cta" variant="control">
    <button class="btn btn-primary">Get Free Quote</button>
  </ABVariant>

  <ABVariant testId="hero-cta" variant="urgency">
    <button class="btn btn-primary">Get Free Quote — Limited Slots Today</button>
  </ABVariant>

  <ABVariant testId="hero-cta" variant="social-proof">
    <button class="btn btn-primary">Join 2,500+ Happy Customers</button>
  </ABVariant>
</ABTest>
```

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

## Sample Size Calculator

```typescript
// Minimum sample size per variant for statistical significance
function calculateSampleSize(
  baselineConversion: number, // e.g., 0.05 for 5%
  minimumDetectableEffect: number, // e.g., 0.2 for 20% lift
  power: number = 0.8,
  significance: number = 0.05
): number {
  // Simplified formula
  const p1 = baselineConversion;
  const p2 = baselineConversion * (1 + minimumDetectableEffect);
  const pooledP = (p1 + p2) / 2;

  const z_alpha = 1.96; // 95% confidence
  const z_beta = 0.84; // 80% power

  const n = (
    2 * pooledP * (1 - pooledP) * Math.pow(z_alpha + z_beta, 2)
  ) / Math.pow(p2 - p1, 2);

  return Math.ceil(n);
}

// Example: 5% baseline, want to detect 20% lift
// calculateSampleSize(0.05, 0.2) ≈ 3,800 per variant
```

## Test Duration Guidelines

| Traffic/Day | Min Duration | Sample Size |
|-------------|--------------|-------------|
| 100 | 8+ weeks | ~400 per variant |
| 500 | 2 weeks | ~400 per variant |
| 1000+ | 1 week | ~400 per variant |

**Never call a test in less than 1 week** — Day-of-week effects matter.

## Common Tests for Lead Gen

| Test | Variants |
|------|----------|
| CTA Text | "Get Quote" vs "Get Free Quote" vs "Start Now" |
| CTA Color | Primary vs Accent vs Contrasting |
| Form Length | 3 fields vs 5 fields |
| Social Proof | With reviews vs Without |
| Urgency | None vs "Limited slots" |
| Hero Image | Photo A vs Photo B |
| Headline | Benefit-focused vs Problem-focused |

## Results Analysis

```typescript
interface TestResults {
  variant: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
}

function analyzeTest(results: TestResults[]): {
  winner: string | null;
  confidence: number;
  significant: boolean;
} {
  // Sort by conversion rate
  const sorted = [...results].sort((a, b) => b.conversionRate - a.conversionRate);
  const best = sorted[0];
  const control = results.find(r => r.variant === 'control') || sorted[sorted.length - 1];

  // Chi-squared test (simplified)
  const observed = best.conversions;
  const expected = best.visitors * control.conversionRate;
  const chiSquared = Math.pow(observed - expected, 2) / expected;

  // p < 0.05 when chi-squared > 3.84 (1 df)
  const significant = chiSquared > 3.84;
  const confidence = significant ? 0.95 : chiSquared / 3.84 * 0.95;

  return {
    winner: significant ? best.variant : null,
    confidence,
    significant,
  };
}
```

## Forbidden

- ❌ Calling winners without significance
- ❌ Running less than 1 week
- ❌ Multiple tests on same element
- ❌ Changing tests mid-run
- ❌ Not tracking actual conversions
- ❌ Flicker (variant change visible)

## Definition of Done

- [ ] A/B test component implemented
- [ ] Variant assignment persisted
- [ ] Exposures tracked in GA4
- [ ] Conversions tracked in GA4
- [ ] No visible flicker
- [ ] Sample size calculated
- [ ] Test runs minimum 1 week
