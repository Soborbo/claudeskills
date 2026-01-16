/**
 * @leadgen/conversion-tracking - Consent Helper (READ-ONLY)
 *
 * GTM/Zaraz are the AUTHORITY for firing tags.
 * This is only for localStorage/UI decisions.
 */

import type { ConsentState, ConsentCategory, ConsentChangeCallback } from '../types';
import { log } from './constants';

export function getConsentState(): ConsentState {
  if (typeof window === 'undefined') {
    return { analytics: false, marketing: false, functional: false, necessary: true };
  }

  // DEV mode fallback
  if (import.meta.env?.DEV && !window.getCkyConsent) {
    return { analytics: true, marketing: true, functional: true, necessary: true };
  }

  if (!window.getCkyConsent) {
    return { analytics: false, marketing: false, functional: false, necessary: true };
  }

  try {
    const cky = window.getCkyConsent();
    return {
      analytics: cky.categories.analytics ?? false,
      marketing: cky.categories.advertisement ?? false,
      functional: cky.categories.functional ?? false,
      necessary: cky.categories.necessary ?? true,
    };
  } catch {
    return { analytics: false, marketing: false, functional: false, necessary: true };
  }
}

export function hasMarketingConsent(): boolean {
  return getConsentState().marketing;
}

export function hasAnalyticsConsent(): boolean {
  return getConsentState().analytics;
}

export function getConsentStateLabel(): string {
  const state = getConsentState();
  if (state.analytics && state.marketing) return 'analytics+marketing';
  if (state.analytics) return 'analytics';
  if (state.marketing) return 'marketing';
  return 'none';
}

// Consent change listener
const callbacks = new Set<ConsentChangeCallback>();
let listenerInitialized = false;

function initListener(): void {
  if (listenerInitialized || typeof document === 'undefined') return;
  listenerInitialized = true;

  document.addEventListener('cookieyes_consent_update', () => {
    const state = getConsentState();
    log('Consent changed:', state);
    callbacks.forEach((cb) => {
      try { cb(state); } catch {}
    });
  });
}

export function onConsentChange(callback: ConsentChangeCallback): () => void {
  initListener();
  callbacks.add(callback);
  return () => callbacks.delete(callback);
}

export function waitForConsent(category: ConsentCategory, timeoutMs = 0): Promise<boolean> {
  return new Promise((resolve) => {
    const current = getConsentState();
    if (current[category]) {
      resolve(true);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const cleanup = onConsentChange((state) => {
      if (state[category]) {
        if (timeoutId) clearTimeout(timeoutId);
        cleanup();
        resolve(true);
      }
    });

    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);
    }
  });
}
