/**
 * Form submission API endpoint
 * POST /api/contact
 */

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { handleFormSubmission } from '../../lib/forms/submit';
import { createLogger } from '../../lib/forms/logger';
import { config } from '../../config/siteConfig.example';

export const POST: APIRoute = async ({ request, locals }) => {
  const logger = createLogger();
  logger.info('Form submission received');

  // CSRF: validate Origin header
  const origin = request.headers.get('origin') || '';
  const siteUrl = new URL(config.url).origin;
  if (origin && origin !== siteUrl) {
    logger.warn('CSRF check failed', { origin });
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Payload size limit (64KB)
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > 65536) {
    return new Response(JSON.stringify({ error: 'Payload too large' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Content-Type validation
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
    return new Response(JSON.stringify({ error: 'Invalid content type' }), {
      status: 415,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();

    const workerEnv = {
      RATE_LIMIT_KV: env.RATE_LIMIT_KV as KVNamespace,
      RESEND_API_KEY: (env.RESEND_API_KEY as string) || '',
      BREVO_API_KEY: (env.BREVO_API_KEY as string) || '',
      TURNSTILE_SECRET_KEY: (env.TURNSTILE_SECRET_KEY as string) || '',
      GOOGLE_SERVICE_ACCOUNT_EMAIL: (env.GOOGLE_SERVICE_ACCOUNT_EMAIL as string) || '',
      GOOGLE_PRIVATE_KEY: (env.GOOGLE_PRIVATE_KEY as string) || '',
      GOOGLE_SHEET_ID: (env.GOOGLE_SHEET_ID as string) || '',
      // CRM signed-webhook config (dormant when unset — see lib/forms/crm.ts).
      CRM_BASE_URL: (env.CRM_BASE_URL as string) || '',
      CRM_WEBHOOK_SECRET: (env.CRM_WEBHOOK_SECRET as string) || '',
      CRM_COMPANY_ID: (env.CRM_COMPANY_ID as string) || '',
      CRM_WEBHOOK_SOURCE: (env.CRM_WEBHOOK_SOURCE as string) || '',
    };

    // `ctx.waitUntil` (Cloudflare adapter) lets a transient CRM re-delivery
    // finish in the background without holding the response open.
    const runtime = (locals as { runtime?: { ctx?: ExecutionContext } }).runtime;
    const waitUntil = runtime?.ctx
      ? runtime.ctx.waitUntil.bind(runtime.ctx)
      : undefined;

    const result = await handleFormSubmission(formData, workerEnv, request, waitUntil);

    if (result.success) {
      logger.info('Form submission successful');
      // JSON, not a 302 — the browser reads {success, redirect, eventId} and
      // fires the conversion (with the SHARED event_id) only after this success,
      // then navigates. An opaque redirect would leave the client guessing.
      return new Response(
        JSON.stringify({
          success: true,
          redirect: config.forms.thankYouPath,
          eventId: result.eventId,
          leadId: result.leadId,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    logger.warn('Form submission failed', { error: result.error, code: result.code });
    return new Response(JSON.stringify({ error: result.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    logger.error('Unexpected form error', { error: String(err) });
    return new Response(JSON.stringify({ error: config.forms.errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
