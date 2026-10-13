import { describe, expect, it, vi } from 'vitest';
import { createSubmitGuard } from '../src/submit-guard';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('createSubmitGuard (invariants E/H/L)', () => {
  it('regression femkeriteslec: a double click sends one request', async () => {
    let release!: () => void;
    const fetchImpl = vi.fn(() => new Promise<Response>((r) => { release = () => r(json(200, { success: true })); }));
    const g = createSubmitGuard({ fetchImpl: fetchImpl as unknown as typeof fetch, fallbackError: 'Hiba' });
    const p1 = g.submit('/api/x', {});
    const p2 = await g.submit('/api/x', {});
    expect(p2.skipped).toBe('in-flight');
    release();
    expect((await p1).ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('regression femkeriteslec: 5xx / network error is a failure with a user message, success callback not run', async () => {
    const onSuccess = vi.fn();
    const g1 = createSubmitGuard({ fetchImpl: (async () => json(503, {})) as typeof fetch, fallbackError: 'Hívjon minket' });
    expect(await g1.submit('/api/x', {}, onSuccess)).toMatchObject({ ok: false, status: 503, error: 'Hívjon minket' });
    const g2 = createSubmitGuard({ fetchImpl: (async () => { throw new TypeError('offline'); }) as typeof fetch, fallbackError: 'Hívjon minket' });
    expect(await g2.submit('/api/x', {}, onSuccess)).toMatchObject({ ok: false, error: 'Hívjon minket' });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('a 200 with success:false is a failure and surfaces the server message', async () => {
    const g = createSubmitGuard({ fetchImpl: (async () => json(200, { success: false, error: 'Érvénytelen telefonszám' })) as typeof fetch, fallbackError: 'x' });
    expect((await g.submit('/api/x', {})).error).toBe('Érvénytelen telefonszám');
  });

  it('regression olcsokontenerhaz: event_id is stable across retries, conversion only after success', async () => {
    const bodies: string[] = [];
    let n = 0;
    const fetchImpl = (async (_u: string, init: RequestInit) => { bodies.push(String(init.body)); return ++n === 1 ? json(403, {}) : json(200, { success: true }); }) as unknown as typeof fetch;
    const conversions: string[] = [];
    const g = createSubmitGuard({ fetchImpl, fallbackError: 'x' });
    await g.submit('/api/x', { a: 1 }, (_d, id) => conversions.push(id));
    await g.submit('/api/x', { a: 1 }, (_d, id) => conversions.push(id));
    const ids = bodies.map((b) => JSON.parse(b).event_id);
    expect(ids[0]).toBe(ids[1]);
    expect(conversions).toEqual([ids[0]]);
    g.reset();
    expect(g.currentEventId()).not.toBe(ids[0]);
  });
});
