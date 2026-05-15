import { beforeEach, describe, expect, it, vi } from 'vitest';

// This file exercises the DEFAULT path (ENABLE_UPGRADE_WINDOW = false).
// Every exported function in conversion-state.ts should be a no-op or
// return a non-persistent state. The companion file
// `conversion-state.test.ts` covers the opt-in (flag = true) behavior.

import {
  CONVERSION_STATE_KEY,
  ENABLE_UPGRADE_WINDOW,
} from '../../src/lib/tracking/config';
import {
  getActiveConversionState,
  markConversionUpgraded,
  resetConversionState,
  resumeConversionTimer,
} from '../../src/lib/tracking/conversion-state';
import { grantConsent } from '../setup/vitest.setup';

beforeEach(() => {
  vi.useFakeTimers();
});

describe('flag default', () => {
  it('ENABLE_UPGRADE_WINDOW defaults to false', () => {
    expect(ENABLE_UPGRADE_WINDOW).toBe(false);
  });
});

describe('resetConversionState (flag off)', () => {
  it('returns a synthesized state but does NOT write to localStorage', () => {
    grantConsent();
    const state = resetConversionState({ value: 42, service: 'lessons' });
    expect(state.value).toBe(42);
    expect(state.service).toBe('lessons');
    expect(state.eventId).toMatch(/.+/);
    expect(localStorage.getItem(CONVERSION_STATE_KEY)).toBeNull();
  });

  it('does NOT start a timer that would fire primary_conversion', () => {
    grantConsent();
    resetConversionState({ value: 1, service: 's' });
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    const fired = (window.dataLayer || []).filter(
      (e) => e.event === 'primary_conversion',
    );
    expect(fired).toHaveLength(0);
  });
});

describe('getActiveConversionState (flag off)', () => {
  it('always returns null, even with valid persisted state', () => {
    localStorage.setItem(
      CONVERSION_STATE_KEY,
      JSON.stringify({
        value: 10,
        currency: 'EUR',
        service: 'x',
        completedAt: Date.now(),
        eventId: 'ok',
        upgraded: false,
      }),
    );
    expect(getActiveConversionState()).toBeNull();
  });
});

describe('markConversionUpgraded / resumeConversionTimer (flag off)', () => {
  it('markConversionUpgraded is a no-op (does not touch persisted state)', () => {
    const blob = JSON.stringify({
      value: 1,
      currency: 'EUR',
      service: 's',
      completedAt: Date.now(),
      eventId: 'e',
      upgraded: false,
    });
    localStorage.setItem(CONVERSION_STATE_KEY, blob);
    markConversionUpgraded();
    expect(localStorage.getItem(CONVERSION_STATE_KEY)).toBe(blob);
  });

  it('resumeConversionTimer does not fire a late conversion', () => {
    localStorage.setItem(
      CONVERSION_STATE_KEY,
      JSON.stringify({
        value: 5,
        currency: 'EUR',
        service: 's',
        completedAt: Date.now() - 2 * 60 * 60 * 1000, // past the window
        eventId: 'e',
        upgraded: false,
      }),
    );
    resumeConversionTimer();
    const fired = (window.dataLayer || []).filter(
      (e) => e.event === 'primary_conversion',
    );
    expect(fired).toHaveLength(0);
  });
});
