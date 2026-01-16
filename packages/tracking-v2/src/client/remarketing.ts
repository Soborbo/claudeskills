/**
 * @leadgen/tracking-v2 - Remarketing
 *
 * Build remarketing audiences for Google Ads and Meta.
 * Tracks user engagement and builds audience signals.
 */

import { getDataLayer } from './dataLayer';
import { getOrCreateSessionId } from './session';
import { isZarazAvailable } from './zaraz';
import { safeGetItem, safeSetItem } from './storage';
import { TRACKING_VERSION, log } from './constants';

// =============================================================================
// Types
// =============================================================================

export type AudienceSegment =
  | 'high_intent'        // Calculator completed, pricing viewed
  | 'calculator_abandon' // Started but didn't complete calculator
  | 'pricing_viewer'     // Viewed pricing/quote
  | 'return_visitor'     // Multiple sessions
  | 'engaged'           // High engagement score
  | 'cold';              // Low engagement

export interface EngagementSignals {
  pageViews: number;
  sessionCount: number;
  calculatorStarted: boolean;
  calculatorCompleted: boolean;
  pricingViewed: boolean;
  phoneClicked: boolean;
  timeOnSite: number;
  scrollDepth: number;
  lastVisit: number;
}

export interface RemarketingContent {
  /** Content type (e.g., 'service', 'location', 'calculator') */
  contentType: string;
  /** Content ID or name */
  contentId: string;
  /** Content value if applicable */
  value?: number;
  /** Additional content properties */
  properties?: Record<string, string | number>;
}

const STORAGE_KEY = 'lg_remarketing';
const ENGAGEMENT_KEY = 'lg_engagement';

// =============================================================================
// Engagement Tracking
// =============================================================================

function getEngagementSignals(): EngagementSignals {
  const data = safeGetItem(ENGAGEMENT_KEY);
  const defaults: EngagementSignals = {
    pageViews: 0,
    sessionCount: 0,
    calculatorStarted: false,
    calculatorCompleted: false,
    pricingViewed: false,
    phoneClicked: false,
    timeOnSite: 0,
    scrollDepth: 0,
    lastVisit: Date.now(),
  };

  if (!data) return defaults;

  try {
    return { ...defaults, ...JSON.parse(data) };
  } catch {
    return defaults;
  }
}

function saveEngagementSignals(signals: EngagementSignals): void {
  safeSetItem(ENGAGEMENT_KEY, JSON.stringify(signals));
}

/**
 * Update engagement signals (call on relevant events)
 */
export function updateEngagement(update: Partial<EngagementSignals>): void {
  const signals = getEngagementSignals();
  const updated = { ...signals, ...update, lastVisit: Date.now() };
  saveEngagementSignals(updated);

  // Push updated segment to dataLayer
  const segment = calculateSegment(updated);
  pushAudienceSignals(segment, updated);
}

/**
 * Increment page views
 */
export function trackPageView(): void {
  const signals = getEngagementSignals();
  signals.pageViews++;
  signals.lastVisit = Date.now();
  saveEngagementSignals(signals);
}

/**
 * Increment session count (call on new session)
 */
export function trackNewSession(): void {
  const signals = getEngagementSignals();
  signals.sessionCount++;
  signals.lastVisit = Date.now();
  saveEngagementSignals(signals);
}

/**
 * Track scroll depth
 */
export function trackScrollDepth(depth: number): void {
  const signals = getEngagementSignals();
  if (depth > signals.scrollDepth) {
    signals.scrollDepth = depth;
    saveEngagementSignals(signals);
  }
}

/**
 * Track time on site (in seconds)
 */
export function trackTimeOnSite(seconds: number): void {
  const signals = getEngagementSignals();
  signals.timeOnSite += seconds;
  saveEngagementSignals(signals);
}

// =============================================================================
// Audience Segmentation
// =============================================================================

/**
 * Calculate audience segment based on engagement
 */
function calculateSegment(signals: EngagementSignals): AudienceSegment {
  // High intent: completed calculator or viewed pricing + engaged
  if (signals.calculatorCompleted || (signals.pricingViewed && signals.phoneClicked)) {
    return 'high_intent';
  }

  // Calculator abandon: started but not completed
  if (signals.calculatorStarted && !signals.calculatorCompleted) {
    return 'calculator_abandon';
  }

  // Pricing viewer: looked at pricing/quotes
  if (signals.pricingViewed) {
    return 'pricing_viewer';
  }

  // Return visitor: multiple sessions
  if (signals.sessionCount > 1) {
    return 'return_visitor';
  }

  // Engaged: good engagement metrics
  if (signals.pageViews >= 3 || signals.scrollDepth >= 50 || signals.timeOnSite >= 60) {
    return 'engaged';
  }

  return 'cold';
}

/**
 * Get current audience segment
 */
export function getAudienceSegment(): AudienceSegment {
  return calculateSegment(getEngagementSignals());
}

/**
 * Get engagement signals
 */
export function getEngagement(): EngagementSignals {
  return getEngagementSignals();
}

// =============================================================================
// DataLayer / Zaraz Integration
// =============================================================================

/**
 * Push audience signals to dataLayer for Google Ads remarketing
 */
function pushAudienceSignals(segment: AudienceSegment, signals: EngagementSignals): void {
  const dataLayer = getDataLayer();
  if (!dataLayer) return;

  dataLayer.push({
    event: 'audience_signal',
    audience_segment: segment,
    engagement_score: calculateEngagementScore(signals),
    page_views: signals.pageViews,
    session_count: signals.sessionCount,
    calculator_started: signals.calculatorStarted,
    calculator_completed: signals.calculatorCompleted,
    pricing_viewed: signals.pricingViewed,
    tracking_version: TRACKING_VERSION,
    session_id: getOrCreateSessionId(),
  });
}

function calculateEngagementScore(signals: EngagementSignals): number {
  let score = 0;

  score += Math.min(signals.pageViews * 5, 25);       // Max 25 points
  score += Math.min(signals.sessionCount * 10, 30);   // Max 30 points
  score += signals.calculatorStarted ? 15 : 0;
  score += signals.calculatorCompleted ? 20 : 0;
  score += signals.pricingViewed ? 10 : 0;
  score += signals.phoneClicked ? 10 : 0;
  score += Math.min(signals.scrollDepth / 2, 15);     // Max 15 points
  score += Math.min(signals.timeOnSite / 10, 15);     // Max 15 points

  return Math.min(Math.round(score), 100);
}

/**
 * Push remarketing event for viewed content (for dynamic remarketing)
 */
export function trackContentView(content: RemarketingContent): void {
  const dataLayer = getDataLayer();
  if (!dataLayer) return;

  // Google Ads dynamic remarketing format
  dataLayer.push({
    event: 'view_item',
    ecomm_prodid: content.contentId,
    ecomm_pagetype: content.contentType,
    ecomm_totalvalue: content.value,
    content_type: content.contentType,
    content_id: content.contentId,
    value: content.value,
    ...content.properties,
    tracking_version: TRACKING_VERSION,
    session_id: getOrCreateSessionId(),
  });

  // Zaraz (Meta) - ViewContent event
  if (isZarazAvailable()) {
    try {
      window.zaraz!.track('ViewContent', {
        content_type: content.contentType,
        content_ids: [content.contentId],
        value: content.value,
      });
      log('Meta ViewContent tracked');
    } catch (e) {
      log('Meta ViewContent failed:', e);
    }
  }
}

/**
 * Track service/calculator page view (common for lead gen)
 */
export function trackServiceView(serviceId: string, serviceName: string, value?: number): void {
  trackContentView({
    contentType: 'service',
    contentId: serviceId,
    value,
    properties: {
      service_name: serviceName,
    },
  });

  // Mark pricing as viewed if value present
  if (value) {
    updateEngagement({ pricingViewed: true });
  }
}

/**
 * Track calculator interaction for remarketing
 */
export function trackCalculatorForRemarketing(step: 'start' | 'complete', value?: number): void {
  if (step === 'start') {
    updateEngagement({ calculatorStarted: true });
  } else {
    updateEngagement({ calculatorCompleted: true, pricingViewed: !!value });
  }

  // Push to dataLayer for remarketing lists
  const dataLayer = getDataLayer();
  if (dataLayer) {
    dataLayer.push({
      event: step === 'start' ? 'calculator_remarketing_start' : 'calculator_remarketing_complete',
      calculator_value: value,
      audience_segment: getAudienceSegment(),
    });
  }

  // Zaraz (Meta) - Custom events
  if (isZarazAvailable()) {
    try {
      window.zaraz!.track(step === 'start' ? 'InitiateCheckout' : 'AddToCart', {
        value: value || 0,
        content_type: 'calculator',
      });
    } catch (e) {
      log('Meta calculator event failed:', e);
    }
  }
}

// =============================================================================
// Auto-tracking Setup
// =============================================================================

let scrollTrackingInitialized = false;
let timeTrackingInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize remarketing auto-tracking
 */
export function initRemarketing(): void {
  if (typeof window === 'undefined') return;

  // Track page view
  trackPageView();

  // Track scroll depth
  if (!scrollTrackingInitialized) {
    scrollTrackingInitialized = true;

    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = Math.round((window.scrollY / scrollHeight) * 100);
      if (currentScroll > maxScroll) {
        maxScroll = currentScroll;
        trackScrollDepth(maxScroll);
      }
    }, { passive: true });
  }

  // Track time on site (every 10 seconds)
  if (!timeTrackingInterval) {
    timeTrackingInterval = setInterval(() => {
      trackTimeOnSite(10);
    }, 10000);
  }

  // Push initial audience signal
  const signals = getEngagementSignals();
  const segment = calculateSegment(signals);
  pushAudienceSignals(segment, signals);

  log('Remarketing initialized, segment:', segment);
}

/**
 * Stop remarketing tracking
 */
export function stopRemarketing(): void {
  if (timeTrackingInterval) {
    clearInterval(timeTrackingInterval);
    timeTrackingInterval = null;
  }
}

/**
 * Get all remarketing data for export
 */
export function getRemarketingData(): {
  segment: AudienceSegment;
  engagementScore: number;
  signals: EngagementSignals;
} {
  const signals = getEngagementSignals();
  return {
    segment: calculateSegment(signals),
    engagementScore: calculateEngagementScore(signals),
    signals,
  };
}
