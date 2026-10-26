import { describe, expect, it, vi } from 'vitest';
import { deliverOnce, type KvLike, leadAccepted } from '../src/dedupe';

function memKv(): KvLike & { m: Map<string, string> } {
  const m = new Map<string, string>();
  return { m, get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, v) };
}

describe('deliverOnce (check before, mark after)', () => {
  it('regression lomtalan: a failed delivery does not block the retry', async () => {
    const kv = memKv();
    const failing = vi.fn().mockResolvedValue({ ok: false, error: 'resend down' });
    expect((await deliverOnce(kv, 'evt-1', failing)).status).toBe('failed');
    const ok = vi.fn().mockResolvedValue({ ok: true });
    expect((await deliverOnce(kv, 'evt-1', ok)).status).toBe('delivered');
    expect(ok).toHaveBeenCalledOnce();
  });

  it('a delivered event is a duplicate on resend; a new event is not', async () => {
    const kv = memKv();
    const ok = vi.fn().mockResolvedValue({ ok: true });
    await deliverOnce(kv, 'evt-1', ok);
    expect((await deliverOnce(kv, 'evt-1', ok)).status).toBe('duplicate');
    expect((await deliverOnce(kv, 'evt-2', ok)).status).toBe('delivered');
    expect(ok).toHaveBeenCalledTimes(2);
  });

  it('KV outage never loses the lead', async () => {
    const broken: KvLike = { get: () => Promise.reject(new Error('kv')), put: () => Promise.reject(new Error('kv')) };
    const ok = vi.fn().mockResolvedValue({ ok: true });
    expect((await deliverOnce(broken, 'e', ok)).status).toBe('delivered');
    expect((await deliverOnce(null, 'e', ok)).status).toBe('delivered');
  });
});

describe('leadAccepted', () => {
  it('a stored lead is a success even if the notification e-mail failed', () => {
    expect(leadAccepted({ crm: true, sheets: false, email: false }, ['crm', 'sheets'])).toBe(true);
    expect(leadAccepted({ crm: false, sheets: false, email: true }, ['crm', 'sheets'])).toBe(false);
  });
});
