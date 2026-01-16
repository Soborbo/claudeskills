/**
 * @leadgen/tracking-v2 - Plugin Architecture
 *
 * Extensible plugin system for integrating third-party tools.
 */

import { log } from './constants';
import type { ConversionType, ConsentState } from '../types';

// =============================================================================
// Plugin Types
// =============================================================================

export interface TrackingPlugin {
  /** Unique plugin name */
  name: string;

  /** Plugin version */
  version?: string;

  /** Called when tracking is initialized */
  onInit?: () => void | Promise<void>;

  /** Called on page view */
  onPageView?: (url: string) => void;

  /** Called on custom event */
  onEvent?: (eventName: string, params: Record<string, unknown>) => void;

  /** Called on conversion */
  onConversion?: (type: ConversionType, params: Record<string, unknown>) => void;

  /** Called on phone click */
  onPhoneClick?: (phone: string | undefined, value: number | undefined) => void;

  /** Called when consent changes */
  onConsentChange?: (state: ConsentState) => void;

  /** Called on error */
  onError?: (error: Error, context: string) => void;

  /** Cleanup function */
  destroy?: () => void;
}

export interface PluginContext {
  getSessionId: () => string;
  getConsent: () => ConsentState;
  log: (message: string, ...args: unknown[]) => void;
}

// =============================================================================
// Plugin Registry
// =============================================================================

const plugins = new Map<string, TrackingPlugin>();
let initialized = false;

/**
 * Register a plugin
 */
export function registerPlugin(plugin: TrackingPlugin): boolean {
  if (!plugin.name) {
    log('Plugin must have a name');
    return false;
  }

  if (plugins.has(plugin.name)) {
    log(`Plugin "${plugin.name}" already registered`);
    return false;
  }

  plugins.set(plugin.name, plugin);
  log(`Plugin registered: ${plugin.name}${plugin.version ? ` v${plugin.version}` : ''}`);

  // If already initialized, call onInit immediately
  if (initialized && plugin.onInit) {
    try {
      plugin.onInit();
    } catch (error) {
      log(`Plugin ${plugin.name} init error:`, error);
    }
  }

  return true;
}

/**
 * Unregister a plugin
 */
export function unregisterPlugin(name: string): boolean {
  const plugin = plugins.get(name);
  if (!plugin) return false;

  if (plugin.destroy) {
    try {
      plugin.destroy();
    } catch (error) {
      log(`Plugin ${name} destroy error:`, error);
    }
  }

  plugins.delete(name);
  log(`Plugin unregistered: ${name}`);
  return true;
}

/**
 * Get a registered plugin
 */
export function getPlugin(name: string): TrackingPlugin | undefined {
  return plugins.get(name);
}

/**
 * Get all registered plugins
 */
export function getPlugins(): TrackingPlugin[] {
  return Array.from(plugins.values());
}

// =============================================================================
// Plugin Hooks
// =============================================================================

export function initPlugins(): void {
  if (initialized) return;
  initialized = true;

  plugins.forEach((plugin) => {
    if (plugin.onInit) {
      try {
        plugin.onInit();
      } catch (error) {
        log(`Plugin ${plugin.name} init error:`, error);
      }
    }
  });
}

export function notifyPageView(url: string): void {
  plugins.forEach((plugin) => {
    if (plugin.onPageView) {
      try {
        plugin.onPageView(url);
      } catch (error) {
        log(`Plugin ${plugin.name} pageView error:`, error);
      }
    }
  });
}

export function notifyEvent(eventName: string, params: Record<string, unknown>): void {
  plugins.forEach((plugin) => {
    if (plugin.onEvent) {
      try {
        plugin.onEvent(eventName, params);
      } catch (error) {
        log(`Plugin ${plugin.name} event error:`, error);
      }
    }
  });
}

export function notifyConversion(
  type: ConversionType,
  params: Record<string, unknown>
): void {
  plugins.forEach((plugin) => {
    if (plugin.onConversion) {
      try {
        plugin.onConversion(type, params);
      } catch (error) {
        log(`Plugin ${plugin.name} conversion error:`, error);
      }
    }
  });
}

export function notifyPhoneClick(phone: string | undefined, value: number | undefined): void {
  plugins.forEach((plugin) => {
    if (plugin.onPhoneClick) {
      try {
        plugin.onPhoneClick(phone, value);
      } catch (error) {
        log(`Plugin ${plugin.name} phoneClick error:`, error);
      }
    }
  });
}

export function notifyConsentChange(state: ConsentState): void {
  plugins.forEach((plugin) => {
    if (plugin.onConsentChange) {
      try {
        plugin.onConsentChange(state);
      } catch (error) {
        log(`Plugin ${plugin.name} consentChange error:`, error);
      }
    }
  });
}

export function notifyError(error: Error, context: string): void {
  plugins.forEach((plugin) => {
    if (plugin.onError) {
      try {
        plugin.onError(error, context);
      } catch (err) {
        // Don't recurse on error handler errors
        console.error(`Plugin ${plugin.name} error handler failed:`, err);
      }
    }
  });
}

// =============================================================================
// Built-in Plugin Factories
// =============================================================================

/**
 * Create a console logger plugin (useful for debugging)
 */
export function createConsoleLoggerPlugin(): TrackingPlugin {
  return {
    name: 'console-logger',
    version: '1.0.0',
    onInit: () => console.log('[Tracking] Initialized'),
    onPageView: (url) => console.log('[Tracking] Page view:', url),
    onEvent: (name, params) => console.log('[Tracking] Event:', name, params),
    onConversion: (type, params) => console.log('[Tracking] Conversion:', type, params),
    onPhoneClick: (phone, value) => console.log('[Tracking] Phone click:', phone, value),
    onConsentChange: (state) => console.log('[Tracking] Consent changed:', state),
    onError: (error, context) => console.error('[Tracking] Error in', context, error),
  };
}

/**
 * Create a Sentry-style error reporting plugin
 */
export function createErrorReporterPlugin(
  reportFn: (error: Error, context: string) => void
): TrackingPlugin {
  return {
    name: 'error-reporter',
    version: '1.0.0',
    onError: reportFn,
  };
}
