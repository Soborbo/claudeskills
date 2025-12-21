/**
 * Cloudflare Turnstile Verification
 * Invisible CAPTCHA - Cloudflare-native
 */

const TURNSTILE_SECRET = import.meta.env.TURNSTILE_SECRET_KEY;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileResult {
  success: boolean;
  error?: string;
}

export async function verifyTurnstile(
  token: string,
  ip?: string
): Promise<TurnstileResult> {
  // Skip in dev if not configured
  if (!TURNSTILE_SECRET) {
    console.warn('TURNSTILE_SECRET_KEY not configured - skipping verification');
    return { success: true };
  }
  
  if (!token) {
    return { success: false, error: 'Missing Turnstile token' };
  }
  
  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET,
        response: token,
        ...(ip && { remoteip: ip }),
      }),
    });
    
    const result = await response.json();
    
    return {
      success: result.success === true,
      error: result['error-codes']?.join(', '),
    };
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return { success: false, error: 'Verification failed' };
  }
}
