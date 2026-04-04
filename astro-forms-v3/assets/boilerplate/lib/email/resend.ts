/**
 * Resend Email Provider (Primary)
 */

import type { EmailOptions } from './send';

interface ResendEnv {
  RESEND_API_KEY?: string;
}

export async function sendViaResend(
  options: EmailOptions,
  env: ResendEnv
): Promise<{ success: boolean; error?: string }> {
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
