/**
 * GTM DataLayer Integration
 * Push events for conversion tracking
 */

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

function push(data: Record<string, unknown>): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
  
  // Debug mode in dev
  if (import.meta.env.DEV) {
    console.log('[GTM]', data);
  }
}

export const gtm = {
  /**
   * Calculator started
   */
  start(sessionId: string) {
    push({ event: 'calculator_start', sessionId });
  },
  
  /**
   * Step viewed
   */
  step(stepId: string, stepIndex: number) {
    push({ 
      event: 'calculator_step', 
      step: stepId, 
      stepIndex,
      stepName: stepId,
    });
  },
  
  /**
   * Option selected
   */
  option(stepId: string, value: string | string[]) {
    push({ 
      event: 'calculator_option', 
      step: stepId, 
      value: Array.isArray(value) ? value.join(',') : value,
    });
  },
  
  /**
   * Form submitted (conversion)
   */
  submit(quoteId: string) {
    push({ 
      event: 'calculator_submit', 
      quoteId,
      conversionType: 'lead',
    });
  },
  
  /**
   * Quote value calculated
   */
  value(amount: number, currency: string = 'HUF') {
    push({ 
      event: 'calculator_value', 
      value: amount,
      currency,
    });
  },
};
