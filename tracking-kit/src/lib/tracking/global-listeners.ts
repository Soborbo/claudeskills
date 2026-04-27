/**
 * Page-level click + scroll listeners.
 *
 * - phone/email/whatsapp link clicks → conversion event, with upgrade
 *   logic if there's an active conversion in the upgrade window
 * - scroll depth (50%, 90%) → engagement events
 *
 * Cleanup: this module assumes a hard-navigation MPA (Astro server,
 * Next.js Pages Router with full reloads, plain HTML). For SPA / View
 * Transitions / next/router-style soft navigation you'll want to add an
 * `AbortController` and call it on route change, otherwise listeners
 * compound across navigations.
 */

import { getActiveConversionState, markConversionUpgraded } from './conversion-state';
import { mirrorMetaCapi } from './meta-mirror';
import { clearUserDataOnDOM, trackEvent } from './tracking';
import { generateUUID } from './uuid';

let installed = false;

export function initGlobalListeners(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  document.addEventListener('click', onDocumentClick, true);
  installScrollDepthTracking();
}

function onDocumentClick(e: Event): void {
  const target = e.target as HTMLElement | null;
  const link = target?.closest?.('a');
  if (!link) return;

  const href = link.getAttribute('href') || '';
  let eventName: string | null = null;
  let extras: Record<string, unknown> = {};

  if (href.startsWith('tel:')) {
    eventName = 'phone_conversion';
    extras = { tel_target: href.slice(4) };
  } else if (href.startsWith('mailto:')) {
    eventName = 'email_conversion';
  } else if (/(?:^|\/\/)(?:[^/]*\.)?(wa\.me|whatsapp\.com)/i.test(href)) {
    eventName = 'whatsapp_conversion';
  }
  if (!eventName) return;

  const active = getActiveConversionState();
  const eventId = active ? active.eventId : generateUUID();

  if (active) {
    markConversionUpgraded();
    trackEvent(eventName, {
      event_id: eventId,
      value: active.value,
      currency: active.currency,
      service: active.service,
      source: 'after_primary',
      ...extras,
    });
    // The mirror reads side-channel PII synchronously; once that returns
    // we can drop the PII even though the network send is still in
    // flight. sendBeacon is fire-and-forget by design.
    void mirrorMetaCapi(eventName, eventId, {
      value: active.value,
      currency: active.currency,
    });
    clearUserDataOnDOM();
  } else {
    trackEvent(eventName, {
      event_id: eventId,
      source: 'standalone',
      ...extras,
    });
    void mirrorMetaCapi(eventName, eventId, {});
  }
}

function installScrollDepthTracking(): void {
  let fired50 = false;
  let fired90 = false;
  const onScroll = () => {
    const doc = document.documentElement;
    const total = doc.scrollHeight;
    if (!total) return;
    const pct = ((window.scrollY + window.innerHeight) / total) * 100;
    if (pct >= 50 && !fired50) {
      fired50 = true;
      trackEvent('scroll_50');
    }
    if (pct >= 90 && !fired90) {
      fired90 = true;
      trackEvent('scroll_90');
    }
    if (fired50 && fired90) {
      window.removeEventListener('scroll', onScroll);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}
