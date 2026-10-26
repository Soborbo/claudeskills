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

  it('review repro: HTTP 200 with ok:false is rejected and no conversion fires', async () => {
    const g = createSubmitGuard({ fallbackError: 'error', fetchImpl: (async () => json(200, { ok: false, error: 'rejected' })) as typeof fetch });
    let conversions = 0;
    const out = await g.submit('/fake', {}, () => { conversions++; });
    expect(out).toMatchObject({ ok: false, state: 'rejected', status: 200, error: 'rejected' });
    expect(conversions).toBe(0);
  });

  it.each([
    ['202 success:true deferred:true (painlessremovals)', 202, { success: true, deferred: true }],
    ['200 status:"pending"', 200, { success: true, status: 'pending' }],
    ['200 pending:true', 200, { ok: true, pending: true }],
    ['202 without a body flag', 202, { success: true }],
  ])('pending / deferred is its own outcome, not success: %s', async (_n, status, body) => {
    const onSuccess = vi.fn();
    const g = createSubmitGuard({ fallbackError: 'x', fetchImpl: (async () => json(status, body)) as typeof fetch });
    const out = await g.submit('/api/x', {}, onSuccess);
    expect(out).toMatchObject({ ok: false, state: 'pending', status });
    expect(out.error).toBeUndefined();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('2xx ≠ business success: a 2xx without an explicit acceptance flag is not accepted by default', async () => {
    const onSuccess = vi.fn();
    const g1 = createSubmitGuard({ fallbackError: 'Hívjon minket', fetchImpl: (async () => json(200, {})) as typeof fetch });
    expect(await g1.submit('/api/x', {}, onSuccess)).toMatchObject({ ok: false, state: 'rejected', error: 'Hívjon minket' });
    const g2 = createSubmitGuard({ fallbackError: 'x', fetchImpl: (async () => new Response('<html>ok</html>', { status: 200 })) as typeof fetch });
    expect(await g2.submit('/api/x', {}, onSuccess)).toMatchObject({ ok: false, state: 'rejected' });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('isAccepted is configurable (e.g. the site contract is `leadAccepted: true`)', async () => {
    const onSuccess = vi.fn();
    const isAccepted = (_res: Response, data: unknown) => ((data as { leadAccepted?: boolean })?.leadAccepted ? 'accepted' as const : 'rejected' as const);
    const g = createSubmitGuard({ fallbackError: 'x', isAccepted, fetchImpl: (async () => json(200, { leadAccepted: true, emailSent: false })) as typeof fetch });
    expect(await g.submit('/api/x', {}, onSuccess)).toMatchObject({ ok: true, state: 'accepted' });
    const g2 = createSubmitGuard({ fallbackError: 'x', isAccepted, fetchImpl: (async () => json(200, { success: true, leadAccepted: false })) as typeof fetch });
    expect(await g2.submit('/api/x', {}, onSuccess)).toMatchObject({ ok: false, state: 'rejected' });
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('a non-2xx is never accepted, even if isAccepted says so', async () => {
    const g = createSubmitGuard({ fallbackError: 'x', isAccepted: () => true, fetchImpl: (async () => json(500, { success: true })) as typeof fetch });
    expect(await g.submit('/api/x', {})).toMatchObject({ ok: false, state: 'rejected', status: 500 });
  });

  it('review repro: a throwing onSuccess (tracking) does not turn an accepted lead into a network error', async () => {
    const g = createSubmitGuard({ fallbackError: 'Hálózati hiba', fetchImpl: (async () => json(200, { success: true })) as typeof fetch });
    const out = await g.submit('/api/x', {}, () => { throw new Error('dataLayer is not defined'); });
    expect(out).toMatchObject({ ok: true, state: 'accepted', status: 200 });
    expect(out.error).toBeUndefined();
    expect((out.callbackError as Error).message).toBe('dataLayer is not defined');
    expect(g.inFlight).toBe(false);
  });

  it('a rejecting async onSuccess is isolated the same way', async () => {
    const g = createSubmitGuard({ fallbackError: 'x', fetchImpl: (async () => json(200, { success: true })) as typeof fetch });
    const out = await g.submit('/api/x', {}, async () => { throw new Error('beacon'); });
    expect(out).toMatchObject({ ok: true, state: 'accepted' });
    expect((out.callbackError as Error).message).toBe('beacon');
  });

  it('a network error is reported as state network-error', async () => {
    const g = createSubmitGuard({ fallbackError: 'x', fetchImpl: (async () => { throw new TypeError('offline'); }) as typeof fetch });
    expect(await g.submit('/api/x', {})).toMatchObject({ ok: false, state: 'network-error', status: 0 });
  });
});
