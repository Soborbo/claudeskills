# Statistical Analysis

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
