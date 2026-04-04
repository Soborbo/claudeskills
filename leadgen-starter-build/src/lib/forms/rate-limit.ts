/**
 * KV-based rate limiting
 * Default: 5 submissions per hour per IP
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  limit = 5,
  windowSeconds = 3600,
): Promise<RateLimitResult> {
  const kvKey = `rate:${key}`;

  try {
    const existing = await kv.get(kvKey);
    const count = existing ? parseInt(existing, 10) : 0;

    if (count >= limit) {
      return { allowed: false, remaining: 0 };
    }

    await kv.put(kvKey, String(count + 1), { expirationTtl: windowSeconds });
    return { allowed: true, remaining: limit - count - 1 };
  } catch {
    // If KV fails, deny the request (fail closed for security)
    return { allowed: false, remaining: 0 };
  }
}
