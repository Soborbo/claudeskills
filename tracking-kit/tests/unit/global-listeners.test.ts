import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The upgrade-flow describe block tests behavior gated behind
// ENABLE_UPGRADE_WINDOW; flip the flag here so resetConversionState
// actually persists state and getActiveConversionState returns it.
vi.mock('../../src/lib/tracking/config', async () => {
  const actual =
    await vi.importActual<typeof import('../../src/lib/tracking/config')>(
      '../../src/lib/tracking/config',
    );
  return { ...actual, ENABLE_UPGRADE_WINDOW: true };
});

import { initGlobalListeners } from '../../src/lib/tracking/global-listeners';
import { resetConversionState } from '../../src/lib/tracking/conversion-state';
import { grantConsent } from '../setup/vitest.setup';

// The module installs document-level listeners on first init; subsequent
// calls are no-ops. We init once at the top of the file. To still test
// the "init only installs once" property we observe that repeated calls
// don't double-fire events.

beforeEach(() => {
  initGlobalListeners();
  global.fetch = vi.fn(() =>
    Promise.resolve(new Response(null, { status: 204 })),
  ) as unknown as typeof fetch;
});

function clickLink(href: string): void {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = 'go';
  document.body.appendChild(a);
  a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

function eventsByName(name: string): Record<string, unknown>[] {
  return (window.dataLayer || []).filter((e) => e.event === name);
}

describe('phone / email / whatsapp click → conversion event', () => {
  it('tel: link fires phone_conversion with tel_target', () => {
    clickLink('tel:+447700900123');
    const e = eventsByName('phone_conversion');
    expect(e).toHaveLength(1);
    expect(e[0]).toMatchObject({
      source: 'standalone',
      tel_target: '+447700900123',
      event_id: expect.any(String),
    });
  });

  it('mailto: link fires email_conversion', () => {
    clickLink('mailto:hello@example.com');
    expect(eventsByName('email_conversion')).toHaveLength(1);
  });

  it.each(['https://wa.me/447700900123', 'https://api.whatsapp.com/send?phone=447700900123'])(
    'whatsapp link "%s" fires whatsapp_conversion',
    (href) => {
      clickLink(href);
      expect(eventsByName('whatsapp_conversion')).toHaveLength(1);
    },
  );

  it('non-tracking links are ignored', () => {
    clickLink('https://example.com/about');
    expect(eventsByName('phone_conversion')).toHaveLength(0);
    expect(eventsByName('email_conversion')).toHaveLength(0);
    expect(eventsByName('whatsapp_conversion')).toHaveLength(0);
  });
});

describe('active conversion → upgrade flow', () => {
  it('inherits eventId / value / currency / service from active state', () => {
    grantConsent();
    const state = resetConversionState({
      value: 49.99,
      currency: 'GBP',
      service: 'lessons',
    });
    clickLink('tel:+447700900123');
    const phone = eventsByName('phone_conversion')[0];
    expect(phone).toMatchObject({
      event_id: state.eventId,
      value: 49.99,
      currency: 'GBP',
      service: 'lessons',
      source: 'after_primary',
    });
  });

  it('marks the state upgraded so the timer does not fire primary_conversion', () => {
    vi.useFakeTimers();
    grantConsent();
    resetConversionState({ value: 1, service: 's' });
    clickLink('tel:+447700900123');
    vi.advanceTimersByTime(60 * 60 * 1000 + 5000);
    expect(eventsByName('primary_conversion')).toHaveLength(0);
    vi.useRealTimers();
  });

  it('issues a new eventId + source=standalone when no active state exists', () => {
    clickLink('tel:+447700900123');
    const phone = eventsByName('phone_conversion')[0];
    expect(phone).toMatchObject({ source: 'standalone' });
    expect(phone.event_id).toMatch(/.+/);
  });
});

describe('scroll depth', () => {
  it('fires scroll_50 and scroll_90 at most once each', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

    Object.defineProperty(window, 'scrollY', { value: 250, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
    // (250 + 800) / 2000 = 52.5% → fires scroll_50
    expect(eventsByName('scroll_50')).toHaveLength(1);

    Object.defineProperty(window, 'scrollY', { value: 260, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(eventsByName('scroll_50')).toHaveLength(1);

    Object.defineProperty(window, 'scrollY', { value: 1100, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
    // (1100 + 800) / 2000 = 95% → fires scroll_90
    expect(eventsByName('scroll_90')).toHaveLength(1);

    Object.defineProperty(window, 'scrollY', { value: 1200, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(eventsByName('scroll_90')).toHaveLength(1);
  });
});

describe('install idempotence', () => {
  it('calling initGlobalListeners again does not double-fire events', () => {
    initGlobalListeners();
    initGlobalListeners();
    clickLink('tel:+447700900123');
    expect(eventsByName('phone_conversion')).toHaveLength(1);
  });
});
