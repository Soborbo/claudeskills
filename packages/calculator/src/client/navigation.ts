/**
 * @leadgen/calculator - Navigation
 *
 * Step navigation, history handling, and auto-advance.
 * CLIENT-ONLY - Do not import in server context.
 */

import { setCurrentStep, getCurrentStep, setAnswer, getAnswers } from './state';
import { trackStepView, trackOptionSelect } from './events';

// Browser guard - soft warning instead of throw to avoid SSR crashes
const IS_BROWSER = typeof window !== 'undefined';

if (!IS_BROWSER) {
  console.warn('[Calculator] @leadgen/calculator/client/navigation should only be imported in browser context');
}

// =============================================================================
// Types
// =============================================================================

interface NavigationConfig {
  calculatorId: string;
  steps: string[];
  onStepChange?: (stepIndex: number, stepId: string) => void;
  basePath?: string;
}

// =============================================================================
// State
// =============================================================================

let config: NavigationConfig | null = null;
let initialized = false;
let popstateHandler: ((event: PopStateEvent) => void) | null = null;

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize navigation for calculator
 */
export function initNavigation(navConfig: NavigationConfig): void {
  if (initialized) return;

  config = navConfig;
  initialized = true;

  // Initialize history state
  initHistoryHandler();

  // Track initial step view
  const currentStep = getCurrentStep(config.calculatorId);
  const stepId = config.steps[currentStep];
  if (stepId) {
    trackStepView(config.calculatorId, stepId, currentStep);
  }
}

/**
 * Initialize browser history handler
 */
function initHistoryHandler(): void {
  if (!config) return;

  // Replace current state
  const currentStep = getCurrentStep(config.calculatorId);
  const stepId = config.steps[currentStep];

  history.replaceState(
    { calculatorStep: currentStep, stepId },
    '',
    window.location.href
  );

  // Remove previous handler if exists (prevents memory leak)
  if (popstateHandler) {
    window.removeEventListener('popstate', popstateHandler);
  }

  // Create new handler
  popstateHandler = (event: PopStateEvent) => {
    if (event.state?.calculatorStep !== undefined) {
      navigateToStep(event.state.calculatorStep, false);
    }
  };

  // Listen for back/forward
  window.addEventListener('popstate', popstateHandler);
}

/**
 * Cleanup navigation - call when calculator is destroyed
 */
export function destroyNavigation(): void {
  if (popstateHandler) {
    window.removeEventListener('popstate', popstateHandler);
    popstateHandler = null;
  }
  initialized = false;
  config = null;
}

// =============================================================================
// Navigation Functions
// =============================================================================

/**
 * Navigate to next step
 */
export function navigateToNextStep(): void {
  if (!config) return;

  const currentStep = getCurrentStep(config.calculatorId);
  if (currentStep < config.steps.length - 1) {
    navigateToStep(currentStep + 1);
  }
}

/**
 * Navigate to previous step
 */
export function navigateToPrevStep(): void {
  if (!config) return;

  const currentStep = getCurrentStep(config.calculatorId);
  if (currentStep > 0) {
    history.back();
  }
}

/**
 * Navigate to specific step
 */
export function navigateToStep(stepIndex: number, pushState = true): void {
  if (!config) return;
  if (stepIndex < 0 || stepIndex >= config.steps.length) return;

  const stepId = config.steps[stepIndex];

  // Update state
  setCurrentStep(config.calculatorId, stepIndex);

  // Push history state
  if (pushState) {
    const url = config.basePath
      ? `${config.basePath}/${stepId}`
      : `#step-${stepIndex}`;

    history.pushState(
      { calculatorStep: stepIndex, stepId },
      '',
      url
    );
  }

  // Track step view
  trackStepView(config.calculatorId, stepId, stepIndex);

  // Callback
  if (config.onStepChange) {
    config.onStepChange(stepIndex, stepId);
  }

  // Dispatch custom event
  window.dispatchEvent(
    new CustomEvent('calculator:step-change', {
      detail: { stepIndex, stepId, calculatorId: config.calculatorId },
    })
  );
}

/**
 * Get current step info
 */
export function getCurrentStepInfo(): { index: number; id: string } | null {
  if (!config) return null;

  const index = getCurrentStep(config.calculatorId);
  const id = config.steps[index];

  return { index, id };
}

/**
 * Check if on first step
 */
export function isFirstStep(): boolean {
  if (!config) return true;
  return getCurrentStep(config.calculatorId) === 0;
}

/**
 * Check if on last step
 */
export function isLastStep(): boolean {
  if (!config) return false;
  return getCurrentStep(config.calculatorId) === config.steps.length - 1;
}

/**
 * Get total steps count
 */
export function getTotalSteps(): number {
  return config?.steps.length || 0;
}

// =============================================================================
// Auto-Advance
// =============================================================================

/** Auto-advance delay for radio buttons (ms) */
const AUTO_ADVANCE_DELAY = 200;

/**
 * Initialize auto-advance for radio buttons
 */
export function initRadioAutoAdvance(container: HTMLElement): void {
  if (!config) return;

  const delay = parseInt(container.dataset.autoAdvance || '') || AUTO_ADVANCE_DELAY;

  container.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;

      // Save answer
      setAnswer(config!.calculatorId, target.name, target.value);

      // Track selection
      trackOptionSelect(config!.calculatorId, target.name, target.value);

      // Auto-advance after delay
      setTimeout(() => {
        navigateToNextStep();
      }, delay);
    });
  });
}

/**
 * Initialize auto-advance for checkboxes (with min selection)
 */
export function initCheckboxHandler(container: HTMLElement): void {
  if (!config) return;

  const minSelect = parseInt(container.dataset.minSelect || '1');
  const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
  const nextButton = container.querySelector<HTMLButtonElement>('[data-next-step]');

  const updateState = () => {
    const checked = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
    const values = Array.from(checked).map((el) => el.value);

    // Get step name from first checkbox
    const name = checkboxes[0]?.name;
    if (name) {
      setAnswer(config!.calculatorId, name, values);
    }

    // Enable/disable next button
    if (nextButton) {
      nextButton.disabled = checked.length < minSelect;
    }
  };

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', updateState);
  });

  // Handle next button click
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      navigateToNextStep();
    });
  }
}

/**
 * Initialize auto-advance for dropdowns
 */
export function initDropdownAutoAdvance(select: HTMLSelectElement): void {
  if (!config) return;

  select.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;

    if (target.value) {
      setAnswer(config!.calculatorId, target.name, target.value);
      trackOptionSelect(config!.calculatorId, target.name, target.value);

      if (select.dataset.autoAdvance !== 'false') {
        navigateToNextStep();
      }
    }
  });
}

/**
 * Initialize number input
 */
export function initNumberInput(container: HTMLElement): void {
  if (!config) return;

  const input = container.querySelector<HTMLInputElement>('input[type="number"]');
  const minusBtn = container.querySelector<HTMLButtonElement>('[data-minus]');
  const plusBtn = container.querySelector<HTMLButtonElement>('[data-plus]');

  if (!input) return;

  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || Infinity;
  const step = parseFloat(input.step) || 1;

  const updateValue = (delta: number) => {
    const currentValue = parseFloat(input.value) || 0;
    const newValue = Math.max(min, Math.min(max, currentValue + delta));
    input.value = newValue.toString();
    setAnswer(config!.calculatorId, input.name, newValue);

    // Update button states
    if (minusBtn) minusBtn.disabled = newValue <= min;
    if (plusBtn) plusBtn.disabled = newValue >= max;
  };

  minusBtn?.addEventListener('click', () => updateValue(-step));
  plusBtn?.addEventListener('click', () => updateValue(step));

  input.addEventListener('change', () => {
    const value = parseFloat(input.value) || 0;
    setAnswer(config!.calculatorId, input.name, value);
  });
}

// =============================================================================
// Prefetching
// =============================================================================

/**
 * Prefetch next step
 */
export function prefetchNextStep(): void {
  if (!config) return;

  const currentStep = getCurrentStep(config.calculatorId);
  if (currentStep < config.steps.length - 1) {
    const nextStepId = config.steps[currentStep + 1];
    const url = config.basePath
      ? `${config.basePath}/${nextStepId}`
      : undefined;

    if (url) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    }
  }
}

/**
 * Initialize prefetching (using requestIdleCallback)
 */
export function initPrefetch(): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => prefetchNextStep());
  } else {
    setTimeout(() => prefetchNextStep(), 100);
  }
}
