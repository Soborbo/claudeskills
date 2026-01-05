/**
 * Analytics Utilities
 *
 * GA4 dataLayer helpers for event tracking.
 *
 * @example
 * import { trackEvent, trackFormSubmit, trackPhoneClick } from '@leadgen/utils/analytics';
 *
 * // Track custom event
 * trackEvent('cta_click', { button_text: 'Árajánlat kérése' });
 *
 * // Track form submission
 * trackFormSubmit('contact-form', { service: 'koltoztetes' });
 *
 * // Track phone click
 * trackPhoneClick('+36123456789');
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Push event to GA4 dataLayer
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params,
  });
}

/**
 * Track form submission
 */
export function trackFormSubmit(
  formId: string,
  additionalParams?: Record<string, unknown>
): void {
  trackEvent('form_submit', {
    form_id: formId,
    form_name: formId.replace(/-/g, '_'),
    ...additionalParams,
  });
}

/**
 * Track form start (first interaction)
 */
export function trackFormStart(
  formId: string,
  additionalParams?: Record<string, unknown>
): void {
  trackEvent('form_start', {
    form_id: formId,
    form_name: formId.replace(/-/g, '_'),
    ...additionalParams,
  });
}

/**
 * Track phone number click
 */
export function trackPhoneClick(
  phoneNumber: string,
  additionalParams?: Record<string, unknown>
): void {
  trackEvent('phone_click', {
    phone_number: phoneNumber,
    link_url: `tel:${phoneNumber.replace(/\s/g, '')}`,
    ...additionalParams,
  });
}

/**
 * Track email click
 */
export function trackEmailClick(
  email: string,
  additionalParams?: Record<string, unknown>
): void {
  trackEvent('email_click', {
    email_address: email,
    link_url: `mailto:${email}`,
    ...additionalParams,
  });
}

/**
 * Track CTA button click
 */
export function trackCtaClick(
  buttonText: string,
  buttonUrl: string,
  additionalParams?: Record<string, unknown>
): void {
  trackEvent('cta_click', {
    button_text: buttonText,
    link_url: buttonUrl,
    ...additionalParams,
  });
}

/**
 * Track outbound link click
 */
export function trackOutboundLink(
  url: string,
  linkText?: string,
  additionalParams?: Record<string, unknown>
): void {
  trackEvent('outbound_click', {
    link_url: url,
    link_text: linkText,
    outbound: true,
    ...additionalParams,
  });
}

/**
 * Track scroll depth milestones
 */
export function trackScrollDepth(
  depth: number,
  additionalParams?: Record<string, unknown>
): void {
  trackEvent('scroll_depth', {
    percent_scrolled: depth,
    ...additionalParams,
  });
}

/**
 * Track video engagement
 */
export function trackVideoEvent(
  action: 'play' | 'pause' | 'complete' | 'progress',
  videoTitle: string,
  additionalParams?: Record<string, unknown>
): void {
  trackEvent(`video_${action}`, {
    video_title: videoTitle,
    ...additionalParams,
  });
}

/**
 * Track page view (for SPA navigation)
 */
export function trackPageView(
  pageTitle: string,
  pageLocation?: string,
  additionalParams?: Record<string, unknown>
): void {
  trackEvent('page_view', {
    page_title: pageTitle,
    page_location: pageLocation || (typeof window !== 'undefined' ? window.location.href : undefined),
    ...additionalParams,
  });
}

/**
 * Initialize scroll depth tracking
 * Tracks at 25%, 50%, 75%, and 100% scroll depth
 */
export function initScrollDepthTracking(): void {
  if (typeof window === 'undefined') return;

  const milestones = [25, 50, 75, 100];
  const reached = new Set<number>();

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    milestones.forEach((milestone) => {
      if (scrollPercent >= milestone && !reached.has(milestone)) {
        reached.add(milestone);
        trackScrollDepth(milestone);
      }
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * Create click handler that tracks and then follows link
 */
export function createTrackedClickHandler(
  eventName: string,
  params: Record<string, unknown>,
  callback?: () => void
): (e: Event) => void {
  return (e: Event) => {
    trackEvent(eventName, params);

    if (callback) {
      callback();
    }
  };
}
