/**
 * Cloudflare Turnstile Verification
 * Invisible CAPTCHA — uses form-urlencoded per Cloudflare docs.
 */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileResult {
  success: boolean;
  error?: string;
}

interface TurnstileEnv {
  TURNSTILE_SECRET_KEY?: string;
}

/**
 * Verify a Turnstile token server-side.
 * @param token - The cf-turnstile-response from the form
 * @param ip - Client IP from CF-Connecting-IP header
 * @param env - Environment variables from context.env
 */
export async function verifyTurnstile(
  token: string,
  ip: string,
  env: TurnstileEnv
): Promise<TurnstileResult> {
  const secret = env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.error('CRITICAL: TURNSTILE_SECRET_KEY not configured');
    return { success: false, error: 'Turnstile not configured' };
  }

  if (!token) {
    return { success: false, error: 'Missing Turnstile token' };
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
      ...(ip && { remoteip: ip }),
    });

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const result = await response.json() as {
      success: boolean;
      'error-codes'?: string[];
    };

    return {
      success: result.success === true,
      error: result['error-codes']?.join(', '),
    };
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return { success: false, error: 'Verification request failed' };
  }
}
