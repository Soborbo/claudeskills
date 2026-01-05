/**
 * @leadgen/calculator - State Management
 *
 * localStorage persistence and state management.
 * CLIENT-ONLY - Do not import in server context.
 */

import type { CalculatorState } from '../types';

// Browser guard - soft warning instead of throw to avoid SSR crashes
const IS_BROWSER = typeof window !== 'undefined';

if (!IS_BROWSER) {
  console.warn('[Calculator] @leadgen/calculator/client/state should only be imported in browser context');
}

// =============================================================================
// Constants
// =============================================================================

const STORAGE_PREFIX = 'calc_';
const STATE_VERSION = 1;

// =============================================================================
// Storage Helpers
// =============================================================================

function getStorageKey(calculatorId: string): string {
  return `${STORAGE_PREFIX}${calculatorId}_v${STATE_VERSION}`;
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// State Management
// =============================================================================

/**
 * Get calculator state from localStorage
 */
export function getState(calculatorId: string): CalculatorState {
  const key = getStorageKey(calculatorId);
  const stored = safeGetItem(key);

  if (stored) {
    try {
      return JSON.parse(stored) as CalculatorState;
    } catch {
      // Invalid JSON, reset
    }
  }

  // Default state
  return {
    currentStep: 0,
    answers: {},
    startedAt: Date.now(),
  };
}

/**
 * Save calculator state to localStorage
 */
export function setState(calculatorId: string, state: Partial<CalculatorState>): void {
  const key = getStorageKey(calculatorId);
  const current = getState(calculatorId);

  const newState: CalculatorState = {
    ...current,
    ...state,
  };

  safeSetItem(key, JSON.stringify(newState));
}

/**
 * Set a single answer
 */
export function setAnswer(calculatorId: string, stepId: string, value: unknown): void {
  const state = getState(calculatorId);
  state.answers[stepId] = value;
  setState(calculatorId, { answers: state.answers });
}

/**
 * Get a single answer
 */
export function getAnswer(calculatorId: string, stepId: string): unknown {
  const state = getState(calculatorId);
  return state.answers[stepId];
}

/**
 * Get all answers
 */
export function getAnswers(calculatorId: string): Record<string, unknown> {
  return getState(calculatorId).answers;
}

/**
 * Clear calculator state
 */
export function clearState(calculatorId: string): void {
  const key = getStorageKey(calculatorId);
  safeRemoveItem(key);
}

/**
 * Set current step
 */
export function setCurrentStep(calculatorId: string, stepIndex: number): void {
  setState(calculatorId, { currentStep: stepIndex });
}

/**
 * Get current step
 */
export function getCurrentStep(calculatorId: string): number {
  return getState(calculatorId).currentStep;
}

/**
 * Generate quote ID
 */
export function generateQuoteId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `Q-${timestamp}-${random}`.toUpperCase();
}

/**
 * Set quote ID
 */
export function setQuoteId(calculatorId: string, quoteId: string): void {
  setState(calculatorId, { quoteId });
}

/**
 * Get quote ID (generate if not exists)
 */
export function getQuoteId(calculatorId: string): string {
  const state = getState(calculatorId);
  if (!state.quoteId) {
    const quoteId = generateQuoteId();
    setQuoteId(calculatorId, quoteId);
    return quoteId;
  }
  return state.quoteId;
}
