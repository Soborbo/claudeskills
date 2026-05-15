import { describe, expect, it } from 'vitest';
import { generateUUID } from '../../src/lib/tracking/uuid';

describe('generateUUID', () => {
  it('produces a UUID-shaped string', () => {
    const id = generateUUID();
    expect(id).toMatch(
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
    );
  });

  it('produces unique values across calls', () => {
    const ids = new Set(Array.from({ length: 500 }, () => generateUUID()));
    expect(ids.size).toBe(500);
  });

  it('falls back to getRandomValues when randomUUID throws', () => {
    const originalRandomUUID = crypto.randomUUID;
    (crypto as Crypto & { randomUUID: () => string }).randomUUID = (() => {
      throw new Error('not allowed');
    }) as typeof crypto.randomUUID;
    try {
      const id = generateUUID();
      expect(id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-/i);
    } finally {
      crypto.randomUUID = originalRandomUUID;
    }
  });

  it('falls back to Math.random when crypto APIs are missing entirely', () => {
    const originalCrypto = (globalThis as { crypto?: Crypto }).crypto;
    delete (globalThis as { crypto?: Crypto }).crypto;
    try {
      const id = generateUUID();
      expect(id).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,
      );
    } finally {
      (globalThis as { crypto?: Crypto }).crypto = originalCrypto;
    }
  });
});
