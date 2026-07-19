import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initFormAbandonTracking, initScrollTracking,
  setUserDataForEC, USER_DATA_ELEMENT_ID,
} from '../lib/events';
import { setCkyConsent, resetAll, getDataLayer, lastEvent } from './helpers';

function readSideChannel(): Record<string, string> | undefined {
  return (window as unknown as { __sbUserData?: Record<string, string> }).__sbUserData;
}

beforeEach(() => {
  resetAll();
  setCkyConsent({ analytics: true, marketing: true });
});
afterEach(() => vi.useRealTimers());

// ── Form abandonment ───────────────────────────────────────────────

function makeForm(): HTMLFormElement {
  const form = document.createElement('form');
  const input = document.createElement('input');
  input.name = 'email';
  form.appendChild(input);
  const anon = document.createElement('input'); // no name attribute
  form.appendChild(anon);
  document.body.appendChild(form);
  return form;
}

function focus(el: Element): void {
  el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
}

describe('initFormAbandonTracking', () => {
  it('fires form_abandoned with the LAST focused field after the timeout', () => {
    vi.useFakeTimers();
    const form = makeForm();
    const phone = document.createElement('input');
    phone.name = 'phone';
    form.appendChild(phone);

    initFormAbandonTracking(form, 'quote', 60_000);
    focus(form.querySelector('input[name="email"]')!);
    focus(phone); // last field before abandoning
    vi.advanceTimersByTime(60_001);

    const e = lastEvent('form_abandoned')!;
    expect(e).toBeDefined();
    expect(e.form_id).toBe('quote');
    expect(e.last_field).toBe('phone');
  });

  it('submit cancels the pending abandon timer', () => {
    vi.useFakeTimers();
    const form = makeForm();
    initFormAbandonTracking(form, 'quote', 60_000);
    focus(form.querySelector('input[name="email"]')!);
    form.dispatchEvent(new Event('submit'));
    vi.advanceTimersByTime(120_000);
    expect(getDataLayer().some((e) => e.event === 'form_abandoned')).toBe(false);
  });

  it('the cleanup function clears the timer and unbinds the listeners', () => {
    vi.useFakeTimers();
    const form = makeForm();
    const cleanup = initFormAbandonTracking(form, 'quote', 60_000);
    focus(form.querySelector('input[name="email"]')!);
    cleanup();
    vi.advanceTimersByTime(120_000);
    expect(getDataLayer().some((e) => e.event === 'form_abandoned')).toBe(false);
    // Listener unbound: a fresh focus after cleanup arms nothing either.
    focus(form.querySelector('input[name="email"]')!);
    vi.advanceTimersByTime(120_000);
    expect(getDataLayer().some((e) => e.event === 'form_abandoned')).toBe(false);
  });

  it('a nameless field does not arm the timer', () => {
    vi.useFakeTimers();
    const form = makeForm();
    initFormAbandonTracking(form, 'quote', 60_000);
    focus(form.querySelectorAll('input')[1]); // the anonymous input
    vi.advanceTimersByTime(120_000);
    expect(getDataLayer().some((e) => e.event === 'form_abandoned')).toBe(false);
  });

  it('does nothing without analytics consent', () => {
    vi.useFakeTimers();
    setCkyConsent({ analytics: false, marketing: false });
    const form = makeForm();
    initFormAbandonTracking(form, 'quote', 60_000);
    focus(form.querySelector('input[name="email"]')!);
    vi.advanceTimersByTime(120_000);
    expect(getDataLayer()).toHaveLength(0);
  });
});

// ── Scroll depth ───────────────────────────────────────────────────

function setScrollGeometry(opts: { scrollHeight: number; innerHeight: number; scrollY: number }): void {
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: opts.scrollHeight });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: opts.innerHeight, writable: true });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: opts.scrollY, writable: true });
}

function scrollTo(y: number): void {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y, writable: true });
  window.dispatchEvent(new Event('scroll'));
}

describe('initScrollTracking', () => {
  it('fires each 25/50/75/100 threshold exactly once', () => {
    // Page: 2000px tall, 1000px viewport → scrollable range 1000px.
    setScrollGeometry({ scrollHeight: 2000, innerHeight: 1000, scrollY: 0 });
    initScrollTracking();

    scrollTo(300);  // 30%
    scrollTo(600);  // 60% → 50 fires too
    scrollTo(1000); // 100% → 75 + 100
    scrollTo(1000); // repeat → nothing new

    const pcts = getDataLayer().filter((e) => e.event === 'scroll_depth').map((e) => e.scroll_percentage);
    expect(pcts).toEqual([25, 50, 75, 100]);
  });

  it('re-init replaces the handler (no double-fire after SPA navigation)', () => {
    setScrollGeometry({ scrollHeight: 2000, innerHeight: 1000, scrollY: 0 });
    initScrollTracking();
    initScrollTracking(); // simulate astro:page-load firing again
    scrollTo(1000);
    const count100 = getDataLayer().filter((e) => e.event === 'scroll_depth' && e.scroll_percentage === 100).length;
    expect(count100).toBe(1);
  });

  it('non-scrollable page (content fits the viewport) never fires', () => {
    setScrollGeometry({ scrollHeight: 800, innerHeight: 1000, scrollY: 0 });
    initScrollTracking();
    scrollTo(0);
    expect(getDataLayer().some((e) => e.event === 'scroll_depth')).toBe(false);
  });

  it('does nothing without analytics consent', () => {
    setCkyConsent({ analytics: false, marketing: false });
    setScrollGeometry({ scrollHeight: 2000, innerHeight: 1000, scrollY: 0 });
    initScrollTracking();
    scrollTo(1000);
    expect(getDataLayer()).toHaveLength(0);
  });
});

// ── Enhanced Conversions side-channel auto-clear ───────────────────

describe('setUserDataForEC — 5s auto-clear window', () => {
  it('the side-channel is swept after 5 seconds (PII does not linger for the page lifetime)', () => {
    vi.useFakeTimers();
    setUserDataForEC({ email: 'a@b.com' });
    expect(readSideChannel()).toBeTruthy();
    expect(document.getElementById(USER_DATA_ELEMENT_ID)).toBeTruthy();

    vi.advanceTimersByTime(5_001);
    expect(readSideChannel()).toBeUndefined();
    expect(document.getElementById(USER_DATA_ELEMENT_ID)).toBeNull();
  });

  it('a second write re-arms the clear timer (measured from the LAST write)', () => {
    vi.useFakeTimers();
    setUserDataForEC({ email: 'first@b.com' });
    vi.advanceTimersByTime(3_000);
    setUserDataForEC({ email: 'second@b.com' });

    vi.advanceTimersByTime(4_000); // 7s after first, 4s after second → still present
    expect(readSideChannel()?.email).toBe('second@b.com');

    vi.advanceTimersByTime(1_100); // >5s after the second write → swept
    expect(readSideChannel()).toBeUndefined();
  });
});

describe('generateEventId — no-crypto fallback (events.ts local variant)', () => {
  it('still yields a unique dedup id without the crypto API', async () => {
    const { generateEventId } = await import('../lib/events');
    vi.stubGlobal('crypto', undefined);
    try {
      const a = generateEventId();
      const b = generateEventId();
      expect(a).toBeTruthy();
      expect(a).not.toBe(b);
      expect(a).toMatch(/^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
