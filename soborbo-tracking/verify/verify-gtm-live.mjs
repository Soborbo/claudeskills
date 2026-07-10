#!/usr/bin/env node
// @ts-check
/**
 * LAYER: gtm-live — code event vocabulary vs the LIVE GTM container.
 *
 * `check-event-contract.mjs` validates code ↔ docs ↔ the COMMITTED container
 * JSON. That is necessary but was proven insufficient in production: a repo
 * carried a generated container export that was NEVER published, while the
 * live container evolved separately in the GTM UI. Every audit that read the
 * repo JSON reached wrong conclusions — in both directions (it "found" a
 * broken trigger that was fine live, and it would happily have "verified"
 * tags that never went live).
 *
 * This layer asks the Tag Manager API for the LIVE (published) container
 * version and checks:
 *
 *   1. Every conversion-grade event name the CODE emits has a live
 *      CUSTOM_EVENT trigger listening for exactly that name.
 *   2. Every such trigger fires at least one non-paused tag.
 *   3. (warning) Live CUSTOM_EVENT triggers no code path emits — dead
 *      triggers, or drift the other way (code renamed, GTM not updated).
 *   4. (warning) The committed container JSON, if present, differs from live
 *      in its trigger set — a standing invitation for the next bad audit.
 *
 * Auth (either):
 *   - GTM_ACCESS_TOKEN            — an OAuth2 access token with
 *                                   tagmanager.readonly scope, or
 *   - GA_SA_EMAIL + GA_SA_PRIVATE_KEY — a Google service account (same pair
 *                                   the watchdog uses; grant it Read on the
 *                                   GTM container). PEM PKCS8 private key.
 * Plus:
 *   - GTM_ACCOUNT_ID, GTM_CONTAINER_ID (numeric ids, not GTM-XXXX).
 *
 * Offline mode for CI-without-creds and for testing this script itself:
 *   --snapshot live-container.json   — a saved live-version export (the
 *   response of tagmanager.accounts.containers.versions:live). The check
 *   logic runs identically; the report banner says SNAPSHOT so nobody
 *   mistakes it for a live read.
 *
 * Usage:
 *   node verify/verify-gtm-live.mjs --events ./events-found.json \
 *     [--conversion-events quote_calculator_conversion,callback_conversion,...] \
 *     [--snapshot ./live-container.json] [--committed ./gtm/container.json]
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    events: { type: 'string', default: './events-found.json' },
    'conversion-events': { type: 'string' },
    snapshot: { type: 'string' },
    committed: { type: 'string' },
  },
});

const IGNORE_EVENTS = new Set(['gtm.js', 'gtm.dom', 'gtm.load', 'gtm.start']);

// ---------------------------------------------------------------------------
// Auth + fetch
// ---------------------------------------------------------------------------

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function accessToken() {
  if (process.env.GTM_ACCESS_TOKEN) return process.env.GTM_ACCESS_TOKEN;
  const email = process.env.GA_SA_EMAIL;
  const key = process.env.GA_SA_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !key) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/tagmanager.readonly',
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
  if (!res.ok) throw new Error(`OAuth token exchange failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()).access_token;
}

async function fetchLiveVersion() {
  if (args.snapshot) {
    return { source: `SNAPSHOT ${args.snapshot}`, version: JSON.parse(await readFile(args.snapshot, 'utf8')) };
  }
  const token = await accessToken();
  const { GTM_ACCOUNT_ID, GTM_CONTAINER_ID } = process.env;
  if (!token || !GTM_ACCOUNT_ID || !GTM_CONTAINER_ID) {
    console.error(
      '\n  ⚠ SKIPPED (NOT verified): no GTM credentials.\n' +
      '    Set GTM_ACCESS_TOKEN (tagmanager.readonly) or GA_SA_EMAIL + GA_SA_PRIVATE_KEY,\n' +
      '    plus GTM_ACCOUNT_ID and GTM_CONTAINER_ID — or pass --snapshot for offline mode.\n' +
      '    A skip is NOT a pass: the live container was NOT checked.\n',
    );
    process.exit(3); // distinct exit code: skipped, not passed
  }
  const url = `https://tagmanager.googleapis.com/tagmanager/v2/accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}/versions:live`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`GTM API ${res.status}: ${(await res.text()).slice(0, 500)}`);
  return { source: 'LIVE (Tag Manager API)', version: await res.json() };
}

// ---------------------------------------------------------------------------
// Container model
// ---------------------------------------------------------------------------

/** Custom-event trigger name(s) from a live-version trigger entry.
 *  The live API spells the type `customEvent`; workspace exports spell it
 *  `CUSTOM_EVENT` — normalize both. */
function customEventNames(trigger) {
  if ((trigger.type || '').toLowerCase().replace(/_/g, '') !== 'customevent') return [];
  const names = [];
  for (const f of trigger.customEventFilter ?? []) {
    for (const p of f.parameter ?? []) {
      if (p.key === 'arg1' && typeof p.value === 'string') names.push(p.value);
    }
  }
  return names;
}

function modelContainer(version) {
  const triggersByEvent = new Map(); // event name -> [{triggerId, name}]
  for (const t of version.trigger ?? []) {
    for (const ev of customEventNames(t)) {
      if (!triggersByEvent.has(ev)) triggersByEvent.set(ev, []);
      triggersByEvent.get(ev).push({ id: t.triggerId, name: t.name });
    }
  }
  const tagsByTrigger = new Map(); // triggerId -> [{name, paused}]
  for (const tag of version.tag ?? []) {
    for (const tid of tag.firingTriggerId ?? []) {
      if (!tagsByTrigger.has(tid)) tagsByTrigger.set(tid, []);
      tagsByTrigger.get(tid).push({ name: tag.name, paused: tag.paused === true });
    }
  }
  return { triggersByEvent, tagsByTrigger };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!existsSync(args.events)) {
    console.error(`FATAL: ${args.events} not found — run verify-source.mjs --emit-events first`);
    process.exit(2);
  }
  const codeEvents = JSON.parse(await readFile(args.events, 'utf8')).filter((e) => !IGNORE_EVENTS.has(e));
  const configured = args['conversion-events']
    ? args['conversion-events'].split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  // Conversion-grade = the configured list UNION any code event whose name
  // looks conversion-shaped. The union matters: with only the configured
  // list, renaming an event in code slips through (the old name stays in
  // config, the new name is never checked) — the exact drift this layer
  // exists to catch.
  const heuristic = codeEvents.filter((e) => /conversion|submitted/.test(e) && e !== 'form_submission');
  const conversionEvents = [...new Set([...configured, ...heuristic])];

  const { source, version } = await fetchLiveVersion();
  const { triggersByEvent, tagsByTrigger } = modelContainer(version);
  const failures = [];
  const warnings = [];

  console.log(`  container source: ${source}` + (version.containerVersionId ? ` (version ${version.containerVersionId}${version.name ? ` — "${version.name}"` : ''})` : ''));

  // 0: every CONFIGURED conversion event must still exist in the code —
  // a configured name the code no longer emits means the event was renamed
  // or deleted without updating the contract (and probably without GTM).
  for (const ev of configured) {
    if (!codeEvents.includes(ev)) {
      failures.push(`configured conversion event \`${ev}\` is emitted NOWHERE in the code — renamed or deleted? Update verify.site.json AND the GTM container together`);
    }
  }

  // 1 + 2: every conversion event has a live trigger that fires a live tag.
  for (const ev of conversionEvents) {
    const trigs = triggersByEvent.get(ev) ?? [];
    if (trigs.length === 0) {
      failures.push(`code emits conversion event \`${ev}\` but the ${args.snapshot ? 'snapshot' : 'LIVE'} container has NO custom-event trigger for it — the event fires into the void`);
      continue;
    }
    const firing = trigs.flatMap((t) => (tagsByTrigger.get(t.id) ?? []).filter((tag) => !tag.paused));
    if (firing.length === 0) {
      failures.push(`\`${ev}\` has trigger(s) ${trigs.map((t) => t.name).join(', ')} but every attached tag is missing or paused`);
    }
  }

  // Non-conversion events get the softer treatment: missing trigger is a warning.
  for (const ev of codeEvents) {
    if (conversionEvents.includes(ev)) continue;
    if (!triggersByEvent.has(ev)) warnings.push(`code emits \`${ev}\` with no live trigger (analytics event unused in GTM — intentional?)`);
  }

  // 3: dead live triggers.
  for (const [ev, trigs] of triggersByEvent) {
    if (!codeEvents.includes(ev)) {
      warnings.push(`live trigger(s) ${trigs.map((t) => t.name).join(', ')} listen for \`${ev}\` which NO code path emits — dead trigger or code/GTM drift`);
    }
  }

  // 4: committed JSON drift.
  if (args.committed && existsSync(args.committed)) {
    try {
      const committedRaw = JSON.parse(await readFile(args.committed, 'utf8'));
      const committed = modelContainer(committedRaw.containerVersion ?? committedRaw);
      const liveSet = new Set(triggersByEvent.keys());
      const committedSet = new Set(committed.triggersByEvent.keys());
      const onlyCommitted = [...committedSet].filter((e) => !liveSet.has(e));
      const onlyLive = [...liveSet].filter((e) => !committedSet.has(e));
      if (onlyCommitted.length || onlyLive.length) {
        warnings.push(
          `committed container JSON (${args.committed}) drifts from live — ` +
          (onlyCommitted.length ? `only-in-committed: ${onlyCommitted.join(', ')}; ` : '') +
          (onlyLive.length ? `only-in-live: ${onlyLive.join(', ')}` : '') +
          ` — do not audit or import from the committed JSON without reconciling`,
        );
      }
    } catch { /* committed file unparseable — ignore, dist of other checks */ }
  }

  for (const w of warnings) console.error(`  WARN  ${w}`);
  for (const f of failures) console.error(`  FAIL  ${f}`);
  console.log(`\nverify-gtm-live: ${conversionEvents.length} conversion event(s) checked against ${triggersByEvent.size} live trigger(s); ${failures.length} failure(s), ${warnings.length} warning(s)`);
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`FATAL: ${err.stack || err}`);
  process.exit(2);
});
