/**
 * Unified Email Sender
 * Resend primary, Brevo fallback. Auto-switches on failure.
 */

import { sendViaResend } from './resend';
import { sendViaBrevo } from './brevo';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from: string;
  fromName?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  provider: 'resend' | 'brevo' | 'none';
  error?: string;
}

export interface EmailEnv {
  RESEND_API_KEY?: string;
  BREVO_API_KEY?: string;
}

/**
 * Send email with automatic fallback.
 * @param options - Email content and recipients
 * @param env - Environment variables from context.env
 */
export async function sendEmail(
  options: EmailOptions,
  env: EmailEnv
): Promise<EmailResult> {
  // Try Resend first
  const resendResult = await sendViaResend(options, env);
  if (resendResult.success) {
    return { success: true, provider: 'resend' };
  }

  console.warn('Resend failed, trying Brevo:', resendResult.error);

  // Fallback to Brevo
  const brevoResult = await sendViaBrevo(options, env);
  if (brevoResult.success) {
    return { success: true, provider: 'brevo' };
  }

  console.error('Both email providers failed:', {
    resend: resendResult.error,
    brevo: brevoResult.error,
  });

  return {
    success: false,
    provider: 'none',
    error: `Resend: ${resendResult.error}; Brevo: ${brevoResult.error}`,
  };
}
