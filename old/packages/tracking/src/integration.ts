/**
 * @leadgen/tracking - Astro Integration
 *
 * Server-side integration that injects tracking scripts.
 * This file runs at BUILD TIME, not in the browser.
 */

import type { AstroIntegration } from 'astro';
import type { TrackingConfig, ResolvedTrackingConfig } from './types';

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: Omit<ResolvedTrackingConfig, 'gtmId'> = {
  gclidPersistDays: 90,
  debug: false,
};

// =============================================================================
// Validation
// =============================================================================

function validateConfig(config: TrackingConfig): void {
  if (!config.gtmId) {
    throw new Error(
      '[@leadgen/tracking] gtmId is required. ' +
      'Example: tracking({ gtmId: "GTM-XXXXXXX" })'
    );
  }

  if (!config.gtmId.startsWith('GTM-')) {
    console.warn(
      '[@leadgen/tracking] gtmId should start with "GTM-". ' +
      `Got: "${config.gtmId}"`
    );
  }
}

// =============================================================================
// Script Generation
// =============================================================================

/**
 * Generate GTM script with Cloudflare Gateway support
 */
function generateGtmScript(gtmId: string): string {
  return `
<!-- Google Tag Manager -->
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');
</script>
<!-- End Google Tag Manager -->`.trim();
}

/**
 * Generate GTM noscript fallback
 */
function generateGtmNoscript(gtmId: string): string {
  return `
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`.trim();
}

/**
 * Generate dataLayer initialization script
 */
function generateDataLayerInit(): string {
  return `
<!-- dataLayer initialization (before GTM) -->
<script>
window.dataLayer = window.dataLayer || [];
</script>`.trim();
}

/**
 * Generate tracking config injection script
 */
function generateConfigScript(config: ResolvedTrackingConfig): string {
  const safeConfig = {
    debug: config.debug,
    gclidPersistDays: config.gclidPersistDays,
  };

  return `
<!-- Tracking config -->
<script>
window.__LEADGEN_TRACKING_CONFIG__ = ${JSON.stringify(safeConfig)};
</script>`.trim();
}

// =============================================================================
// Astro Integration
// =============================================================================

/**
 * Create the @leadgen/tracking Astro integration
 *
 * @param userConfig - User configuration
 * @returns Astro integration
 *
 * @example
 * // astro.config.mjs
 * import tracking from '@leadgen/tracking';
 *
 * export default defineConfig({
 *   integrations: [
 *     tracking({
 *       gtmId: 'GTM-XXXXXXX',
 *       gclidPersistDays: 90,
 *       debug: false,
 *     })
 *   ]
 * });
 */
export default function trackingIntegration(
  userConfig: TrackingConfig
): AstroIntegration {
  // Validate config at build time
  validateConfig(userConfig);

  // Merge with defaults
  const config: ResolvedTrackingConfig = {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };

  return {
    name: '@leadgen/tracking',

    hooks: {
      'astro:config:setup': ({ injectScript, logger }) => {
        logger.info(`Configuring tracking with GTM ID: ${config.gtmId}`);

        // Inject head scripts (run before everything else)
        // Order matters: dataLayer → config → GTM → init
        injectScript(
          'head-inline',
          `
          // @leadgen/tracking - dataLayer init
          window.dataLayer = window.dataLayer || [];

          // @leadgen/tracking - config
          window.__LEADGEN_TRACKING_CONFIG__ = ${JSON.stringify({
            debug: config.debug,
            gclidPersistDays: config.gclidPersistDays,
          })};

          // @leadgen/tracking - GTM
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${config.gtmId}');
          `.trim()
        );

        // Inject init script as module (runs after DOM ready)
        injectScript('page', 'import "@leadgen/tracking/init";');

        if (config.debug) {
          logger.info('Debug mode enabled - tracking events will be logged');
        }
      },

      'astro:build:done': ({ logger }) => {
        logger.info('Tracking integration build complete');
        logger.info(`GTM ID: ${config.gtmId}`);
        logger.info(`GCLID persist days: ${config.gclidPersistDays}`);
      },
    },
  };
}

// Named export for ESM
export { trackingIntegration as tracking };

// Re-export types for consumers
export type { TrackingConfig, ResolvedTrackingConfig } from './types';
