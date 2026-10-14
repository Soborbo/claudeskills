import { describe, expect, it, vi } from 'vitest';
import { conversionValue, createStepTracker, type DataLayerEvent } from '../src/step-tracker';

function setup() {
  const events: DataLayerEvent[] = [];
  const t = createStepTracker({ calculatorName: 'calc', steps: ['usage', 'sizes', 'color', 'contact'], push: (e) => events.push(e) });
  return { t, events, names: () => events.map((e) => e.event) };
}

describe('createStepTracker (invariant J)', () => {
  it('opened fires once even if several entry points call it', () => {
    const { t, names } = setup();
    t.open(); t.open(); t.navigate('usage'); t.option('usage', 'teto');
    expect(names().filter((n) => n === 'quote_calculator_opened')).toHaveLength(1);
  });

  it('step_completed only on forward completion, once per step', () => {
    const { t, events } = setup();
    t.navigate('usage');       // initial render: nothing
    t.navigate('sizes');       // usage completed
    t.navigate('usage');       // back: nothing
    t.navigate('sizes');       // usage again: deduped
    t.navigate('color');       // sizes completed
    t.navigate('color');       // re-render: nothing
    const done = events.filter((e) => e.event === 'quote_calculator_step_completed');
    expect(done.map((e) => e.step_id)).toEqual(['usage', 'sizes']);
    expect(done[0]).toMatchObject({ step_index: 1, total_steps: 4, calculator_name: 'calc' });
  });

  it('option goes to option_value as a string, never to `value`', () => {
    const { t, events } = setup();
    t.option('usage', 'kerites');
    const e = events.find((x) => x.event === 'quote_calculator_option_selected')!;
    expect(e.option_value).toBe('kerites');
    expect('value' in e).toBe(false);
  });
});

describe('createStepTracker: mark only after a successful push', () => {
  function failing(fail: (e: DataLayerEvent) => boolean | 'throw' | 'reject') {
    const pushed: DataLayerEvent[] = [];
    const errors: unknown[] = [];
    const push = (e: DataLayerEvent) => {
      const f = fail(e);
      if (f === 'throw') throw new Error('push failed');
      if (f === 'reject') return Promise.reject(new Error('push rejected'));
      if (f === true) return false; // explicit "not sent"
      pushed.push(e);
      return undefined;
    };
    const t = createStepTracker({ calculatorName: 'calc', steps: ['usage', 'sizes', 'color'], push, onError: (err) => errors.push(err) });
    return { t, pushed, errors };
  }

  it('review repro: a throwing opened push stays retryable', () => {
    let attempts = 0;
    const { t, pushed, errors } = failing((e) => (e.event === 'quote_calculator_opened' && ++attempts === 1 ? 'throw' : false));
    t.open();
    expect(pushed).toHaveLength(0);
    expect(errors).toHaveLength(1);
    t.open();
    expect(pushed.map((e) => e.event)).toEqual(['quote_calculator_opened']);
    t.open();
    expect(pushed).toHaveLength(1);
  });

  it('a step_completed push that throws or returns false is not marked; the next forward completion re-emits it', () => {
    let attempts = 0;
    const { t, pushed } = failing((e) => (e.event === 'quote_calculator_step_completed' ? (++attempts === 1 ? 'throw' : attempts === 2) : false));
    t.navigate('usage');
    t.navigate('sizes');              // throws
    expect(t.completedSteps).toEqual([]);
    t.navigate('usage');
    t.navigate('sizes');              // returns false
    expect(t.completedSteps).toEqual([]);
    t.navigate('usage');
    t.navigate('sizes');              // succeeds
    t.navigate('usage');
    t.navigate('sizes');              // deduped
    expect(pushed.filter((e) => e.event === 'quote_calculator_step_completed').map((e) => e.step_id)).toEqual(['usage']);
    expect(t.completedSteps).toEqual(['usage']);
  });

  it('an async push: pending blocks duplicates, rejection makes the event retryable, resolution marks it', async () => {
    let mode: 'reject' | 'ok' = 'reject';
    const calls: string[] = [];
    let settle!: () => void;
    const push = vi.fn((e: DataLayerEvent) => {
      calls.push(e.event);
      if (e.event !== 'quote_calculator_opened') return undefined;
      return new Promise<void>((res, rej) => { settle = () => (mode === 'reject' ? rej(new Error('x')) : res()); });
    });
    const t = createStepTracker({ calculatorName: 'calc', steps: ['a', 'b'], push, onError: () => {} });
    t.open();
    t.open(); // pending: not pushed again
    expect(calls).toEqual(['quote_calculator_opened']);
    settle();
    await Promise.resolve(); await Promise.resolve();
    t.open(); // rejected → retried
    expect(calls).toEqual(['quote_calculator_opened', 'quote_calculator_opened']);
    mode = 'ok';
    settle();
    await Promise.resolve(); await Promise.resolve();
    t.open();
    expect(calls).toEqual(['quote_calculator_opened', 'quote_calculator_opened']);
  });

  it('a tracking failure never breaks navigation state', () => {
    const { t } = failing(() => 'throw');
    expect(() => { t.navigate('usage'); t.navigate('sizes'); t.option('sizes', 3); }).not.toThrow();
  });
});

describe('conversionValue', () => {
  it.each([[12345, 12345], ['999.5', 999.5], [0, undefined], [-5, undefined], ['kerites', undefined], [Number.NaN, undefined]])('%s → %s', (i, o) => {
    expect(conversionValue(i)).toBe(o);
  });
});
