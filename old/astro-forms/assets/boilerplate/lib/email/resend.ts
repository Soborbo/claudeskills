/**
 * Resend Email Provider (Primary)
 */

import type { EmailOptions } from './send';

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;

export async function sendViaResend(
  options: EmailOptions
): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.fromName 
          ? `${options.fromName} <${options.from}>` 
          : options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
