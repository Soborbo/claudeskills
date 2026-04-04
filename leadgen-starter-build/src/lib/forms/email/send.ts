/**
 * Unified email sender — Resend primary, Brevo fallback
 */

import { sendViaResend } from './resend';
import { sendViaBrevo } from './brevo';

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
}

interface EmailResult {
  success: boolean;
  provider: 'resend' | 'brevo' | 'none';
  error?: string;
}

export async function sendEmail(
  params: EmailParams,
  resendApiKey: string,
  brevoApiKey: string,
): Promise<EmailResult> {
  // Try Resend first
  const resendResult = await sendViaResend(resendApiKey, params);
  if (resendResult.success) {
    return { success: true, provider: 'resend' };
  }

  // Fallback to Brevo
  const brevoResult = await sendViaBrevo(brevoApiKey, params);
  if (brevoResult.success) {
    return { success: true, provider: 'brevo' };
  }

  // Both failed
  return {
    success: false,
    provider: 'none',
    error: `Resend: ${resendResult.error}. Brevo: ${brevoResult.error}`,
  };
}
