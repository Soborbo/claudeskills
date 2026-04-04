/**
 * Rate Limiting — Cloudflare KV based
 *
 * KV is eventually consistent. This is acceptable for form spam control.
 * For strict counting, use Durable Objects instead.
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const LIMITS = {
  submit: { max: 5, windowSeconds: 3600 },    // 5 per hour
  postcode: { max: 30, windowSeconds: 60 },    // 30 per minute
} as const;

/**
 * Check rate limit for an action.
 * @param kv - Cloudflare KV namespace (from context.env.RATE_LIMIT_KV)
 * @param action - 'submit' | 'postcode'
 * @param identifier - Hashed IP or similar identifier
 */
export async function checkRateLimit(
  kv: KVNamespace,
  action: keyof typeof LIMITS,
  identifier: string
): Promise<RateLimitResult> {
  const limit = LIMITS[action];
  const windowKey = Math.floor(Date.now() / (limit.windowSeconds * 1000));
  const key = `rate:${action}:${identifier}:${windowKey}`;

  try {
    const current = parseInt((await kv.get(key)) || '0', 10);

    if (current >= limit.max) {
      const resetAt = (windowKey + 1) * limit.windowSeconds * 1000;
      return { allowed: false, remaining: 0, resetAt };
    }

    await kv.put(key, String(current + 1), {
      expirationTtl: limit.windowSeconds,
    });

    const resetAt = (windowKey + 1) * limit.windowSeconds * 1000;
    return {
      allowed: true,
      remaining: limit.max - current - 1,
      resetAt,
    };
  } catch (error) {
    // On KV error, allow the request (don't block real users over infra failure)
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: -1, resetAt: 0 };
  }
}

/**
 * Generate rate limit headers for the response.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  };
}
