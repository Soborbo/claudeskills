import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ABANDONMENT_BEACON_URL, ABANDONMENT_MIN_DWELL_MS } from '../../src/lib/tracking/config';
import {
  trackFormFieldFocus,
  trackFormStart,
  trackFormStep,
  trackFormSubmitted,
} from '../../src/lib/tracking/form-tracking';
import { readBlobJSON } from '../setup/blob-helper';

// form-tracking holds a module-level Map of active forms. We use a unique
// formId per test so leftover state from a previous test never crosses
// into the current one, and we flush at the end of every test to keep the
// Map clean for the next.

let formIdCounter = 0;
function freshFormId(): string {
  formIdCounter += 1;
  return `test-form-${formIdCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-15T10:00:00Z'));
});

afterEach(() => {
  // Flush any forms left behind so they don't leak into the next test's
  // pagehide. After this, sendBeacon may have been called — the next
  // beforeEach resets the mock anyway.
  try {
    window.dispatchEvent(new Event('pagehide'));
  } catch {
    /* ignore */
  }
  vi.useRealTimers();
});

function pushedEvents(name: string): Record<string, unknown>[] {
  return (window.dataLayer || []).filter((e) => e.event === name);
}

describe('trackFormStart', () => {
  it('fires form_start once per formId with form_name + page metadata', () => {
    const id = freshFormId();
    trackFormStart(id, 'Quote');
    trackFormStart(id, 'Quote');
    const events = pushedEvents('form_start');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      form_name: 'Quote',
      page_path: expect.any(String),
      page_title: expect.any(String),
    });
  });
});

describe('trackFormStep', () => {
  it('pushes form_step_complete with the step metadata', () => {
    const id = freshFormId();
    trackFormStart(id, 'Quote');
    trackFormStep(id, 'contact', 2, 3);
    const events = pushedEvents('form_step_complete');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      form_name: 'Quote',
      step_name: 'contact',
      step_number: 2,
      total_steps: 3,
    });
  });
});

describe('trackFormFieldFocus', () => {
  it('updates lastField on the form state (reflected later in abandonment payload)', async () => {
    const id = freshFormId();
    trackFormStart(id, 'Quote');
    trackFormFieldFocus(id, 'email');
    vi.advanceTimersByTime(ABANDONMENT_MIN_DWELL_MS + 1000);
    window.dispatchEvent(new Event('pagehide'));
    expect(navigator.sendBeacon).toHaveBeenCalled();
    const [, blob] = (navigator.sendBeacon as ReturnType<typeof vi.fn>).mock.calls[0];
    const payload = await readBlobJSON<Record<string, unknown>>(blob);
    expect(payload).toMatchObject({ last_field: 'email', form_name: 'Quote' });
  });
});

describe('abandonment beacon', () => {
  it('does not fire when dwell time is below the threshold', () => {
    const id = freshFormId();
    trackFormStart(id, 'Quote');
    vi.advanceTimersByTime(ABANDONMENT_MIN_DWELL_MS - 1000);
    window.dispatchEvent(new Event('pagehide'));
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it('fires on pagehide once dwell threshold is exceeded', async () => {
    const id = freshFormId();
    trackFormStart(id, 'Quote');
    vi.advanceTimersByTime(ABANDONMENT_MIN_DWELL_MS + 5000);
    window.dispatchEvent(new Event('pagehide'));
    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    const [url, blob] = (navigator.sendBeacon as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(ABANDONMENT_BEACON_URL);
    const payload = await readBlobJSON<Record<string, unknown>>(blob);
    expect(payload).toMatchObject({
      form_name: 'Quote',
      last_step: 'unknown',
      last_field: 'unknown',
      time_spent_seconds: expect.any(Number),
      exit_page_path: expect.any(String),
      exit_page_title: expect.any(String),
      exit_page_url: expect.any(String),
    });
    expect(payload.time_spent_seconds).toBeGreaterThanOrEqual(
      Math.floor(ABANDONMENT_MIN_DWELL_MS / 1000),
    );
  });

  it('fires on visibilitychange→hidden once dwell threshold is exceeded', () => {
    const id = freshFormId();
    trackFormStart(id, 'Quote');
    vi.advanceTimersByTime(ABANDONMENT_MIN_DWELL_MS + 5000);
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(navigator.sendBeacon).toHaveBeenCalled();
  });

  it('does NOT fire after trackFormSubmitted (submitted forms are not abandoned)', () => {
    const id = freshFormId();
    trackFormStart(id, 'Quote');
    trackFormSubmitted(id);
    vi.advanceTimersByTime(ABANDONMENT_MIN_DWELL_MS + 5000);
    window.dispatchEvent(new Event('pagehide'));
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it('does NOT throw when sendBeacon throws', () => {
    (navigator.sendBeacon as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('beacon failure');
    });
    const id = freshFormId();
    trackFormStart(id, 'Quote');
    vi.advanceTimersByTime(ABANDONMENT_MIN_DWELL_MS + 5000);
    expect(() => window.dispatchEvent(new Event('pagehide'))).not.toThrow();
    // dataLayer push still goes through as the secondary path.
    expect(pushedEvents('form_abandonment')).toHaveLength(1);
  });
});
