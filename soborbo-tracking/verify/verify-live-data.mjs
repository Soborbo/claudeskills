#!/usr/bin/env node
// @ts-check
/**
 * LAYER: live-data — did reality receive what the code claims to send?
 *
 * Every other layer verifies the MACHINERY. This one verifies the OUTCOME:
 * it reads the GA4 Data API and asserts attribution QUALITY, not just volume
 * (volume drops are the watchdog's job — this layer is the post-change /
 * on-demand twin that catches what volume can't):
 *
 *   1. PRESENCE  — each key event occurred at all in the window. An event
 *      that the code "fires" but GA4 never receives is the historical
 *      failure mode where a state machine held conversions that never fired
 *      (Google Ads saw ONE quote conversion in 14 weeks).
 *   2. ATTRIBUTION — the share of each key event landing with session source
 *      "(not set)" / channel "Unassigned" is under a threshold. Orphaned
 *      events never match a gclid, so Ads reports 0 conversions for real
 *      leads — the other historical failure mode.
 *
 * Honest limits, printed in the report: GA4 data lags 24–48h, so run this
 * against a window that ends yesterday; and a PASS here says the pipeline
 * works for the traffic that consented — it cannot see consent-denied
 * visitors.
 *
 * Auth: GA_SA_EMAIL + GA_SA_PRIVATE_KEY service account with Viewer on the
 * property (same pair as monitoring/watchdog.ts), GA4_PROPERTY_ID.
 *
 * Usage:
 *   node verify/verify-live-data.mjs \
 *     --key-events quote_calculator_conversion,callback_conversion,phone_conversion \
 *     [--days 2] [--max-unassigned 0.4] [--min-count 1]
 */

import { createSign } from 'node:crypto';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    'key-events': { type: 'string' },
    days: { type: 'string', default: '2' },
    'max-unassigned': { type: 'string', default: '0.4' },
    'min-count': { type: 'string', default: '1' },
  },
});

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function ga4Token() {
  const email = process.env.GA_SA_EMAIL;
  const key = process.env.GA_SA_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !key || !process.env.GA4_PROPERTY_ID) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  const jwt = `${header}.${payload}.${b64url(signer.sign(key))}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`OAuth ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()).access_token;
}

async function runReport(token, keyEvents, days) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'yesterday' }],
        dimensions: [{ name: 'eventName' }, { name: 'sessionSource' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: keyEvents } } },
        limit: 1000,
      }),
    },
  );
  if (!res.ok) throw new Error(`GA4 Data API ${res.status}: ${(await res.text()).slice(0, 500)}`);
  return res.json();
}

async function main() {
  if (!args['key-events']) {
    console.error('FATAL: --key-events is required (comma-separated GA4 event names as the property receives them)');
    process.exit(2);
  }
  const keyEvents = args['key-events'].split(',').map((s) => s.trim()).filter(Boolean);
  const token = await ga4Token();
  if (!token) {
    console.error(
      '\n  ⚠ SKIPPED (NOT verified): no GA4 credentials.\n' +
      '    Set GA_SA_EMAIL, GA_SA_PRIVATE_KEY (service account, Viewer on the property)\n' +
      '    and GA4_PROPERTY_ID. A skip is NOT a pass: live data was NOT checked.\n',
    );
    process.exit(3);
  }

  const days = Number(args.days);
  const maxUnassigned = Number(args['max-unassigned']);
  const minCount = Number(args['min-count']);
  const data = await runReport(token, keyEvents, days);

  /** @type {Map<string, {total:number, unassigned:number, sources:Map<string,number>}>} */
  const byEvent = new Map(keyEvents.map((e) => [e, { total: 0, unassigned: 0, sources: new Map() }]));
  for (const r of data.rows ?? []) {
    const [ev, source] = r.dimensionValues.map((d) => d.value);
    const n = Number(r.metricValues[0].value);
    const agg = byEvent.get(ev);
    if (!agg) continue;
    agg.total += n;
    agg.sources.set(source, (agg.sources.get(source) ?? 0) + n);
    if (source === '(not set)' || source === '') agg.unassigned += n;
  }

  const failures = [];
  console.log(`  window: last ${days} day(s) ending yesterday (GA4 lags 24-48h — today is never complete)\n`);
  for (const [ev, agg] of byEvent) {
    const share = agg.total > 0 ? agg.unassigned / agg.total : 0;
    const top = [...agg.sources.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([s, n]) => `${s || '(empty)'}:${n}`).join(', ');
    console.log(`  ${ev.padEnd(36)} total=${String(agg.total).padStart(4)}  unassigned=${(share * 100).toFixed(0).padStart(3)}%  top: ${top || '—'}`);
    if (agg.total < minCount) {
      failures.push(`\`${ev}\`: only ${agg.total} occurrence(s) in ${days} day(s) (min ${minCount}) — the event is not arriving; the machinery may look fine while firing into the void`);
    } else if (share > maxUnassigned) {
      failures.push(`\`${ev}\`: ${(share * 100).toFixed(0)}% of hits land with source "(not set)" (max ${(maxUnassigned * 100).toFixed(0)}%) — attribution is broken (missing session stitching / client_id), Ads cannot match a gclid`);
    }
  }

  console.log('\n  NOTE: PASS covers consented traffic only; consent-denied visitors are invisible to GA4.');
  for (const f of failures) console.error(`  FAIL  ${f}`);
  console.log(`\nverify-live-data: ${keyEvents.length} key event(s), ${failures.length} failure(s)`);
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`FATAL: ${err.stack || err}`);
  process.exit(2);
});
