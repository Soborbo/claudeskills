/**
 * Brevo Email Provider (Fallback)
 */

import type { EmailOptions } from './send';

const BREVO_API_KEY = import.meta.env.BREVO_API_KEY;

export async function sendViaBrevo(
  options: EmailOptions
): Promise<{ success: boolean; error?: string }> {
  if (!BREVO_API_KEY) {
    return { success: false, error: 'BREVO_API_KEY not configured' };
  }
  
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: options.fromName,
          email: options.from,
        },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        replyTo: options.replyTo ? { email: options.replyTo } : undefined,
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
