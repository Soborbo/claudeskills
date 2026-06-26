import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/gateway', () => ({
  sendToWorker: vi.fn(() => Promise.resolve(true)),
  getTurnstileToken: vi.fn(() => Promise.resolve('TOK')),
  collectAttribution: vi.fn(() => ({})),
  prewarmTurnstile: vi.fn(),
}));

import { initTracking } from '../lib/index';
import { setCkyConsent, resetAll } from './helpers';

// Own module context so the module-level `consentListenerBound` flag starts false.
beforeEach(() => { resetAll(); setCkyConsent({ analytics: true, marketing: true }); });

describe('initTracking — no listener accumulation across view transitions', () => {
  it('registers the cookieyes consent listener exactly once across repeated init', () => {
    const spy = vi.spyOn(document, 'addEventListener');
    // Simulate first load (page-load + readyState fallback) + several SPA navigations.
    initTracking();
    initTracking();
    initTracking();
    const consentRegistrations = spy.mock.calls.filter((c) => c[0] === 'cookieyes_consent_update');
    expect(consentRegistrations).toHaveLength(1);
    spy.mockRestore();
  });
});
