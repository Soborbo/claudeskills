/**
 * @leadgen/tracking-v2 - Funnel Analytics
 *
 * Track and analyze conversion funnels.
 */

import { getOrCreateSessionId } from './session';
import { log } from './constants';
import { safeGetItem, safeSetItem } from './storage';

// =============================================================================
// Types
// =============================================================================

export interface FunnelStep {
  name: string;
  /** Event name or "eventName:value" for parameterized steps */
  event: string;
  /** Optional step order (auto-assigned if not provided) */
  order?: number;
}

export interface FunnelProgress {
  funnelId: string;
  sessionId: string;
  currentStep: number;
  completedSteps: string[];
  startedAt: number;
  lastActivityAt: number;
  completed: boolean;
  abandoned: boolean;
}

export interface FunnelStats {
  funnelId: string;
  totalSessions: number;
  completedSessions: number;
  conversionRate: number;
  stepDropoffs: Record<string, number>;
  avgTimeToComplete: number | null;
}

export interface Funnel {
  id: string;
  steps: FunnelStep[];
  getProgress: () => FunnelProgress | null;
  recordStep: (stepName: string) => boolean;
  getStats: () => FunnelStats;
  reset: () => void;
}

// =============================================================================
// Storage
// =============================================================================

const STORAGE_PREFIX = 'lg_funnel_';
const STATS_PREFIX = 'lg_funnel_stats_';

function getFunnelStorageKey(funnelId: string): string {
  return `${STORAGE_PREFIX}${funnelId}`;
}

function getStatsStorageKey(funnelId: string): string {
  return `${STATS_PREFIX}${funnelId}`;
}

function loadProgress(funnelId: string): FunnelProgress | null {
  const key = getFunnelStorageKey(funnelId);
  const data = safeGetItem(key);
  if (!data) return null;

  try {
    const progress = JSON.parse(data) as FunnelProgress;

    // Check if this is the same session
    const currentSession = getOrCreateSessionId();
    if (progress.sessionId !== currentSession) {
      // Different session - mark old as abandoned if not completed
      if (!progress.completed) {
        updateStats(funnelId, progress, true);
      }
      return null;
    }

    return progress;
  } catch {
    return null;
  }
}

function saveProgress(funnelId: string, progress: FunnelProgress): void {
  const key = getFunnelStorageKey(funnelId);
  safeSetItem(key, JSON.stringify(progress));
}

function loadStats(funnelId: string): FunnelStats {
  const key = getStatsStorageKey(funnelId);
  const data = safeGetItem(key);

  const defaultStats: FunnelStats = {
    funnelId,
    totalSessions: 0,
    completedSessions: 0,
    conversionRate: 0,
    stepDropoffs: {},
    avgTimeToComplete: null,
  };

  if (!data) return defaultStats;

  try {
    return { ...defaultStats, ...JSON.parse(data) };
  } catch {
    return defaultStats;
  }
}

function saveStats(stats: FunnelStats): void {
  const key = getStatsStorageKey(stats.funnelId);
  safeSetItem(key, JSON.stringify(stats));
}

function updateStats(
  funnelId: string,
  progress: FunnelProgress,
  abandoned: boolean
): void {
  const stats = loadStats(funnelId);

  stats.totalSessions++;

  if (progress.completed && !abandoned) {
    stats.completedSessions++;

    // Update avg time to complete
    const completionTime = progress.lastActivityAt - progress.startedAt;
    if (stats.avgTimeToComplete === null) {
      stats.avgTimeToComplete = completionTime;
    } else {
      stats.avgTimeToComplete =
        (stats.avgTimeToComplete * (stats.completedSessions - 1) + completionTime) /
        stats.completedSessions;
    }
  } else if (abandoned) {
    // Track where users dropped off
    const lastStep = progress.completedSteps[progress.completedSteps.length - 1] || 'start';
    stats.stepDropoffs[lastStep] = (stats.stepDropoffs[lastStep] || 0) + 1;
  }

  stats.conversionRate =
    stats.totalSessions > 0 ? stats.completedSessions / stats.totalSessions : 0;

  saveStats(stats);
}

// =============================================================================
// Funnel Factory
// =============================================================================

const activeFunnels = new Map<string, Funnel>();

/**
 * Create a new funnel tracker
 *
 * @example
 * const quoteFunnel = createFunnel('quote_flow', [
 *   { name: 'start', event: 'calculator_start' },
 *   { name: 'step2', event: 'calculator_step:2' },
 *   { name: 'step3', event: 'calculator_step:3' },
 *   { name: 'complete', event: 'quote_request' },
 * ]);
 *
 * // Later:
 * quoteFunnel.recordStep('start');
 * quoteFunnel.recordStep('step2');
 * console.log(quoteFunnel.getProgress());
 */
export function createFunnel(
  funnelId: string,
  steps: Array<FunnelStep | string>
): Funnel {
  // Normalize steps
  const normalizedSteps: FunnelStep[] = steps.map((step, index) => {
    if (typeof step === 'string') {
      return { name: step, event: step, order: index };
    }
    return { ...step, order: step.order ?? index };
  });

  // Sort by order
  normalizedSteps.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const funnel: Funnel = {
    id: funnelId,
    steps: normalizedSteps,

    getProgress(): FunnelProgress | null {
      return loadProgress(funnelId);
    },

    recordStep(stepName: string): boolean {
      const stepIndex = normalizedSteps.findIndex((s) => s.name === stepName);
      if (stepIndex === -1) {
        log(`Unknown funnel step: ${stepName}`);
        return false;
      }

      let progress = loadProgress(funnelId);
      const now = Date.now();

      if (!progress) {
        // Start new funnel session
        progress = {
          funnelId,
          sessionId: getOrCreateSessionId(),
          currentStep: 0,
          completedSteps: [],
          startedAt: now,
          lastActivityAt: now,
          completed: false,
          abandoned: false,
        };
      }

      // Check if step was already completed
      if (progress.completedSteps.includes(stepName)) {
        log(`Funnel step already completed: ${stepName}`);
        return false;
      }

      // Record step
      progress.completedSteps.push(stepName);
      progress.currentStep = stepIndex + 1;
      progress.lastActivityAt = now;

      // Check if funnel is complete
      if (progress.currentStep >= normalizedSteps.length) {
        progress.completed = true;
        updateStats(funnelId, progress, false);
        log(`Funnel completed: ${funnelId}`);
      }

      saveProgress(funnelId, progress);
      log(`Funnel step recorded: ${funnelId} -> ${stepName}`);

      return true;
    },

    getStats(): FunnelStats {
      return loadStats(funnelId);
    },

    reset(): void {
      const key = getFunnelStorageKey(funnelId);
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore
      }
    },
  };

  activeFunnels.set(funnelId, funnel);
  log(`Funnel created: ${funnelId} with ${normalizedSteps.length} steps`);

  return funnel;
}

/**
 * Get an existing funnel by ID
 */
export function getFunnel(funnelId: string): Funnel | undefined {
  return activeFunnels.get(funnelId);
}

/**
 * Get all active funnels
 */
export function getAllFunnels(): Funnel[] {
  return Array.from(activeFunnels.values());
}

/**
 * Auto-track funnel progress based on events
 *
 * Call this after registering funnels to automatically
 * record steps when matching events are pushed to dataLayer.
 */
export function enableAutoTracking(): void {
  if (typeof window === 'undefined') return;

  // Intercept dataLayer.push
  const originalPush = window.dataLayer?.push;
  if (!originalPush) {
    log('dataLayer not available for auto-tracking');
    return;
  }

  window.dataLayer.push = function (...args: unknown[]) {
    // Call original
    const result = originalPush.apply(this, args);

    // Check for funnel events
    for (const arg of args) {
      if (typeof arg === 'object' && arg !== null && 'event' in arg) {
        const event = arg as { event: string; [key: string]: unknown };
        const eventName = event.event;

        // Check all funnels for matching events
        activeFunnels.forEach((funnel) => {
          funnel.steps.forEach((step) => {
            // Check for exact match or parameterized match (e.g., "calculator_step:2")
            if (step.event === eventName) {
              funnel.recordStep(step.name);
            } else if (step.event.includes(':')) {
              const [baseEvent, value] = step.event.split(':');
              if (baseEvent === eventName && String(event.step || event.value) === value) {
                funnel.recordStep(step.name);
              }
            }
          });
        });
      }
    }

    return result;
  };

  log('Funnel auto-tracking enabled');
}

/**
 * Get conversion rate for a funnel
 */
export function getConversionRate(funnelId: string): number {
  const stats = loadStats(funnelId);
  return stats.conversionRate;
}

/**
 * Get step-by-step dropoff analysis
 */
export function getDropoffAnalysis(
  funnelId: string
): Array<{ step: string; dropoffs: number; percentage: number }> {
  const stats = loadStats(funnelId);
  const total = stats.totalSessions - stats.completedSessions;

  if (total === 0) return [];

  return Object.entries(stats.stepDropoffs).map(([step, dropoffs]) => ({
    step,
    dropoffs,
    percentage: dropoffs / total,
  }));
}
