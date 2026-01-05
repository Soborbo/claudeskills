/**
 * @leadgen/calculator/client
 *
 * Client-side calculator functionality.
 * CLIENT-ONLY - Do not import in server context.
 */

// Browser guard
if (typeof window === 'undefined') {
  throw new Error('@leadgen/calculator/client can only be used in browser');
}

// =============================================================================
// Re-exports
// =============================================================================

// State management
export {
  getState,
  setState,
  setAnswer,
  getAnswer,
  getAnswers,
  clearState,
  setCurrentStep,
  getCurrentStep,
  generateQuoteId,
  setQuoteId,
  getQuoteId,
} from './state';

// Navigation
export {
  initNavigation,
  navigateToNextStep,
  navigateToPrevStep,
  navigateToStep,
  getCurrentStepInfo,
  isFirstStep,
  isLastStep,
  getTotalSteps,
  initRadioAutoAdvance,
  initCheckboxHandler,
  initDropdownAutoAdvance,
  initNumberInput,
  prefetchNextStep,
  initPrefetch,
} from './navigation';

// Events
export {
  trackStart,
  trackStepView,
  trackOptionSelect,
  trackSubmit,
  trackValue,
  trackComplete,
  trackConversion,
  getCalculatorEvents,
} from './events';

// =============================================================================
// Main Initialization
// =============================================================================

import type { CalculatorConfig } from '../types';
import { initNavigation, initPrefetch } from './navigation';
import { trackStart } from './events';
import { getState } from './state';

interface InitOptions {
  config: CalculatorConfig;
  onStepChange?: (stepIndex: number, stepId: string) => void;
  basePath?: string;
}

/**
 * Initialize calculator with all client-side functionality
 */
export function initCalculator(options: InitOptions): void {
  const { config, onStepChange, basePath } = options;

  // Initialize navigation
  initNavigation({
    calculatorId: config.id,
    steps: config.steps.map((s) => s.id),
    onStepChange,
    basePath,
  });

  // Track start if first interaction
  const state = getState(config.id);
  if (Object.keys(state.answers).length === 0) {
    trackStart(config.id);
  }

  // Initialize prefetching
  initPrefetch();

  // Listen for step changes to re-init components
  window.addEventListener('calculator:step-change', () => {
    initPrefetch();
  });

  // Debug mode
  if (config.debug) {
    console.log('[Calculator] Initialized:', config.id);
    console.log('[Calculator] State:', state);
  }
}

/**
 * Auto-initialize all step components on current page
 */
export function initStepComponents(): void {
  // Radio cards with auto-advance
  document.querySelectorAll<HTMLElement>('[data-auto-advance]').forEach((container) => {
    const { initRadioAutoAdvance } = require('./navigation');
    initRadioAutoAdvance(container);
  });

  // Checkbox groups
  document.querySelectorAll<HTMLElement>('[data-min-select]').forEach((container) => {
    const { initCheckboxHandler } = require('./navigation');
    initCheckboxHandler(container);
  });

  // Dropdowns
  document.querySelectorAll<HTMLSelectElement>('select[data-calculator-select]').forEach((select) => {
    const { initDropdownAutoAdvance } = require('./navigation');
    initDropdownAutoAdvance(select);
  });

  // Number inputs
  document.querySelectorAll<HTMLElement>('[data-number-input]').forEach((container) => {
    const { initNumberInput } = require('./navigation');
    initNumberInput(container);
  });
}
