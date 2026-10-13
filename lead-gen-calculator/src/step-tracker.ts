/**
 * Calculator funnel events with correct semantics.
 *
 * Invariant J:
 *  - `quote_calculator_opened` once per calculator session — not behind a
 *    consent timeout that drops it (olcsokontenerhaz: 30 opened vs 530 step
 *    users), not twice per teaser flow (lomtalan);
 *  - `quote_calculator_step_completed` on FORWARD completion of a step, once
 *    per step per session — not on every render / back / popstate / restore
 *    (all five sister sites fired it on display);
 *  - a param named `value` is always a number (GA4 treats it as a metric and
 *    drops strings); the chosen option goes in `option_value`;
 *  - GA4 custom dimensions must exist for every reported param (step_id,
 *    option_value, calculator_name) or the funnel is unreadable.
 */

export type DataLayerEvent = Record<string, unknown> & { event: string };
export type Push = (e: DataLayerEvent) => void;

export interface StepTrackerOptions {
  calculatorName: string;
  steps: readonly string[];
  push: Push;
}

export function createStepTracker({ calculatorName, steps, push }: StepTrackerOptions) {
  let opened = false;
  const completed = new Set<string>();
  let current: string | null = null;

  function open(): void {
    if (opened) return;
    opened = true;
    push({ event: 'quote_calculator_opened', calculator_name: calculatorName });
  }

  /** Call on every navigation. Only forward moves emit step_completed. */
  function navigate(to: string): void {
    open();
    const from = current;
    current = to;
    if (from === null) return;
    const fi = steps.indexOf(from);
    const ti = steps.indexOf(to);
    if (fi < 0 || ti <= fi) return; // back / jump backwards / unknown
    if (completed.has(from)) return;
    completed.add(from);
    push({
      event: 'quote_calculator_step_completed',
      calculator_name: calculatorName,
      step_id: from,
      step_index: fi + 1,
      total_steps: steps.length,
    });
  }

  function option(stepId: string, optionValue: unknown): void {
    open();
    push({
      event: 'quote_calculator_option_selected',
      calculator_name: calculatorName,
      step_id: stepId,
      option_value: String(optionValue),
    });
  }

  return { open, navigate, option, get completedSteps() { return [...completed]; } };
}

/** Normalise a conversion `value`: positive finite number or omitted. */
export function conversionValue(v: unknown): number | undefined {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined;
}
