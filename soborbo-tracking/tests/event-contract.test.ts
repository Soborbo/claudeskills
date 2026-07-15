import { describe, it, expect } from 'vitest';
import events from '../events.json';
import {
  BROWSER_GATEWAY_EVENTS, SERVER_INGRESS_ONLY_EVENTS, OFFLINE_EVENTS,
} from '../lib/event-contract';
import { CLICK_GATEWAY_EVENT } from '../lib/index';

/**
 * DRIFT GUARDS. events.json (vendored from Serverside/src/events.json) is the
 * single source of truth; lib/event-contract.ts is its hand-written mirror that
 * ships with lib/ into sites. If any of these fail: regenerate the arrays in
 * lib/event-contract.ts from events.json — do NOT change these tests.
 * (`server/check-event-contract.mjs --engine` guards events.json itself against
 * engine drift.)
 */

interface EventDef {
  name: string;
  kind: string;
  channels: string[];
  server_ingress_only?: boolean;
}

const defs = events as EventDef[];
const ingress = defs.filter((e) => e.channels.includes('server') && e.kind !== 'offline');
const expectedBrowser = ingress.filter((e) => e.server_ingress_only !== true).map((e) => e.name).sort();
const expectedServerOnly = ingress.filter((e) => e.server_ingress_only === true).map((e) => e.name).sort();
const expectedOffline = defs.filter((e) => e.kind === 'offline').map((e) => e.name).sort();

describe('events.json is the post-Run-6 contract', () => {
  it('carries server_ingress_only flags (an old engine vendoring would silently reopen the browser path)', () => {
    expect(expectedServerOnly.length).toBeGreaterThan(0);
    // The five that caused the incident class this gate exists for:
    for (const name of ['quote_calculator_submitted', 'callback_request_submitted', 'contact_form_submitted', 'order_request_submitted', 'purchase']) {
      expect(expectedServerOnly, name).toContain(name);
    }
  });
});

describe('lib/event-contract.ts mirrors events.json exactly', () => {
  it('BROWSER_GATEWAY_EVENTS = server-channel, non-offline, NOT server_ingress_only', () => {
    expect([...BROWSER_GATEWAY_EVENTS].sort()).toEqual(expectedBrowser);
  });
  it('SERVER_INGRESS_ONLY_EVENTS = server_ingress_only:true', () => {
    expect([...SERVER_INGRESS_ONLY_EVENTS].sort()).toEqual(expectedServerOnly);
  });
  it('OFFLINE_EVENTS = kind:offline', () => {
    expect([...OFFLINE_EVENTS].sort()).toEqual(expectedOffline);
  });
  it('the two ingress sets are disjoint', () => {
    for (const n of SERVER_INGRESS_ONLY_EVENTS) expect(BROWSER_GATEWAY_EVENTS.has(n), n).toBe(false);
  });
});

describe('the click map obeys the ingress contract', () => {
  it('every non-null CLICK_GATEWAY_EVENT value is browser-path-allowed', () => {
    for (const [key, name] of Object.entries(CLICK_GATEWAY_EVENT)) {
      if (name === null) continue;
      expect(BROWSER_GATEWAY_EVENTS.has(name), `${key} → ${name}`).toBe(true);
      expect(SERVER_INGRESS_ONLY_EVENTS.has(name), `${key} → ${name}`).toBe(false);
    }
  });
  it('callback has NO browser gateway leg (callback_request_submitted is server-ingress-only)', () => {
    expect(CLICK_GATEWAY_EVENT.callback).toBeNull();
    expect(SERVER_INGRESS_ONLY_EVENTS.has('callback_request_submitted')).toBe(true);
  });
});
