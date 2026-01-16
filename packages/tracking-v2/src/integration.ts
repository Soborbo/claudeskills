/**
 * @leadgen/tracking-v2 - Astro Integration
 *
 * Auto-injects GTM and tracking initialization.
 */

import type { AstroIntegration } from 'astro';
import type { TrackingConfig, ResolvedTrackingConfig } from './types';

const DEFAULT_CONFIG: Omit<ResolvedTrackingConfig, 'gtmId'> = {
  currency: 'GBP',
  sessionTimeoutMinutes: 30,
  debug: false,
  linkedDomains: [],
  enableOfflineQueue: true,
};

function validateConfig(config: TrackingConfig): void {
  if (!config.gtmId) {
    throw new Error(
      '[@leadgen/tracking-v2] gtmId is required. ' +
      'Example: tracking({ gtmId: "GTM-XXXXXXX" })'
    );
  }

  if (!config.gtmId.startsWith('GTM-')) {
    console.warn(`[@leadgen/tracking-v2] gtmId should start with "GTM-". Got: "${config.gtmId}"`);
  }
}

export default function trackingIntegration(userConfig: TrackingConfig): AstroIntegration {
  validateConfig(userConfig);

  const config: ResolvedTrackingConfig = {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };

  return {
    name: '@leadgen/tracking-v2',

    hooks: {
      'astro:config:setup': ({ injectScript, logger }) => {
        logger.info(`Configuring tracking with GTM ID: ${config.gtmId}`);

        // Inject head scripts
        injectScript(
          'head-inline',
          `
          // @leadgen/tracking-v2 - dataLayer init
          window.dataLayer = window.dataLayer || [];

          // @leadgen/tracking-v2 - config
          window.__TRACKING_CONFIG__ = ${JSON.stringify({
            gtmId: config.gtmId,
            currency: config.currency,
            sessionTimeoutMinutes: config.sessionTimeoutMinutes,
            debug: config.debug,
            linkedDomains: config.linkedDomains,
            enableOfflineQueue: config.enableOfflineQueue,
          })};

          // @leadgen/tracking-v2 - GTM
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${config.gtmId}');
          `.trim()
        );

        // Inject init script
        injectScript('page', 'import "@leadgen/tracking-v2/init";');

        if (config.debug) {
          logger.info('Debug mode enabled');
        }
      },

      'astro:build:done': ({ logger }) => {
        logger.info('Tracking integration build complete');
        logger.info(`GTM ID: ${config.gtmId}`);
        logger.info(`Currency: ${config.currency}`);
        logger.info(`Session timeout: ${config.sessionTimeoutMinutes} minutes`);
      },
    },
  };
}

export { trackingIntegration as tracking };
export type { TrackingConfig, ResolvedTrackingConfig } from './types';
