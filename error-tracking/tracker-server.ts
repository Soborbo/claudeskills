// src/lib/errors/tracker-server.ts
// SZERVER-OLDALI error tracker — CF Workers-ben használd
// Ez importálja a codes.ts-t (teljes 290 kód regiszter),
// DE ez a fájl SOHA nem kerül a kliens bundle-be.

import { ALL_CODES } from './codes';
import { sanitizeContext } from './sanitize';
import type { ErrorContext, Severity, ServerTrackerConfig } from './types';

/**
 * Track error szerver-oldalon (API route-ban).
 * Közvetlenül logol Sheets-be és küld email alertet CRITICAL hibáknál.
 *
 * @param code - Hibakód a codes.ts-ből
 * @param error - Elkapott error
 * @param context - Context mezők
 * @param config - Szerver config (env vars-ból)
 *
 * @example
 * await trackServerError('FORM-SUBMIT-001', e, { formId: 'contact' }, errorConfig);
 */
export async function trackServerError(
  code: string,
  error: unknown,
  context: ErrorContext | undefined,
  config: ServerTrackerConfig,
): Promise<void> {
  const codeDef = ALL_CODES[code];
  const severity: Severity = codeDef?.severity || 'ERROR';
  const message = (error instanceof Error ? error.message : String(error || ''))
    || codeDef?.message
    || 'Unknown error';

  // Mindig console a szerveren
  console.error(`[${code}] [${severity}] ${message}`, context || '');

  // requiredContext validáció (dev/preview)
  if (config.env !== 'production' && codeDef?.requiredContext) {
    const missing = codeDef.requiredContext.filter(k => !context || !(k in context));
    if (missing.length) {
      console.warn(`⚠️ ${code}: hiányzó requiredContext: ${missing.join(', ')}`);
    }
  }

  const row = {
    timestamp: new Date().toISOString(),
    siteId: config.siteId,
    deployId: config.deployId,
    env: config.env,
    code,
    severity,
    message: message.substring(0, 500),
    url: 'server',
    source: 'server',
    context: JSON.stringify(sanitizeContext(context || {})),
    stack: error instanceof Error ? (error.stack || '').split('\n').slice(0, 5).join('\n') : '',
    retryable: codeDef?.retryable ?? false,
    userImpact: codeDef?.userImpact ?? 'degraded',
  };

  // Sheets log (nem INFO)
  if (config.sheetsWebhookUrl && severity !== 'INFO') {
    try {
      const resp = await fetch(config.sheetsWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
      if (!resp.ok) console.error('SHEETS_WEBHOOK_NON_OK', resp.status);
    } catch (e) {
      console.error('SHEETS_WEBHOOK_FAILED', e);
    }
  }

  // CRITICAL → email alert
  if (severity === 'CRITICAL' && config.alertEmailTo && config.resendApiKey && config.alertEmailFrom) {
    const subject = `🚨 [${row.siteId}] ${code}: ${message.substring(0, 80)}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;">
        <h2 style="color:#dc2626;">Critical Server Error</h2>
        <table style="border-collapse:collapse;width:100%;">
          ${(['code','severity','message','siteId','deployId','env','context','stack'] as const).map(k =>
            `<tr>
              <td style="padding:6px 12px;font-weight:bold;border-bottom:1px solid #eee;vertical-align:top;">${k}</td>
              <td style="padding:6px 12px;border-bottom:1px solid #eee;word-break:break-all;">${
                k === 'severity' ? `<span style="color:#dc2626;font-weight:bold;">${row[k]}</span>` : row[k]
              }</td>
            </tr>`
          ).join('')}
        </table>
      </div>`;

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.resendApiKey}`,
        },
        body: JSON.stringify({
          from: config.alertEmailFrom,
          to: [config.alertEmailTo],
          subject,
          html,
        }),
      });
    } catch {
      console.error('CRITICAL_ALERT_FAILED', code);
    }
  }
}

/**
 * Build ServerTrackerConfig from CF Pages env bindings.
 * Helper — hívd az API route elején.
 *
 * @example
 * const errorConfig = buildErrorConfig(env);
 * // ... later:
 * await trackServerError('FORM-SUBMIT-001', e, { formId: 'contact' }, errorConfig);
 */
export function buildErrorConfig(env: Record<string, string>): ServerTrackerConfig {
  return {
    siteId: env.PUBLIC_SITE_ID || 'unknown',
    deployId: env.CF_PAGES_COMMIT_SHA || '',
    env: env.CF_PAGES_BRANCH === 'main' ? 'production'
       : env.CF_PAGES_BRANCH ? 'preview'
       : 'development',
    sheetsWebhookUrl: env.ERROR_SHEETS_WEBHOOK_URL,
    alertEmailTo: env.ERROR_EMAIL_TO,
    alertEmailFrom: env.ERROR_ALERT_FROM || '',
    resendApiKey: env.RESEND_API_KEY,
  };
}
