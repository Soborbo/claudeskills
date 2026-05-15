import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONVERSION_STATE_KEY,
  LATE_CATCHUP_MS,
  UPGRADE_WINDOW_MS,
  VIEW_CONTENT_FIRED_KEY,
} from '../../src/lib/tracking/config';
import {
  getActiveConversionState,
  hasViewContentFired,
  markConversionUpgraded,
  markViewContentFired,
  resetConversionState,
  resumeConversionTimer,
} from '../../src/lib/tracking/conversion-state';
import { grantConsent } from '../setup/vitest.setup';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('resetConversionState', () => {
  it('writes a fresh state with a generated event_id', () => {
    const state = resetConversionState({ value: 42, service: 'lessons' });
    expect(state.value).toBe(42);
    expect(state.service).toBe('lessons');
    expect(state.currency).toBe('EUR');
    expect(state.upgraded).toBe(false);
    expect(state.eventId).toMatch(/.+/);

    const stored = JSON.parse(localStorage.getItem(CONVERSION_STATE_KEY)!);
    expect(stored).toMatchObject(state);
  });

  it('preserves a caller-supplied event_id', () => {
    const state = resetConversionState({
      value: 1,
      service: 's',
      eventId: 'caller-id-abc',
    });
    expect(state.eventId).toBe('caller-id-abc');
  });

  it('clears any prior pending timer (no double-fire across resets)', () => {
    resetConversionState({ value: 1, service: 's1' });
    resetConversionState({ value: 2, service: 's2' });
    vi.advanceTimersByTime(UPGRADE_WINDOW_MS + 1);
    const events = (window.dataLayer || []).filter((e) => e.event === 'primary_conversion');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ value: 2, service: 's2' });
  });
});

describe('getActiveConversionState', () => {
  it('returns the live state inside the upgrade window', () => {
    const state = resetConversionState({ value: 1, service: 's' });
    expect(getActiveConversionState()).toMatchObject({ eventId: state.eventId });
  });

  it('returns null past the upgrade window', () => {
    resetConversionState({ value: 1, service: 's' });
    vi.advanceTimersByTime(UPGRADE_WINDOW_MS + 1000);
    expect(getActiveConversionState()).toBeNull();
  });

  it('returns null after the state is upgraded', () => {
    resetConversionState({ value: 1, service: 's' });
    markConversionUpgraded();
    expect(getActiveConversionState()).toBeNull();
  });

  it('returns null when no state exists', () => {
    expect(getActiveConversionState()).toBeNull();
  });
});

describe('markConversionUpgraded', () => {
  it('prevents the timer from firing primary_conversion', () => {
    resetConversionState({ value: 1, service: 's' });
    markConversionUpgraded();
    vi.advanceTimersByTime(UPGRADE_WINDOW_MS + 1);
    const events = (window.dataLayer || []).filter((e) => e.event === 'primary_conversion');
    expect(events).toHaveLength(0);
  });

  it('is a no-op when there is no state', () => {
    expect(() => markConversionUpgraded()).not.toThrow();
  });
});

describe('timer firing primary_conversion', () => {
  it('fires exactly one primary_conversion when the window elapses', () => {
    grantConsent();
    resetConversionState({ value: 99, service: 'translation', eventId: 'evt-1' });
    vi.advanceTimersByTime(UPGRADE_WINDOW_MS + 1);
    const events = (window.dataLayer || []).filter((e) => e.event === 'primary_conversion');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      event_id: 'evt-1',
      value: 99,
      service: 'translation',
      currency: 'EUR',
    });
  });

  it('wipes localStorage state once fired', () => {
    resetConversionState({ value: 1, service: 's' });
    vi.advanceTimersByTime(UPGRADE_WINDOW_MS + 1);
    expect(localStorage.getItem(CONVERSION_STATE_KEY)).toBeNull();
  });

  it('does not fire if state has been upgraded', () => {
    resetConversionState({ value: 1, service: 's' });
    markConversionUpgraded();
    vi.advanceTimersByTime(UPGRADE_WINDOW_MS + 1);
    expect((window.dataLayer || []).filter((e) => e.event === 'primary_conversion')).toHaveLength(0);
  });
});

describe('resumeConversionTimer', () => {
  it('reschedules a timer when elapsed < UPGRADE_WINDOW_MS', () => {
    localStorage.setItem(
      CONVERSION_STATE_KEY,
      JSON.stringify({
        value: 1,
        currency: 'EUR',
        service: 's',
        completedAt: Date.now() - 1000,
        eventId: 'resume-1',
        upgraded: false,
      }),
    );
    resumeConversionTimer();
    vi.advanceTimersByTime(UPGRADE_WINDOW_MS - 999);
    const events = (window.dataLayer || []).filter((e) => e.event === 'primary_conversion');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ event_id: 'resume-1' });
  });

  it('fires a late_conversion immediately when inside the catchup window', () => {
    localStorage.setItem(
      CONVERSION_STATE_KEY,
      JSON.stringify({
        value: 1,
        currency: 'EUR',
        service: 's',
        completedAt: Date.now() - (UPGRADE_WINDOW_MS + 1000),
        eventId: 'late-1',
        upgraded: false,
      }),
    );
    resumeConversionTimer();
    const events = (window.dataLayer || []).filter((e) => e.event === 'primary_conversion');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ event_id: 'late-1', late_conversion: true });
  });

  it('drops the state if past UPGRADE_WINDOW_MS + LATE_CATCHUP_MS', () => {
    localStorage.setItem(
      CONVERSION_STATE_KEY,
      JSON.stringify({
        value: 1,
        currency: 'EUR',
        service: 's',
        completedAt: Date.now() - (UPGRADE_WINDOW_MS + LATE_CATCHUP_MS + 1000),
        eventId: 'too-old',
        upgraded: false,
      }),
    );
    resumeConversionTimer();
    expect(localStorage.getItem(CONVERSION_STATE_KEY)).toBeNull();
    expect((window.dataLayer || []).filter((e) => e.event === 'primary_conversion')).toHaveLength(0);
  });

  it('no-ops on a state that is already upgraded', () => {
    localStorage.setItem(
      CONVERSION_STATE_KEY,
      JSON.stringify({
        value: 1,
        currency: 'EUR',
        service: 's',
        completedAt: Date.now(),
        eventId: 'up-1',
        upgraded: true,
      }),
    );
    resumeConversionTimer();
    vi.advanceTimersByTime(UPGRADE_WINDOW_MS + 1);
    expect((window.dataLayer || []).filter((e) => e.event === 'primary_conversion')).toHaveLength(0);
  });
});

describe('localStorage robustness', () => {
  it('drops broken JSON on read', () => {
    localStorage.setItem(CONVERSION_STATE_KEY, '{{not json');
    expect(getActiveConversionState()).toBeNull();
    // Broken JSON is caught by the catch block; readState returns null
    // without removing — that's fine because writes will overwrite.
  });

  it('drops state that does not match the schema', () => {
    localStorage.setItem(CONVERSION_STATE_KEY, JSON.stringify({ value: 'not a number' }));
    expect(getActiveConversionState()).toBeNull();
    // The schema check removes the bad blob so subsequent reads don't bog
    // down on the same junk.
    expect(localStorage.getItem(CONVERSION_STATE_KEY)).toBeNull();
  });

  it('schema check accepts a complete valid object', () => {
    const valid = {
      value: 10,
      currency: 'EUR',
      service: 'x',
      completedAt: Date.now(),
      eventId: 'ok',
      upgraded: false,
    };
    localStorage.setItem(CONVERSION_STATE_KEY, JSON.stringify(valid));
    expect(getActiveConversionState()).toMatchObject(valid);
  });
});

describe('ViewContent flag', () => {
  it('lives in its own key independent of conversion state', () => {
    expect(hasViewContentFired()).toBe(false);
    markViewContentFired();
    expect(hasViewContentFired()).toBe(true);
    expect(localStorage.getItem(VIEW_CONTENT_FIRED_KEY)).toBe('1');
  });

  it('survives a primary_conversion fire (deleteState should not wipe it)', () => {
    markViewContentFired();
    resetConversionState({ value: 1, service: 's' });
    vi.advanceTimersByTime(UPGRADE_WINDOW_MS + 1);
    expect(hasViewContentFired()).toBe(true);
  });
});
