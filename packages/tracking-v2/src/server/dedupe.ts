/**
 * @leadgen/tracking-v2 - Server-Side Deduplication
 *
 * Helpers for implementing server-side deduplication.
 * Use with your API routes to prevent duplicate leads.
 */

// =============================================================================
// Types
// =============================================================================

export interface DedupeStore {
  /** Check if key exists */
  has(key: string): Promise<boolean>;
  /** Add key with optional TTL in seconds */
  set(key: string, ttlSeconds?: number): Promise<void>;
  /** Remove key */
  delete(key: string): Promise<void>;
}

export interface DedupeResult {
  isDuplicate: boolean;
  key: string;
  firstSeenAt?: number;
}

// =============================================================================
// In-Memory Store (for development/testing)
// =============================================================================

interface MemoryEntry {
  createdAt: number;
  expiresAt: number | null;
}

const memoryStore = new Map<string, MemoryEntry>();

/**
 * Create an in-memory deduplication store
 * NOTE: Only use for development - data is lost on restart
 */
export function createMemoryStore(): DedupeStore {
  return {
    async has(key: string): Promise<boolean> {
      const entry = memoryStore.get(key);
      if (!entry) return false;

      // Check expiration
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        memoryStore.delete(key);
        return false;
      }

      return true;
    },

    async set(key: string, ttlSeconds?: number): Promise<void> {
      memoryStore.set(key, {
        createdAt: Date.now(),
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
      });
    },

    async delete(key: string): Promise<void> {
      memoryStore.delete(key);
    },
  };
}

// =============================================================================
// Redis Store Factory
// =============================================================================

interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
}

/**
 * Create a Redis-backed deduplication store
 *
 * @example
 * import { createClient } from 'redis';
 * const redis = createClient();
 * const store = createRedisStore(redis, 'leads:');
 */
export function createRedisStore(
  client: RedisClient,
  prefix = 'lg_dedupe:'
): DedupeStore {
  return {
    async has(key: string): Promise<boolean> {
      const result = await client.get(`${prefix}${key}`);
      return result !== null;
    },

    async set(key: string, ttlSeconds = 86400): Promise<void> {
      await client.set(`${prefix}${key}`, String(Date.now()), { EX: ttlSeconds });
    },

    async delete(key: string): Promise<void> {
      await client.del(`${prefix}${key}`);
    },
  };
}

// =============================================================================
// Cloudflare KV Store Factory
// =============================================================================

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Create a Cloudflare KV-backed deduplication store
 *
 * @example
 * // In Cloudflare Worker or Pages Function
 * const store = createKVStore(env.LEADS_KV);
 */
export function createKVStore(kv: KVNamespace, prefix = 'dedupe:'): DedupeStore {
  return {
    async has(key: string): Promise<boolean> {
      const result = await kv.get(`${prefix}${key}`);
      return result !== null;
    },

    async set(key: string, ttlSeconds = 86400): Promise<void> {
      await kv.put(`${prefix}${key}`, String(Date.now()), {
        expirationTtl: ttlSeconds,
      });
    },

    async delete(key: string): Promise<void> {
      await kv.delete(`${prefix}${key}`);
    },
  };
}

// =============================================================================
// Deduplication Logic
// =============================================================================

/**
 * Check if a request is a duplicate and mark it as seen
 *
 * @example
 * const result = await checkDuplicate(store, payload.idempotency_key);
 * if (result.isDuplicate) {
 *   return new Response('Duplicate', { status: 409 });
 * }
 */
export async function checkDuplicate(
  store: DedupeStore,
  key: string,
  ttlSeconds = 86400
): Promise<DedupeResult> {
  const isDuplicate = await store.has(key);

  if (!isDuplicate) {
    await store.set(key, ttlSeconds);
  }

  return {
    isDuplicate,
    key,
  };
}

/**
 * Validate idempotency key format
 */
export function isValidIdempotencyKey(key: unknown): key is string {
  return typeof key === 'string' && key.length >= 8 && key.length <= 64;
}

/**
 * Create a middleware-style deduplication handler
 *
 * @example
 * const dedupe = createDedupeHandler(store);
 *
 * // In your API route:
 * const result = await dedupe(request.body.idempotency_key);
 * if (result.isDuplicate) {
 *   return { error: 'Duplicate submission' };
 * }
 */
export function createDedupeHandler(
  store: DedupeStore,
  ttlSeconds = 86400
): (key: string) => Promise<DedupeResult> {
  return async (key: string) => checkDuplicate(store, key, ttlSeconds);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate a server-side idempotency key
 * Use when client doesn't provide one
 */
export function generateServerIdempotencyKey(
  email: string,
  eventType: string,
  date = new Date()
): string {
  const dateStr = date.toISOString().slice(0, 10);
  const normalized = email.trim().toLowerCase();

  // Simple hash function
  let hash = 5381;
  const str = `${normalized}:${eventType}:${dateStr}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }

  return (hash >>> 0).toString(16);
}

/**
 * Extract idempotency key from request body
 */
export function extractIdempotencyKey(
  body: Record<string, unknown>
): string | null {
  const key = body.idempotency_key;
  return isValidIdempotencyKey(key) ? key : null;
}
