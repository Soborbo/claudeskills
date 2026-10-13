import { describe, expect, it } from 'vitest';
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

describe('conversionValue', () => {
  it.each([[12345, 12345], ['999.5', 999.5], [0, undefined], [-5, undefined], ['kerites', undefined], [Number.NaN, undefined]])('%s → %s', (i, o) => {
    expect(conversionValue(i)).toBe(o);
  });
});
