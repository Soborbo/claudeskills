/**
 * Unified Email Sender
 * Resend primary, Brevo fallback
 */

import { sendViaResend } from './resend';
import { sendViaBrevo } from './brevo';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  provider: 'resend' | 'brevo';
  error?: string;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  // Try Resend first
  const resendResult = await sendViaResend(options);
  if (resendResult.success) {
    return { success: true, provider: 'resend' };
  }
  
  console.warn('Resend failed, trying Brevo:', resendResult.error);
  
  // Fallback to Brevo
  const brevoResult = await sendViaBrevo(options);
  if (brevoResult.success) {
    return { success: true, provider: 'brevo' };
  }
  
  return {
    success: false,
    provider: 'brevo',
    error: brevoResult.error,
  };
}
