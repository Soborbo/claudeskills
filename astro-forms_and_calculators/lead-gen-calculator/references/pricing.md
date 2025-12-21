# Price Calculation Reference

Pure functions for quote pricing. No side effects, easy to test.

## Basic Structure

```typescript
// src/calculator/lib/pricing.ts

export interface PriceBreakdownItem {
  key: string;
  label: string;
  amount: number;
  type: 'base' | 'multiplier' | 'addon' | 'discount';
}

export interface PriceResult {
  total: number;
  currency: string;
  breakdown: PriceBreakdownItem[];
  formatted: string; // "150 000 Ft"
}

export interface PricingConfig {
  currency: string;
  locale: string;
  basePrices: Record<string, number>;
  sizeMultipliers: Record<string, number>;
  extras: Record<string, number>;
  discounts?: Record<string, number>;
}
```

## Example Implementation

```typescript
// src/calculator/lib/pricing.ts
import { formatPrice } from '../config/i18n';
import { siteConfig } from '../config/site';

const CONFIG: PricingConfig = {
  currency: 'HUF',
  locale: siteConfig.locale,
  
  basePrices: {
    basic: 50000,
    standard: 80000,
    premium: 120000,
  },
  
  sizeMultipliers: {
    small: 1,      // <50m²
    medium: 1.5,   // 50-100m²
    large: 2,      // 100-150m²
    xlarge: 2.5,   // 150m²+
  },
  
  extras: {
    express: 15000,    // Express delivery
    weekend: 10000,    // Weekend service
    insurance: 20000,  // Full insurance
    packing: 25000,    // Packing service
  },
  
  discounts: {
    returning: -0.1,   // -10% returning customer
    referral: -0.05,   // -5% referral
  },
};

export function calculatePrice(
  answers: Record<string, unknown>
): PriceResult {
  const breakdown: PriceBreakdownItem[] = [];
  
  // 1. Base price from service type
  const serviceType = answers['service-type'] as string;
  const basePrice = CONFIG.basePrices[serviceType] || 0;
  breakdown.push({
    key: 'base',
    label: 'Alapár',
    amount: basePrice,
    type: 'base',
  });
  
  // 2. Size multiplier
  const propertySize = answers['property-size'] as string;
  const multiplier = CONFIG.sizeMultipliers[propertySize] || 1;
  if (multiplier !== 1) {
    breakdown.push({
      key: 'size',
      label: `Méret (${propertySize})`,
      amount: Math.round(basePrice * (multiplier - 1)),
      type: 'multiplier',
    });
  }
  
  // 3. Extras (addons)
  const extras = (answers['extras'] as string[]) || [];
  extras.forEach(extra => {
    const price = CONFIG.extras[extra];
    if (price) {
      breakdown.push({
        key: extra,
        label: extra,
        amount: price,
        type: 'addon',
      });
    }
  });
  
  // 4. Discounts (optional)
  const discountCode = answers['discount-code'] as string;
  if (discountCode && CONFIG.discounts?.[discountCode]) {
    const subtotal = breakdown.reduce((sum, i) => sum + i.amount, 0);
    const discountAmount = Math.round(subtotal * CONFIG.discounts[discountCode]);
    breakdown.push({
      key: 'discount',
      label: `Kedvezmény (${discountCode})`,
      amount: discountAmount,
      type: 'discount',
    });
  }
  
  // Calculate total
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
  
  return {
    total,
    currency: CONFIG.currency,
    breakdown,
    formatted: formatPrice(total),
  };
}
```

## Usage

```typescript
// In result page or preview
const answers = loadState().answers;
const price = calculatePrice(answers);

console.log(price.formatted); // "150 000 Ft"
console.log(price.breakdown);
// [
//   { key: 'base', label: 'Alapár', amount: 80000, type: 'base' },
//   { key: 'size', label: 'Méret (large)', amount: 80000, type: 'multiplier' },
//   { key: 'express', label: 'express', amount: 15000, type: 'addon' },
// ]

// Push to GTM
gtm.value(price.total, price.currency);
```

## Display Component

```astro
---
// src/calculator/components/PriceBreakdown.astro
import type { PriceResult } from '../lib/pricing';
import { siteConfig } from '../config/site';
import { i18n, formatPrice } from '../config/i18n';

interface Props {
  price: PriceResult;
}

const { price } = Astro.props;
const t = i18n[siteConfig.locale];
---

<div class="bg-white rounded-xl p-6 shadow-sm border">
  <h3 class="font-semibold text-lg mb-4">{t.priceBreakdown}</h3>
  
  <div class="space-y-2">
    {price.breakdown.map(item => (
      <div class="flex justify-between text-sm">
        <span class={item.type === 'discount' ? 'text-green-600' : 'text-gray-600'}>
          {item.label}
        </span>
        <span class={item.type === 'discount' ? 'text-green-600' : ''}>
          {formatPrice(item.amount)}
        </span>
      </div>
    ))}
  </div>
  
  <div class="border-t mt-4 pt-4 flex justify-between font-semibold text-lg">
    <span>{t.total}</span>
    <span class="text-primary">{price.formatted}</span>
  </div>
</div>
```

## Testing

```typescript
// pricing.test.ts
import { calculatePrice } from './pricing';

describe('calculatePrice', () => {
  it('calculates base price correctly', () => {
    const result = calculatePrice({ 'service-type': 'standard' });
    expect(result.total).toBe(80000);
  });
  
  it('applies size multiplier', () => {
    const result = calculatePrice({ 
      'service-type': 'standard',
      'property-size': 'large',
    });
    expect(result.total).toBe(160000); // 80000 * 2
  });
  
  it('adds extras', () => {
    const result = calculatePrice({ 
      'service-type': 'basic',
      'property-size': 'small',
      'extras': ['express', 'insurance'],
    });
    expect(result.total).toBe(50000 + 15000 + 20000);
  });
});
```

## Range Pricing (Optional)

For "from X" pricing:

```typescript
export function calculatePriceRange(
  answers: Record<string, unknown>
): { min: number; max: number; formatted: string } {
  const base = calculatePrice(answers);
  const variance = 0.15; // ±15%
  
  return {
    min: Math.round(base.total * (1 - variance)),
    max: Math.round(base.total * (1 + variance)),
    formatted: `${formatPrice(base.min)} - ${formatPrice(base.max)}`,
  };
}
```
