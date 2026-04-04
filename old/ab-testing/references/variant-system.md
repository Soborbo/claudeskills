# Variant System Implementation

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
