/**
 * Cloudflare Turnstile server-side verification
 */

export async function verifyTurnstile(token: string, secretKey: string, remoteip?: string): Promise<boolean> {
  if (!token || !secretKey) return false;

  const body = new URLSearchParams({
    secret: secretKey,
    response: token,
  });

  if (remoteip) {
    body.set('remoteip', remoteip);
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const result = await res.json() as { success: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}
