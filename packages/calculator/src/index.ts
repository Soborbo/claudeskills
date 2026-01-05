/**
 * @leadgen/calculator
 *
 * Config-driven multi-step calculator framework for Astro.
 *
 * @example
 * ```ts
 * import { defineCalculator } from '@leadgen/calculator';
 *
 * export const movingCalculator = defineCalculator({
 *   id: 'koltoztetes',
 *   title: 'Költöztetés Kalkulátor',
 *   steps: [
 *     {
 *       id: 'size',
 *       type: 'single-select',
 *       title: 'Mekkora a lakás?',
 *       options: [
 *         { value: 'small', label: '1-2 szobás', multiplier: 1 },
 *         { value: 'medium', label: '3-4 szobás', multiplier: 1.5 },
 *         { value: 'large', label: '5+ szobás', multiplier: 2 },
 *       ],
 *     },
 *     // ... more steps
 *   ],
 *   pricing: {
 *     base: 50000,
 *     variance: 0.15,
 *   },
 * });
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export type {
  // Step types
  BaseStep,
  SingleSelectStep,
  MultiSelectStep,
  NumberStep,
  RangeStep,
  TextStep,
  AddressStep,
  DateStep,
  ContactStep,
  DropdownStep,
  CalculatorStep,

  // Options
  SelectOption,

  // Pricing
  PricingConfig,
  PriceBreakdownItem,
  PriceResult,
  PricingData,
  StepAnswer,

  // Config & State
  CalculatorConfig,
  CalculatorState,
} from './types';

export { CALCULATOR_LIMITS } from './types';

// =============================================================================
// Pricing Engine
// =============================================================================

export { calculatePrice, calculatePriceRange, formatPrice } from './lib/pricing';

// =============================================================================
// defineCalculator Helper
// =============================================================================

import type { CalculatorConfig } from './types';
import { CALCULATOR_LIMITS } from './types';

/**
 * Define a calculator configuration with validation
 */
export function defineCalculator(config: CalculatorConfig): CalculatorConfig {
  // Validate step count
  if (config.steps.length > CALCULATOR_LIMITS.maxSteps) {
    console.warn(
      `[Calculator] "${config.id}" has ${config.steps.length} steps, max is ${CALCULATOR_LIMITS.maxSteps}`
    );
  }

  // Validate options count per step
  config.steps.forEach((step) => {
    if ('options' in step && step.options) {
      if (step.options.length > CALCULATOR_LIMITS.maxOptionsPerQuestion) {
        console.warn(
          `[Calculator] Step "${step.id}" has ${step.options.length} options, max is ${CALCULATOR_LIMITS.maxOptionsPerQuestion}`
        );
      }
    }
  });

  // Validate personal data placement (contact step should be last)
  const contactStepIndex = config.steps.findIndex((s) => s.type === 'contact');
  if (contactStepIndex !== -1 && contactStepIndex !== config.steps.length - 1) {
    console.warn(
      `[Calculator] Contact step should be the last step for GDPR compliance`
    );
  }

  // Set defaults
  return {
    currency: 'HUF',
    locale: 'hu-HU',
    ...config,
  };
}

/**
 * Get step by ID from config
 */
export function getStepById(
  config: CalculatorConfig,
  stepId: string
): CalculatorConfig['steps'][number] | undefined {
  return config.steps.find((s) => s.id === stepId);
}

/**
 * Get step index by ID
 */
export function getStepIndex(config: CalculatorConfig, stepId: string): number {
  return config.steps.findIndex((s) => s.id === stepId);
}

/**
 * Get next step ID
 */
export function getNextStepId(
  config: CalculatorConfig,
  currentStepId: string
): string | null {
  const currentIndex = getStepIndex(config, currentStepId);
  if (currentIndex === -1 || currentIndex >= config.steps.length - 1) {
    return null;
  }
  return config.steps[currentIndex + 1].id;
}

/**
 * Get previous step ID
 */
export function getPrevStepId(
  config: CalculatorConfig,
  currentStepId: string
): string | null {
  const currentIndex = getStepIndex(config, currentStepId);
  if (currentIndex <= 0) {
    return null;
  }
  return config.steps[currentIndex - 1].id;
}

/**
 * Check if all required steps are completed
 */
export function isCalculatorComplete(
  config: CalculatorConfig,
  answers: Record<string, unknown>
): boolean {
  return config.steps.every((step) => {
    if (step.optional) return true;
    return answers[step.id] !== undefined && answers[step.id] !== null;
  });
}

/**
 * Get completion percentage
 */
export function getCompletionPercentage(
  config: CalculatorConfig,
  answers: Record<string, unknown>
): number {
  const requiredSteps = config.steps.filter((s) => !s.optional);
  const completedSteps = requiredSteps.filter(
    (s) => answers[s.id] !== undefined && answers[s.id] !== null
  );
  return Math.round((completedSteps.length / requiredSteps.length) * 100);
}
