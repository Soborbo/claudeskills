/**
 * @leadgen/calculator - GTM Events
 *
 * DataLayer event tracking for calculator interactions.
 * CLIENT-ONLY - Do not import in server context.
 */

import type { CalculatorEvent, CalculatorEventType } from '../types';

// Browser guard - soft warning instead of throw to avoid SSR crashes
const IS_BROWSER = typeof window !== 'undefined';

if (!IS_BROWSER) {
  console.warn('[Calculator] @leadgen/calculator/client/events should only be imported in browser context');
}

// =============================================================================
// DataLayer
// =============================================================================

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Push event to GTM dataLayer
 */
function pushEvent(event: CalculatorEvent): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event as unknown as Record<string, unknown>);
}

// =============================================================================
// Event Functions
// =============================================================================

/**
 * Track calculator start (first interaction)
 */
export function trackStart(calculatorId: string): void {
  pushEvent({
    event: 'calculator_start',
    calculator_name: calculatorId,
  });
}

/**
 * Track step view
 */
export function trackStepView(
  calculatorId: string,
  stepId: string,
  stepIndex: number
): void {
  pushEvent({
    event: 'calculator_step',
    calculator_name: calculatorId,
    step: stepId,
    step_index: stepIndex,
  });
}

/**
 * Track option selection
 */
export function trackOptionSelect(
  calculatorId: string,
  stepId: string,
  value: string
): void {
  pushEvent({
    event: 'calculator_option',
    calculator_name: calculatorId,
    step: stepId,
    value,
  });
}

/**
 * Track form submission
 */
export function trackSubmit(calculatorId: string, quoteId: string): void {
  pushEvent({
    event: 'calculator_submit',
    calculator_name: calculatorId,
    quote_id: quoteId,
  });
}

/**
 * Track quote value (price calculated)
 */
export function trackValue(
  calculatorId: string,
  value: number,
  currency: string = 'HUF'
): void {
  pushEvent({
    event: 'calculator_value',
    calculator_name: calculatorId,
    value,
    currency,
  });
}

/**
 * Track calculator completion (result shown)
 */
export function trackComplete(
  calculatorId: string,
  quoteId: string,
  value?: number,
  currency?: string
): void {
  pushEvent({
    event: 'calculator_complete',
    calculator_name: calculatorId,
    quote_id: quoteId,
    ...(value !== undefined && { value }),
    ...(currency && { currency }),
  });
}

// =============================================================================
// Conversion Tracking (Google Ads / Meta)
// =============================================================================

/**
 * Track conversion event (for Google Ads)
 */
export function trackConversion(
  calculatorId: string,
  quoteId: string,
  value: number,
  currency: string = 'HUF',
  email?: string,
  phone?: string
): void {
  // Push to dataLayer for GTM to pick up
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'conversion',
    transaction_id: quoteId,
    value,
    currency,
    calculator_name: calculatorId,
    ...(email && {
      user_provided_data: {
        email: email.trim().toLowerCase(),
        ...(phone && { phone_number: phone.replace(/\s/g, '') }),
      },
    }),
  });

  // Also track with Zaraz if available
  if ((window as any).zaraz?.track) {
    try {
      (window as any).zaraz.track('Lead', {
        value,
        currency,
        event_id: quoteId,
        ...(email && { email: email.trim().toLowerCase() }),
        ...(phone && { phone }),
      });
    } catch (e) {
      console.error('[Calculator] Zaraz tracking error:', e);
    }
  }
}

// =============================================================================
// Debug
// =============================================================================

/**
 * Get all calculator events from dataLayer
 */
export function getCalculatorEvents(): Record<string, unknown>[] {
  if (!window.dataLayer) return [];

  return window.dataLayer.filter((event) => {
    const eventName = event.event as string;
    return eventName?.startsWith('calculator_');
  });
}
