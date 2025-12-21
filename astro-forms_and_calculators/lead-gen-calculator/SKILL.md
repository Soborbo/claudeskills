---
name: lead-gen-calculator
description: Multi-step lead generation calculator UI for Astro. Use when creating quote calculators, pricing tools, or step-by-step lead capture forms. Handles UX patterns, step logic, visual design, and client-side state. Requires astro-forms skill for backend (validation, email, sheets).
---

# Lead Gen Calculator

Multi-step calculator UI patterns. Uses **astro-forms** skill for form infrastructure.

## Quick Start

1. Ensure **astro-forms** skill is also loaded
2. Copy `assets/boilerplate/calculator/` to `src/calculator/`
3. Configure `config/site.ts` (locale, brand colors)
4. Define steps in `config/steps.ts`
5. Define options in `config/options.ts`
6. Configure social proof in `config/social-proof.ts`

## Directory Structure

```
src/calculator/
├── config/
│   ├── site.ts           # Brand, locale
│   ├── i18n.ts           # UI strings + t() + formatPrice()
│   ├── steps.ts          # Step definitions
│   ├── options.ts        # Options per step
│   └── social-proof.ts   # Per-step trust elements
├── components/
│   ├── RadioCard.astro
│   ├── ChecklistCard.astro
│   ├── DropdownSelect.astro
│   ├── ProgressBar.astro
│   ├── StickyMobileCTA.astro
│   ├── Toast.astro
│   ├── LoadingSkeleton.astro
│   └── PriceBreakdown.astro
├── lib/
│   ├── client.ts         # ALL client JS
│   ├── hash.ts           # Result URL hashing
│   ├── gtm.ts            # DataLayer events
│   └── pricing.ts        # Price calculation
├── layouts/
│   └── CalculatorLayout.astro
└── pages/
    ├── [step].astro
    └── eredmeny/[hash].astro
```

## Step Types & Auto-Advance

| Type | Behavior | Auto-advance |
|------|----------|--------------|
| `radio` | Single select | Yes (200ms) |
| `checkbox` | Multi-select | Yes when ALL selected |
| `dropdown` | Select menu | Yes on selection |
| `form` | Contact | No (submit) |

## Page Rules

- **No landing page** - starts with first question
- **No menu** on calculator pages
- **No description** under question title
- **Question centering** - vertical + horizontal (>768px)
- **CSP headers** in layout

## Visual Rules

- **Images**: Always 1:1 aspect ratio
- **Image cards**: Brand color background, white text
- **Social proof**: Different element under EVERY step
- **Minimal chrome**: Focus on question only

## Loading Strategy

```
1. First page: loading="eager" ALL assets
2. After first load → prefetch next step async
3. Loading skeletons during API calls
```

## Client Features

- **State persistence** - localStorage between steps
- **Browser back handling** - popstate listener, restore state
- **requestIdleCallback** - non-blocking operations
- **City autofill** - green flash animation (1s)
- **StickyMobileCTA** - mobile checkbox steps
- **Toast** - submit feedback

## GTM DataLayer Events

Push events for conversion tracking:

```typescript
// Step viewed
dataLayer.push({ event: 'calculator_step', step: stepId, stepIndex: 1 });

// Option selected
dataLayer.push({ event: 'calculator_option', step: stepId, value: optionValue });

// Form submitted
dataLayer.push({ event: 'calculator_submit', quoteId: 'Q-xxx' });

// Quote value (if price calc)
dataLayer.push({ event: 'calculator_value', value: 150000, currency: 'HUF' });
```

## Browser Back Handling

```typescript
// Restore state on popstate
window.addEventListener('popstate', (e) => {
  if (e.state?.calculatorStep) {
    restoreStep(e.state.calculatorStep);
  }
});

// Push state on navigation
history.pushState({ calculatorStep: stepId }, '', `/calculator/${stepSlug}`);
```

## Price Calculation

Optional pricing logic - pure functions, no side effects.

```typescript
// src/calculator/lib/pricing.ts
interface PriceResult {
  total: number;
  breakdown: Array<{ label: string; amount: number }>;
}

export function calculatePrice(answers: Record<string, unknown>): PriceResult {
  const breakdown: PriceResult['breakdown'] = [];
  
  // Base price by service type
  const basePrices = { basic: 50000, standard: 80000, premium: 120000 };
  const base = basePrices[answers['service-type'] as string] || 0;
  breakdown.push({ label: 'Alapár', amount: base });
  
  // Size multiplier
  const sizeMultipliers = { small: 1, medium: 1.5, large: 2, xlarge: 2.5 };
  const multiplier = sizeMultipliers[answers['property-size'] as string] || 1;
  
  // Extras
  const extras = answers['extras'] as string[] || [];
  const extraPrices = { express: 5000, weekend: 3000, insurance: 10000 };
  extras.forEach(extra => {
    const price = extraPrices[extra as keyof typeof extraPrices];
    if (price) breakdown.push({ label: extra, amount: price });
  });
  
  const extrasTotal = breakdown.slice(1).reduce((sum, i) => sum + i.amount, 0);
  const total = Math.round((base * multiplier) + extrasTotal);
  
  return { total, breakdown };
}
```

## Result Page

- URL: `/eredmeny/[hash]`
- Hash non-reversible, stored in Sheets
- Email link → same result page

## References

- **Components**: See [references/components.md](references/components.md)
- **Client logic**: See [references/client.md](references/client.md)
- **i18n**: See [references/i18n.md](references/i18n.md)
- **GTM events**: See [references/gtm.md](references/gtm.md)
- **Pricing**: See [references/pricing.md](references/pricing.md)

## Testing Checklist

- [ ] Starts with first question
- [ ] No menu visible
- [ ] Questions centered (desktop)
- [ ] Radio auto-advance (200ms)
- [ ] Checkbox auto-advance when all selected
- [ ] Dropdown auto-advance
- [ ] Different social proof per step
- [ ] Images 1:1 with white text on brand bg
- [ ] First page eager, next prefetch
- [ ] Loading skeleton during API
- [ ] StickyMobileCTA on mobile
- [ ] Toast on submit
- [ ] Hash result URL works
- [ ] `t()` and `formatPrice()` used
- [ ] Browser back restores state
- [ ] GTM dataLayer events firing
- [ ] Price calculation correct (if applicable)
