/**
 * Price Calculation
 * Pure functions - no side effects, easy to test
 * 
 * CUSTOMIZE: Update CONFIG with your pricing structure
 */

import { formatPrice } from '../config/i18n';

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
  formatted: string;
}

// ============================================
// 🔧 CUSTOMIZE THIS CONFIG
// ============================================
const CONFIG = {
  currency: 'HUF',
  
  // Base prices by service type
  basePrices: {
    basic: 50000,
    standard: 80000,
    premium: 120000,
  } as Record<string, number>,
  
  // Size multipliers
  sizeMultipliers: {
    small: 1,      // <50m²
    medium: 1.5,   // 50-100m²
    large: 2,      // 100-150m²
    xlarge: 2.5,   // 150m²+
  } as Record<string, number>,
  
  // Extra services
  extras: {
    express: 15000,
    weekend: 10000,
    insurance: 20000,
    packing: 25000,
  } as Record<string, number>,
  
  // Discount codes (negative percentages)
  discounts: {
    returning: -0.1,   // -10%
    referral: -0.05,   // -5%
  } as Record<string, number>,
};

/**
 * Calculate price from answers
 */
export function calculatePrice(
  answers: Record<string, unknown>
): PriceResult {
  const breakdown: PriceBreakdownItem[] = [];
  
  // 1. Base price
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
      label: `Méret szorzó (×${multiplier})`,
      amount: Math.round(basePrice * (multiplier - 1)),
      type: 'multiplier',
    });
  }
  
  // 3. Extras
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
  
  // 4. Discounts
  const discountCode = answers['discount-code'] as string;
  if (discountCode && CONFIG.discounts[discountCode]) {
    const subtotal = breakdown.reduce((sum, i) => sum + i.amount, 0);
    const discountAmount = Math.round(subtotal * CONFIG.discounts[discountCode]);
    breakdown.push({
      key: 'discount',
      label: `Kedvezmény`,
      amount: discountAmount,
      type: 'discount',
    });
  }
  
  // Total
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
  
  return {
    total,
    currency: CONFIG.currency,
    breakdown,
    formatted: formatPrice(total),
  };
}

/**
 * Calculate price range (for "from X" pricing)
 */
export function calculatePriceRange(
  answers: Record<string, unknown>,
  variance: number = 0.15
): { min: number; max: number; formatted: string } {
  const { total } = calculatePrice(answers);
  const min = Math.round(total * (1 - variance));
  const max = Math.round(total * (1 + variance));
  
  return {
    min,
    max,
    formatted: `${formatPrice(min)} - ${formatPrice(max)}`,
  };
}
