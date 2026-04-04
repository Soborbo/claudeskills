/**
 * Brevo Email Provider (Fallback)
 */

import type { EmailOptions } from './send';

interface BrevoEnv {
  BREVO_API_KEY?: string;
}

export async function sendViaBrevo(
  options: EmailOptions,
  env: BrevoEnv
): Promise<{ success: boolean; error?: string }> {
  const apiKey = env.BREVO_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'BREVO_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
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
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
