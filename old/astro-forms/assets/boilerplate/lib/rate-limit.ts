/**
 * Rate Limiting - Cloudflare KV based
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

declare const RATE_LIMIT_KV: KVNamespace;

const LIMITS = {
  submit: { perMinute: 5 },
  postcode: { perMinute: 30 },
};

export async function checkRateLimit(
  type: keyof typeof LIMITS,
  identifier: string
): Promise<RateLimitResult> {
  const limit = LIMITS[type].perMinute;
  const minuteKey = `${type}:${identifier}:${Math.floor(Date.now() / 60000)}`;
  
  try {
    const current = parseInt(await RATE_LIMIT_KV.get(minuteKey) || '0', 10);
    
    if (current >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: Math.ceil(Date.now() / 60000) * 60000,
      };
    }
    
    await RATE_LIMIT_KV.put(minuteKey, String(current + 1), {
      expirationTtl: 60,
    });
    
    return {
      allowed: true,
      remaining: limit - current - 1,
      resetAt: Math.ceil(Date.now() / 60000) * 60000,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    return { allowed: true, remaining: -1, resetAt: 0 };
  }
}

export function getRateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  };
}
