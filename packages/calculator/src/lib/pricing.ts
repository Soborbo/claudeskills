/**
 * @leadgen/calculator - Pricing Engine
 *
 * Calculate prices from calculator answers.
 */

import type {
  CalculatorConfig,
  CalculatorStep,
  PricingConfig,
  PriceResult,
  PriceBreakdownItem,
  PricingData,
  StepAnswer,
  SelectOption,
  SingleSelectStep,
  MultiSelectStep,
  NumberStep,
  DateStep,
} from '../types';

// =============================================================================
// Price Formatting
// =============================================================================

/**
 * Format price for display
 */
export function formatPrice(
  amount: number,
  currency: string = 'HUF',
  locale: string = 'hu-HU'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// =============================================================================
// Step Answer Processing
// =============================================================================

/**
 * Get step answer with metadata
 */
function getStepAnswer(
  step: CalculatorStep,
  answer: unknown
): StepAnswer {
  const result: StepAnswer = { value: answer };

  // Single select - find selected option
  if (step.type === 'single-select') {
    const selectStep = step as SingleSelectStep;
    const option = selectStep.options.find((o) => o.value === answer);
    if (option) {
      result.option = option;
      result.multiplier = option.multiplier;
      result.price = option.price;
    }
  }

  // Multi select - find all selected options
  if (step.type === 'multi-select' && Array.isArray(answer)) {
    const multiStep = step as MultiSelectStep;
    result.options = multiStep.options.filter((o) => answer.includes(o.value));
    result.price = result.options.reduce((sum, o) => sum + (o.price || 0), 0);
  }

  // Number input - include pricing config
  if (step.type === 'number') {
    const numberStep = step as NumberStep;
    result.pricing = numberStep.pricing;
  }

  // Date - check if weekend
  if (step.type === 'date' && answer) {
    const date = new Date(answer as string);
    const dayOfWeek = date.getDay();
    result.isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  }

  return result;
}

// =============================================================================
// Price Calculation
// =============================================================================

/**
 * Calculate price from answers
 */
export function calculatePrice(
  config: CalculatorConfig,
  answers: Record<string, unknown>
): PriceResult {
  const pricing = config.pricing;

  if (!pricing) {
    return {
      total: 0,
      currency: config.currency || 'HUF',
      breakdown: [],
      formatted: formatPrice(0, config.currency, config.locale),
    };
  }

  const currency = config.currency || 'HUF';
  const locale = config.locale || 'hu-HU';
  const breakdown: PriceBreakdownItem[] = [];

  // Build step answers with metadata
  const stepAnswers: Record<string, StepAnswer> = {};
  config.steps.forEach((step) => {
    if (answers[step.id] !== undefined) {
      stepAnswers[step.id] = getStepAnswer(step, answers[step.id]);
    }
  });

  // Prepare pricing data for custom formula
  const pricingData: PricingData = {
    base: pricing.base,
    currency,
    distancePerKm: pricing.distancePerKm || 0,
    steps: stepAnswers,
    answers,
  };

  // If custom formula provided, use it
  if (pricing.formula) {
    const total = pricing.formula(pricingData);
    return {
      total,
      currency,
      breakdown: [{ key: 'total', label: 'Összesen', amount: total, type: 'base' }],
      formatted: formatPrice(total, currency, locale),
    };
  }

  // Default calculation logic
  let subtotal = 0;

  // 1. Base price
  breakdown.push({
    key: 'base',
    label: 'Alapár',
    amount: pricing.base,
    type: 'base',
  });
  subtotal = pricing.base;

  // 2. Process each step
  config.steps.forEach((step) => {
    const stepAnswer = stepAnswers[step.id];
    if (!stepAnswer) return;

    // Multiplier from single select
    if (stepAnswer.multiplier && stepAnswer.multiplier !== 1) {
      const multiplierAmount = Math.round(pricing.base * (stepAnswer.multiplier - 1));
      breakdown.push({
        key: `${step.id}_multiplier`,
        label: `${step.title} (×${stepAnswer.multiplier})`,
        amount: multiplierAmount,
        type: 'multiplier',
      });
      subtotal += multiplierAmount;
    }

    // Fixed price from single select
    if (stepAnswer.option?.price) {
      breakdown.push({
        key: step.id,
        label: stepAnswer.option.label,
        amount: stepAnswer.option.price,
        type: 'addon',
      });
      subtotal += stepAnswer.option.price;
    }

    // Multi-select prices
    if (stepAnswer.options && stepAnswer.options.length > 0) {
      stepAnswer.options.forEach((opt) => {
        if (opt.price) {
          breakdown.push({
            key: `${step.id}_${opt.value}`,
            label: opt.label,
            amount: opt.price,
            type: 'addon',
          });
          subtotal += opt.price;
        }
      });
    }

    // Number input with per-unit pricing
    if (stepAnswer.pricing?.perUnit && typeof stepAnswer.value === 'number') {
      const unitAmount = stepAnswer.value * stepAnswer.pricing.perUnit;
      if (unitAmount > 0) {
        breakdown.push({
          key: `${step.id}_units`,
          label: `${step.title} (${stepAnswer.value}×)`,
          amount: unitAmount,
          type: 'addon',
        });
        subtotal += unitAmount;
      }
    }

    // Weekend pricing for dates
    if (step.type === 'date' && stepAnswer.isWeekend) {
      const dateStep = step as DateStep;
      if (dateStep.weekendPricing && dateStep.weekendPricing !== 1) {
        const weekendAmount = Math.round(subtotal * (dateStep.weekendPricing - 1));
        breakdown.push({
          key: 'weekend',
          label: 'Hétvégi felár',
          amount: weekendAmount,
          type: 'multiplier',
        });
        subtotal += weekendAmount;
      }
    }
  });

  // 3. Calculate total (round to avoid floating point errors)
  const total = Math.round(breakdown.reduce((sum, item) => sum + item.amount, 0));

  // 4. Build result
  const result: PriceResult = {
    total,
    currency,
    breakdown,
    formatted: formatPrice(total, currency, locale),
  };

  // 5. Add range if variance specified
  if (pricing.variance) {
    const min = Math.round(total * (1 - pricing.variance));
    const max = Math.round(total * (1 + pricing.variance));
    result.range = {
      min,
      max,
      formatted: `${formatPrice(min, currency, locale)} - ${formatPrice(max, currency, locale)}`,
    };
  }

  return result;
}

/**
 * Calculate price range (shorthand)
 */
export function calculatePriceRange(
  config: CalculatorConfig,
  answers: Record<string, unknown>,
  variance: number = 0.15
): { min: number; max: number; formatted: string } {
  const result = calculatePrice(
    { ...config, pricing: { ...config.pricing!, variance } },
    answers
  );

  return result.range || {
    min: result.total,
    max: result.total,
    formatted: result.formatted,
  };
}
