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
 *
 * "Once" is marked only AFTER a successful push (same rule as once-guard and
 * server dedupe): a push that throws, returns `false`, or returns a promise
 * that rejects / resolves to `false` leaves the event retryable — `opened` is
 * retried on the next open()/navigate()/option(), a step_completed on the next
 * forward completion of that step. While an async push is pending the event is
 * reserved, so a re-render cannot double-fire it. Tracking failures never throw
 * into the calculator UI; they go to `onError` (default: console.error).
 */

export type DataLayerEvent = Record<string, unknown> & { event: string };
/**
 * Strict `false` (or a promise resolving to `false`) = not sent; throw / reject
 * = failed; anything else (undefined, true, the number `dataLayer.push`
 * returns) = sent.
 */
export type Push = (e: DataLayerEvent) => unknown;

export interface StepTrackerOptions {
  calculatorName: string;
  steps: readonly string[];
  push: Push;
  /** Called when a push throws, rejects or reports `false`. */
  onError?: (error: unknown, event: DataLayerEvent) => void;
}

const OPENED = 'opened';

export function createStepTracker({ calculatorName, steps, push, onError }: StepTrackerOptions) {
  /** key → 'pending' (async push in flight) | 'done' (push succeeded). */
  const state = new Map<string, 'pending' | 'done'>();
  let current: string | null = null;

  function report(error: unknown, e: DataLayerEvent): void {
    try {
      if (onError) onError(error, e);
      else if (typeof console !== 'undefined') console.error('[step-tracker] push failed', e.event, error);
    } catch {
      /* a broken reporter must not break the UI either */
    }
  }

  function notSent(e: DataLayerEvent): Error {
    return new Error(`push reported "not sent" for ${e.event}`);
  }

  /** Pushes `e` unless `key` is done or pending; marks `key` only after success. */
  function pushOnce(key: string, e: DataLayerEvent): void {
    if (state.has(key)) return;
    let r: unknown;
    try {
      r = push(e);
    } catch (err) {
      report(err, e);
      return;
    }
    if (r != null && typeof (r as PromiseLike<unknown>).then === 'function') {
      state.set(key, 'pending');
      Promise.resolve(r as PromiseLike<unknown>).then(
        (v) => {
          if (v === false) {
            state.delete(key);
            report(notSent(e), e);
          } else state.set(key, 'done');
        },
        (err) => {
          state.delete(key);
          report(err, e);
        },
      );
      return;
    }
    if (r === false) {
      report(notSent(e), e);
      return;
    }
    state.set(key, 'done');
  }

  function open(): void {
    pushOnce(OPENED, { event: 'quote_calculator_opened', calculator_name: calculatorName });
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
    pushOnce(`step:${from}`, {
      event: 'quote_calculator_step_completed',
      calculator_name: calculatorName,
      step_id: from,
      step_index: fi + 1,
      total_steps: steps.length,
    });
  }

  /** Not deduped (every selection is an event); failures are reported, never thrown. */
  function option(stepId: string, optionValue: unknown): void {
    open();
    const e: DataLayerEvent = {
      event: 'quote_calculator_option_selected',
      calculator_name: calculatorName,
      step_id: stepId,
      option_value: String(optionValue),
    };
    try {
      const r = push(e);
      if (r != null && typeof (r as PromiseLike<unknown>).then === 'function') {
        Promise.resolve(r as PromiseLike<unknown>).then((v) => { if (v === false) report(notSent(e), e); }, (err) => report(err, e));
      } else if (r === false) report(notSent(e), e);
    } catch (err) {
      report(err, e);
    }
  }

  return {
    open,
    navigate,
    option,
    /** true once `opened` was pushed successfully. */
    get opened() { return state.get(OPENED) === 'done'; },
    /** Steps whose step_completed push succeeded (in completion order). */
    get completedSteps() {
      return [...state].filter(([k, v]) => v === 'done' && k.startsWith('step:')).map(([k]) => k.slice(5));
    },
  };
}

/** Normalise a conversion `value`: positive finite number or omitted. */
export function conversionValue(v: unknown): number | undefined {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined;
}
