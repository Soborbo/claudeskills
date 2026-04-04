/**
 * Main form submission handler
 * Pipeline: validate → honeypot → turnstile → rate limit → dedupe → sheets → email → redirect
 */

import { contactSchema } from './schemas';
import { sanitizeInput, escapeHtml } from './sanitize';
import { verifyTurnstile } from './turnstile';
import { checkRateLimit } from './rate-limit';
import { isDuplicate } from './dedupe';
import { appendRow } from './sheets';
import { sendEmail } from './email/send';
import { config } from '../../config/siteConfig.example';
import type { FormSubmission } from './types';

interface Env {
  RATE_LIMIT_KV: KVNamespace;
  RESEND_API_KEY: string;
  BREVO_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  GOOGLE_SHEET_ID: string;
}

interface SubmitResult {
  success: boolean;
  error?: string;
  code?: string;
}

export async function handleFormSubmission(
  formData: FormData,
  env: Env,
  request: Request,
): Promise<SubmitResult> {
  const raw = Object.fromEntries(formData);

  // 1. Honeypot check
  if (raw.website && String(raw.website).length > 0) {
    return { success: false, error: 'Spam detected', code: 'FORM-SPAM-001' };
  }

  // 2. Validate
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, code: 'FORM-VALIDATION-001' };
  }

  const data = parsed.data;

  // 3. Turnstile verification (mandatory when secret key is configured)
  if (env.TURNSTILE_SECRET_KEY) {
    const token = data['cf-turnstile-response'];
    if (!token) {
      return { success: false, error: 'Security check failed — please try again', code: 'FORM-TURNSTILE-001' };
    }
    const ip = request.headers.get('CF-Connecting-IP') || undefined;
    const valid = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip);
    if (!valid) {
      return { success: false, error: 'Security check failed', code: 'FORM-TURNSTILE-001' };
    }
  }

  // 4. Rate limit
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateResult = await checkRateLimit(env.RATE_LIMIT_KV, ip);
  if (!rateResult.allowed) {
    return { success: false, error: 'Too many requests. Please try again later.', code: 'FORM-RATE-001' };
  }

  // 5. Dedupe
  const dupe = await isDuplicate(env.RATE_LIMIT_KV, data.email, 'contact');
  if (dupe) {
    return { success: false, error: 'Duplicate submission detected', code: 'FORM-DUPE-001' };
  }

  // 6. Sanitize (including UTM params to prevent Sheets formula injection)
  const submission: FormSubmission = {
    leadId: crypto.randomUUID(),
    formId: 'contact',
    sourcePage: sanitizeInput(data.source_page || ''),
    name: sanitizeInput(data.name),
    email: data.email.toLowerCase().trim(),
    phone: sanitizeInput(data.phone),
    postcode: data.postcode ? sanitizeInput(data.postcode) : undefined,
    message: data.message ? sanitizeInput(data.message) : undefined,
    consent: true,
    utmSource: data.utm_source ? sanitizeInput(data.utm_source) : undefined,
    utmMedium: data.utm_medium ? sanitizeInput(data.utm_medium) : undefined,
    utmCampaign: data.utm_campaign ? sanitizeInput(data.utm_campaign) : undefined,
    eventId: data.event_id ? sanitizeInput(data.event_id) : undefined,
    timestamp: new Date().toISOString(),
    ip,
  };

  // 7. Save to Google Sheets (async, don't block)
  const sheetsPromise = env.GOOGLE_SHEET_ID ? appendRow(
    {
      serviceAccountEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: env.GOOGLE_PRIVATE_KEY,
      sheetId: env.GOOGLE_SHEET_ID,
    },
    [
      submission.timestamp,
      submission.leadId,
      submission.name,
      submission.email,
      submission.phone,
      submission.postcode || '',
      submission.message || '',
      submission.sourcePage,
      submission.utmSource || '',
      submission.utmMedium || '',
      submission.utmCampaign || '',
    ],
  ).catch(() => {
    // Non-blocking — log but don't fail the submission
  }) : Promise.resolve();

  // 8. Send emails — use config for addresses, sanitize subject
  const safeSubjectName = submission.name.replace(/[&<>"']/g, '').slice(0, 50);
  const emailHtml = `
    <h2>New Lead from Website</h2>
    <table>
      <tr><td><strong>Name:</strong></td><td>${escapeHtml(submission.name)}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${escapeHtml(submission.email)}</td></tr>
      <tr><td><strong>Phone:</strong></td><td>${escapeHtml(submission.phone)}</td></tr>
      ${submission.postcode ? `<tr><td><strong>Postcode:</strong></td><td>${escapeHtml(submission.postcode)}</td></tr>` : ''}
      ${submission.message ? `<tr><td><strong>Message:</strong></td><td>${escapeHtml(submission.message)}</td></tr>` : ''}
      <tr><td><strong>Page:</strong></td><td>${escapeHtml(submission.sourcePage)}</td></tr>
      <tr><td><strong>Time:</strong></td><td>${submission.timestamp}</td></tr>
    </table>
  `;

  const emailResult = await sendEmail(
    {
      to: config.forms.notificationEmail,
      from: `noreply@${new URL(config.url).hostname}`,
      subject: `New Quote Request from ${safeSubjectName}`,
      html: emailHtml,
      replyTo: submission.email,
    },
    env.RESEND_API_KEY,
    env.BREVO_API_KEY,
  );

  // Wait for sheets write
  await sheetsPromise;

  if (!emailResult.success) {
    return { success: false, error: 'Failed to process your request. Please call us directly.', code: 'EMAIL-BOTH-001' };
  }

  return { success: true };
}
