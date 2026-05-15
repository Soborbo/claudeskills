/**
 * Rate-limiter behavior tests. Same surface as the unit tests but framed
 * as a Cloudflare/edge concern: the limiter is per-isolate, in-memory.
 * For multi-isolate or multi-region deployments this is intentionally
 * best-effort — graduate to a KV-backed limiter for stronger guarantees.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit } from '../../src/lib/tracking/server';
import { RATE_LIMIT_WINDOW_MS } from '../../src/lib/tracking/config';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('per-key sliding-window limiter', () => {
  it('blocks the (max+1)th request from a single IP', () => {
    const key = `cf-ip-${Math.random()}`;
    for (let i = 0; i < 5; i++) expect(checkRateLimit(key, 5)).toBe(true);
    expect(checkRateLimit(key, 5)).toBe(false);
  });

  it('keeps separate buckets per IP (no cross-tenant denial-of-service)', () => {
    const a = `cf-ip-a-${Math.random()}`;
    const b = `cf-ip-b-${Math.random()}`;
    for (let i = 0; i < 5; i++) checkRateLimit(a, 5);
    expect(checkRateLimit(a, 5)).toBe(false);
    expect(checkRateLimit(b, 5)).toBe(true);
  });

  it('allows requests again after the window elapses', () => {
    const key = `cf-window-${Math.random()}`;
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5);
    expect(checkRateLimit(key, 5)).toBe(false);
    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1000);
    expect(checkRateLimit(key, 5)).toBe(true);
  });

  it('does not crash on empty key (treat unknown IP as unlimited rather than total block)', () => {
    for (let i = 0; i < 1000; i++) {
      expect(checkRateLimit('', 1)).toBe(true);
    }
  });

  it('garbage-collects expired entries on subsequent calls', () => {
    const key = `cf-gc-${Math.random()}`;
    checkRateLimit(key, 5);
    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS * 2);
    // After two windows elapsed, a follow-up call should see a clean
    // bucket and allow the full quota again.
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5)).toBe(true);
    }
  });
});
