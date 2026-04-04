/**
 * Form Submission Handler — Cloudflare Workers
 *
 * Central API endpoint: validation → spam → dedup → storage → email → response
 *
 * Deploy as a Worker (export default { fetch }).
 * Or extract handleSubmit() into an Astro SSR API route.
 *
 * Adapt per project: LOCALE, BUSINESS_EMAIL, FROM_ADDRESS, FROM_NAME.
 */

import { createContactSchema } from './schemas';
import { verifyTurnstile } from './turnstile';
import { checkRateLimit } from './rate-limit';
import { isDuplicate } from './dedupe';
import { saveToSheets } from './sheets';
import { sendEmail } from './email/send';
import { escapeHtml } from './sanitize';
import { createLogger, generateRequestId } from './logger';
import type { FormSubmission } from './types';

// ─── Config — adapt per project ──────────────────────────
// LOCALE and CORS_ORIGIN can also be set as env vars to avoid code changes.

const LOCALE = 'en-GB'; // or 'hu-HU'
const BUSINESS_EMAIL = 'info@example.com';
const FROM_ADDRESS = 'noreply@example.com';
const FROM_NAME = 'Example Business';
const MIN_FILL_TIME_MS = 3000;

// ─── Env type ────────────────────────────────────────────

export interface Env {
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  BREVO_API_KEY?: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  GOOGLE_SHEET_ID: string;
  RATE_LIMIT_KV: KVNamespace;
  IP_HASH_SALT: string;
  CORS_ORIGIN?: string;  // e.g. "https://example.com" — defaults to "*"
  LOCALE?: string;        // e.g. "hu-HU" — defaults to "en-GB"
}

// ─── Workers entry point ─────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(env),
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, env);
    }

    const url = new URL(request.url);
    if (url.pathname === '/api/submit') {
      return handleSubmit(request, env, ctx);
    }

    return jsonResponse({ error: 'Not found' }, 404, env);
  },
};

// ─── Submit handler ──────────────────────────────────────

export async function handleSubmit(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const requestId = generateRequestId();
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  const log = createLogger({ requestId, ip: clientIp, path: '/api/submit' });

  try {
    // 1. Parse body
    const body = await request.json();
    log.info('Form submission received', { formId: body.formId });

    // 2. Validate with Zod
    const locale = env.LOCALE || LOCALE;
    const schema = createContactSchema(locale);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      log.warn('Validation failed', { errors: parsed.error.flatten().fieldErrors });
      return jsonResponse({ errors: parsed.error.flatten().fieldErrors }, 400, env);
    }

    const data = parsed.data;

    // 3. Honeypot check
    if (data.honeypot) {
      log.info('Honeypot triggered, silent reject');
      return jsonResponse({ success: true }, 200, env); // Silent OK
    }

    // 4. Time check (anti-bot) — NOT in Zod, checked here
    const formStartTime = Number(body.formStartTime);
    if (formStartTime && Date.now() - formStartTime < MIN_FILL_TIME_MS) {
      log.info('Time check failed, likely bot');
      return jsonResponse({ success: true }, 200, env); // Silent OK
    }

    // 5. Turnstile verification
    if (data['cf-turnstile-response']) {
      const turnstile = await verifyTurnstile(
        data['cf-turnstile-response'],
        clientIp,
        env
      );
      if (!turnstile.success) {
        log.warn('Turnstile failed', { error: turnstile.error });
        return jsonResponse({ error: 'Verification failed. Please try again.' }, 400, env);
      }
    }

    // 6. Rate limiting
    const ipHash = await hashIp(clientIp, env.IP_HASH_SALT);
    const rateLimit = await checkRateLimit(env.RATE_LIMIT_KV, 'submit', ipHash);
    if (!rateLimit.allowed) {
      log.warn('Rate limit exceeded', { ip: ipHash });
      return jsonResponse(
        { error: 'Too many submissions. Please try again later.' },
        429, env
      );
    }

    // 7. Duplicate check
    const duplicate = await isDuplicate(env.RATE_LIMIT_KV, data.email, data.formId);
    if (duplicate) {
      log.info('Duplicate submission detected, silent accept');
      return jsonResponse({ success: true, redirect: '/thank-you' }, 200, env);
    }

    // 8. Build canonical submission
    const submission: FormSubmission = {
      leadId: crypto.randomUUID(),
      formId: data.formId,
      sourcePage: data.sourcePage,
      submittedAt: new Date().toISOString(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      ipHash,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      referrer: data.referrer,
    };

    // 9. Save to Google Sheets — non-blocking via ctx.waitUntil
    ctx.waitUntil(
      saveToSheets(
        {
          leadId: submission.leadId,
          name: submission.name,
          email: submission.email,
          phone: submission.phone || '',
          message: submission.message || '',
          sourcePage: submission.sourcePage,
          submittedAt: submission.submittedAt,
          utmSource: submission.utmSource || '',
          utmMedium: submission.utmMedium || '',
          utmCampaign: submission.utmCampaign || '',
        },
        env
      ).then((result) => {
        if (!result.success) {
          log.error('Sheets save failed (async)', result.error);
        } else {
          log.info('Sheets save succeeded');
        }
      })
    );

    // 10. Send customer confirmation email
    const customerEmail = await sendEmail(
      {
        to: submission.email,
        from: FROM_ADDRESS,
        fromName: FROM_NAME,
        subject:
          locale === 'hu-HU'
            ? 'Köszönjük megkeresését!'
            : 'Thank you for your enquiry',
        html: buildCustomerEmailHtml(submission, locale),
      },
      env
    );

    if (!customerEmail.success) {
      log.warn('Customer confirmation email failed', { error: customerEmail.error });
    }

    // 11. Send business notification email
    const businessEmail = await sendEmail(
      {
        to: BUSINESS_EMAIL,
        from: FROM_ADDRESS,
        fromName: FROM_NAME,
        replyTo: submission.email,
        subject: `New lead: ${escapeHtml(submission.name)}`,
        html: buildBusinessEmailHtml(submission),
      },
      env
    );

    if (!businessEmail.success) {
      log.error('Business notification email failed', businessEmail.error);
    }

    // 12. Log success
    log.info('Submission processed', {
      leadId: submission.leadId,
      customerEmail: customerEmail.provider,
      businessEmail: businessEmail.provider,
    });

    // 13. Return success
    return jsonResponse({
      success: true,
      redirect: '/thank-you',
      leadId: submission.leadId,
    }, 200, env);
  } catch (error) {
    log.error('Unhandled submission error', error);
    return jsonResponse({ error: 'Something went wrong. Please try again.' }, 500, env);
  }
}

// ─── Helpers ─────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200, env?: Env): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env),
    },
  });
}

function corsHeaders(env?: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env?.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function hashIp(ip: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${ip}:${salt}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(hash));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// ─── Email Templates ─────────────────────────────────────

function buildCustomerEmailHtml(s: FormSubmission, locale = LOCALE): string {
  const name = escapeHtml(s.name);

  if (locale === 'hu-HU') {
    return `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
        <h1 style="color:#1C202F">Köszönjük megkeresését!</h1>
        <p>Kedves ${name}!</p>
        <p>Megkaptuk üzenetét, és hamarosan felvesszük Önnel a kapcsolatot.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0" />
        <p style="font-size:12px;color:#666">Ez egy automatikus üzenet.</p>
      </div>
    `;
  }

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
      <h1 style="color:#1C202F">Thank you for your enquiry</h1>
      <p>Dear ${name},</p>
      <p>We have received your message and will be in touch shortly.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:30px 0" />
      <p style="font-size:12px;color:#666">This is an automated message.</p>
    </div>
  `;
}

function buildBusinessEmailHtml(s: FormSubmission): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h1>New lead received</h1>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;width:120px">Name</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(s.name)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Email</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(s.email)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Phone</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(s.phone || '-')}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Message</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(s.message || '-')}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Source</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(s.sourcePage)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Time</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(s.submittedAt)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Lead ID</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(s.leadId)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">UTM</td><td style="padding:8px">${escapeHtml(s.utmSource || '-')} / ${escapeHtml(s.utmMedium || '-')} / ${escapeHtml(s.utmCampaign || '-')}</td></tr>
      </table>
    </div>
  `;
}
