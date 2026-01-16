/**
 * @leadgen/conversion-tracking - Form Field Analytics
 *
 * Track form field interactions, hesitation, and friction points.
 */

import { getDataLayer } from './dataLayer';
import { getOrCreateSessionId } from './session';
import { TRACKING_VERSION, log } from './constants';

// =============================================================================
// Types
// =============================================================================

export interface FormFieldOptions {
  /** Track time spent in each field */
  trackFocusTime?: boolean;
  /** Track hesitation between fields */
  trackHesitation?: boolean;
  /** Track corrections (backspaces, re-typing) */
  trackCorrections?: boolean;
  /** Track field order/sequence */
  trackSequence?: boolean;
  /** Minimum focus time to count (ms) */
  minFocusTime?: number;
  /** Push events to dataLayer */
  pushToDataLayer?: boolean;
}

export interface FieldMetrics {
  field: string;
  focusCount: number;
  totalFocusTime: number;
  avgFocusTime: number;
  corrections: number;
  hesitationBefore: number;
  filledAt: number | null;
  sequence: number;
}

export interface FormMetrics {
  formId: string;
  fields: Record<string, FieldMetrics>;
  totalTime: number;
  startedAt: number;
  fieldSequence: string[];
  abandonedAt: string | null;
  completionRate: number;
}

interface FieldState {
  focusStart: number | null;
  totalFocusTime: number;
  focusCount: number;
  corrections: number;
  lastBlurTime: number | null;
  hesitationBefore: number;
  filledAt: number | null;
  initialValue: string;
  sequence: number;
}

// =============================================================================
// Form Tracker Class
// =============================================================================

const trackedForms = new Map<string, FormTracker>();

class FormTracker {
  private form: HTMLFormElement;
  private formId: string;
  private options: Required<FormFieldOptions>;
  private fields: Map<string, FieldState> = new Map();
  private startedAt: number;
  private fieldSequence: string[] = [];
  private sequenceCounter = 0;
  private lastBlurTime: number | null = null;

  constructor(form: HTMLFormElement, formId: string, options: FormFieldOptions = {}) {
    this.form = form;
    this.formId = formId;
    this.options = {
      trackFocusTime: options.trackFocusTime ?? true,
      trackHesitation: options.trackHesitation ?? true,
      trackCorrections: options.trackCorrections ?? true,
      trackSequence: options.trackSequence ?? true,
      minFocusTime: options.minFocusTime ?? 100,
      pushToDataLayer: options.pushToDataLayer ?? true,
    };
    this.startedAt = Date.now();

    this.setupListeners();
    log(`Form tracking started: ${formId}`);
  }

  private setupListeners(): void {
    // Focus/blur for timing
    this.form.addEventListener('focusin', this.handleFocusIn.bind(this));
    this.form.addEventListener('focusout', this.handleFocusOut.bind(this));

    // Input for corrections tracking
    if (this.options.trackCorrections) {
      this.form.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    // Submit
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  private getFieldName(element: HTMLElement): string | null {
    if (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement) {
      return element.name || element.id || null;
    }
    return null;
  }

  private getOrCreateFieldState(fieldName: string): FieldState {
    if (!this.fields.has(fieldName)) {
      this.fields.set(fieldName, {
        focusStart: null,
        totalFocusTime: 0,
        focusCount: 0,
        corrections: 0,
        lastBlurTime: null,
        hesitationBefore: 0,
        filledAt: null,
        initialValue: '',
        sequence: 0,
      });
    }
    return this.fields.get(fieldName)!;
  }

  private handleFocusIn(e: FocusEvent): void {
    const fieldName = this.getFieldName(e.target as HTMLElement);
    if (!fieldName) return;

    const state = this.getOrCreateFieldState(fieldName);
    const now = Date.now();

    // Track focus time
    if (this.options.trackFocusTime) {
      state.focusStart = now;
      state.focusCount++;
    }

    // Track hesitation (time since last field blur)
    if (this.options.trackHesitation && this.lastBlurTime) {
      state.hesitationBefore = now - this.lastBlurTime;
    }

    // Track sequence
    if (this.options.trackSequence && !this.fieldSequence.includes(fieldName)) {
      this.sequenceCounter++;
      state.sequence = this.sequenceCounter;
      this.fieldSequence.push(fieldName);
    }

    // Store initial value for correction tracking
    if (this.options.trackCorrections) {
      const element = e.target as HTMLInputElement;
      state.initialValue = element.value || '';
    }
  }

  private handleFocusOut(e: FocusEvent): void {
    const fieldName = this.getFieldName(e.target as HTMLElement);
    if (!fieldName) return;

    const state = this.getOrCreateFieldState(fieldName);
    const now = Date.now();

    // Calculate focus time
    if (this.options.trackFocusTime && state.focusStart) {
      const focusTime = now - state.focusStart;
      if (focusTime >= this.options.minFocusTime) {
        state.totalFocusTime += focusTime;
      }
      state.focusStart = null;
    }

    // Track when field was filled
    const element = e.target as HTMLInputElement;
    if (element.value && !state.filledAt) {
      state.filledAt = now;
    }

    this.lastBlurTime = now;
    state.lastBlurTime = now;

    // Push field interaction event
    if (this.options.pushToDataLayer) {
      this.pushFieldEvent(fieldName, state);
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return;

    const fieldName = this.getFieldName(e.target as HTMLElement);
    if (!fieldName) return;

    const state = this.getOrCreateFieldState(fieldName);
    state.corrections++;
  }

  private handleSubmit(): void {
    if (this.options.pushToDataLayer) {
      this.pushFormMetrics();
    }
  }

  private pushFieldEvent(fieldName: string, state: FieldState): void {
    const dataLayer = getDataLayer();
    if (!dataLayer) return;

    dataLayer.push({
      event: 'form_field_interaction',
      form_id: this.formId,
      field_name: fieldName,
      focus_time: Math.round(state.totalFocusTime / 1000 * 10) / 10, // seconds, 1 decimal
      focus_count: state.focusCount,
      corrections: state.corrections,
      hesitation: Math.round(state.hesitationBefore / 1000 * 10) / 10,
      field_sequence: state.sequence,
      tracking_version: TRACKING_VERSION,
      session_id: getOrCreateSessionId(),
    });
  }

  private pushFormMetrics(): void {
    const dataLayer = getDataLayer();
    if (!dataLayer) return;

    const metrics = this.getMetrics();

    dataLayer.push({
      event: 'form_analytics',
      form_id: this.formId,
      total_time: Math.round(metrics.totalTime / 1000), // seconds
      fields_filled: Object.keys(metrics.fields).length,
      field_sequence: metrics.fieldSequence.join(' → '),
      avg_field_time: this.calculateAvgFieldTime(metrics),
      total_corrections: this.calculateTotalCorrections(metrics),
      tracking_version: TRACKING_VERSION,
      session_id: getOrCreateSessionId(),
    });
  }

  private calculateAvgFieldTime(metrics: FormMetrics): number {
    const times = Object.values(metrics.fields).map(f => f.totalFocusTime);
    if (times.length === 0) return 0;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length / 1000 * 10) / 10;
  }

  private calculateTotalCorrections(metrics: FormMetrics): number {
    return Object.values(metrics.fields).reduce((sum, f) => sum + f.corrections, 0);
  }

  getMetrics(): FormMetrics {
    const fields: Record<string, FieldMetrics> = {};

    this.fields.forEach((state, fieldName) => {
      fields[fieldName] = {
        field: fieldName,
        focusCount: state.focusCount,
        totalFocusTime: state.totalFocusTime,
        avgFocusTime: state.focusCount > 0 ? state.totalFocusTime / state.focusCount : 0,
        corrections: state.corrections,
        hesitationBefore: state.hesitationBefore,
        filledAt: state.filledAt,
        sequence: state.sequence,
      };
    });

    const filledCount = Object.values(fields).filter(f => f.filledAt).length;
    const totalFields = this.form.querySelectorAll('input, textarea, select').length;

    return {
      formId: this.formId,
      fields,
      totalTime: Date.now() - this.startedAt,
      startedAt: this.startedAt,
      fieldSequence: this.fieldSequence,
      abandonedAt: null,
      completionRate: totalFields > 0 ? filledCount / totalFields : 0,
    };
  }

  destroy(): void {
    // Mark as abandoned if not submitted
    const metrics = this.getMetrics();
    if (metrics.completionRate < 1 && this.options.pushToDataLayer) {
      const dataLayer = getDataLayer();
      if (dataLayer) {
        const lastField = this.fieldSequence[this.fieldSequence.length - 1] || '';
        dataLayer.push({
          event: 'form_field_abandon',
          form_id: this.formId,
          last_field: lastField,
          completion_rate: Math.round(metrics.completionRate * 100),
          time_spent: Math.round(metrics.totalTime / 1000),
          tracking_version: TRACKING_VERSION,
          session_id: getOrCreateSessionId(),
        });
      }
    }

    trackedForms.delete(this.formId);
    log(`Form tracking stopped: ${this.formId}`);
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Start tracking form field interactions
 *
 * @example
 * const tracker = trackFormFields(document.querySelector('form'), 'quote-form', {
 *   trackFocusTime: true,
 *   trackHesitation: true,
 *   trackCorrections: true,
 * });
 *
 * // Later, get metrics:
 * const metrics = tracker.getMetrics();
 */
export function trackFormFields(
  form: HTMLFormElement,
  formId: string,
  options: FormFieldOptions = {}
): FormTracker {
  // Stop existing tracker if any
  if (trackedForms.has(formId)) {
    trackedForms.get(formId)!.destroy();
  }

  const tracker = new FormTracker(form, formId, options);
  trackedForms.set(formId, tracker);
  return tracker;
}

/**
 * Stop tracking a form
 */
export function stopTrackingForm(formId: string): void {
  const tracker = trackedForms.get(formId);
  if (tracker) {
    tracker.destroy();
  }
}

/**
 * Get metrics for a tracked form
 */
export function getFormMetrics(formId: string): FormMetrics | null {
  const tracker = trackedForms.get(formId);
  return tracker ? tracker.getMetrics() : null;
}

/**
 * Get all tracked forms
 */
export function getTrackedForms(): string[] {
  return Array.from(trackedForms.keys());
}

/**
 * Auto-track all forms on the page
 */
export function autoTrackForms(options: FormFieldOptions = {}): void {
  if (typeof document === 'undefined') return;

  document.querySelectorAll('form').forEach((form, index) => {
    const formId = form.id || form.name || `form_${index}`;
    trackFormFields(form as HTMLFormElement, formId, options);
  });

  log(`Auto-tracking ${trackedForms.size} forms`);
}

/**
 * Stop tracking all forms (call before View Transitions)
 */
export function stopAllFormTracking(): void {
  trackedForms.forEach((tracker) => {
    tracker.destroy();
  });
  trackedForms.clear();
  log('All form tracking stopped');
}

// Auto-cleanup on Astro View Transitions
if (typeof document !== 'undefined') {
  document.addEventListener('astro:before-swap', () => {
    stopAllFormTracking();
  });
}
