import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prewarmTurnstile, getTurnstileToken } from '../lib/gateway';
import { resetAll } from './helpers';

// Own test file → fresh module context → the gateway's token cache starts empty,
// so we can deterministically prove the pre-warm fetched (and cached) a token.

let renderCalls = 0;

function stubTurnstile(token: string): void {
  renderCalls = 0;
  const div = document.createElement('div');
  div.id = 'cf-turnstile-invisible';
  document.body.appendChild(div);
  (window as unknown as { turnstile: unknown }).turnstile = {
    render: (_c: unknown, opts: { callback?: (t: string) => void }) => {
      renderCalls++;
      opts.callback?.(token); // invisible challenge resolves immediately in the stub
      return 'wid';
    },
    reset: () => {},
    execute: () => {},
    getResponse: () => token,
  };
}

beforeEach(() => { resetAll(); document.body.innerHTML = ''; });
afterEach(() => vi.unstubAllGlobals());

describe('prewarmTurnstile', () => {
  it('fetches and caches a token on load, so the first dispatch has no challenge latency', async () => {
    stubTurnstile('PW');

    // Fire-and-forget: returns void, fetches the token via getTurnstileToken().
    expect(prewarmTurnstile()).toBeUndefined();
    expect(renderCalls).toBe(1);

    // The token is now cached → a later dispatch resolves it without re-rendering.
    const tok = await getTurnstileToken();
    expect(tok).toBe('PW');
    expect(renderCalls).toBe(1);
  });
});
