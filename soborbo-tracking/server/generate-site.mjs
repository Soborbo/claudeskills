#!/usr/bin/env node
/**
 * generate-site.mjs — deterministic per-site wiring generator.
 *
 * The repo is the "source of truth": this script takes a site-config input and
 * produces the KV entry/entries, the wrangler route block, the `wrangler kv key put`
 * commands and an integration checklist. The onboard-site skill calls this after
 * it has collected the IDs from the MCP connectors.
 *
 * Usage:
 *   node scripts/generate-site.mjs --input site.json [--out dir/] [--kv-namespace-id ID]
 *   cat site.json | node scripts/generate-site.mjs
 *
 * No external dependencies (Node built-ins only). Deterministic: the same input
 * yields the same output.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { argv, exit } from 'node:process';
import { fileURLToPath } from 'node:url';

// The SITE_CONFIG KV namespace fixed in wrangler.toml (default).
const DEFAULT_SITE_CONFIG_NS = 'edd34e28eee847c09c26f9d9e3ea04ab';

// Canonical event source — vendored copy of Serverside/src/events.json (the single
// source of truth, §1). NO hand list: the generator accepts exactly what the worker does.
const EVENTS = JSON.parse(
  readFileSync(fileURLToPath(new URL('../events.json', import.meta.url)), 'utf8')
);
// Client-postable (ingress) event names: server-channel, NON-offline.
const INGRESS_EVENT_NAMES = EVENTS.filter(
  (e) => e.channels.includes('server') && e.kind !== 'offline'
).map((e) => e.name);
// gads.conversion_actions keys may be ANY canonical event (Model 2: typically the
// OFFLINE CRM events — lead_qualified, booking_confirmed, … — because the server sends
// Google Ads ONLY offline via the Data Manager API), plus legacy GA4 aliases (migration).
const VALID_ACTION_EVENTS = new Set([
  ...EVENTS.map((e) => e.name),
  ...EVENTS.map((e) => e.legacy_ga4).filter(Boolean)
]);

// Formal KV-config schema. Drift guard: the schema's conversion_actions enum MUST
// match the events.json-derived set (otherwise regenerate the schema).
const SCHEMA = JSON.parse(
  readFileSync(fileURLToPath(new URL('./site-config.schema.json', import.meta.url)), 'utf8')
);
{
  const schemaEnum = SCHEMA?.properties?.gads?.properties?.conversion_actions?.propertyNames?.enum;
  if (Array.isArray(schemaEnum)) {
    const missing = [...VALID_ACTION_EVENTS].filter((n) => !schemaEnum.includes(n));
    const extra = schemaEnum.filter((n) => !VALID_ACTION_EVENTS.has(n));
    if (missing.length || extra.length) {
      console.error(
        '❌ site-config.schema.json conversion_actions enum drifted from events.json' +
          (missing.length ? `\n  missing from schema: ${missing.join(', ')}` : '') +
          (extra.length ? `\n  extra in schema: ${extra.join(', ')}` : '')
      );
      exit(1);
    }
  }
}

const ALLOWED_COUNTRIES = new Set(['GB', 'HU', 'EU', 'US', 'DE', 'FR', 'IT', 'ES']);
const EEA_COUNTRIES = new Set(['HU', 'EU', 'DE', 'FR', 'IT', 'ES']);

function parseArgs(args) {
  const out = { input: null, out: null, kvNamespaceId: DEFAULT_SITE_CONFIG_NS };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input') out.input = args[++i];
    else if (args[i] === '--out') out.out = args[++i];
    else if (args[i] === '--kv-namespace-id') out.kvNamespaceId = args[++i];
  }
  return out;
}

function readInput(path) {
  if (path) return readFileSync(path, 'utf8');
  // stdin
  return readFileSync(0, 'utf8');
}

const ERRORS = [];
const WARNINGS = [];
function err(m) {
  ERRORS.push(m);
}
function warn(m) {
  WARNINGS.push(m);
}

function validate(cfg) {
  if (!cfg || typeof cfg !== 'object') return err('Input is not an object.');

  if (!cfg.site_id || typeof cfg.site_id !== 'string') err('site_id is required (string).');
  if (!Array.isArray(cfg.hostnames) || cfg.hostnames.length === 0)
    err('hostnames is required (non-empty array, e.g. ["trapezlemezes.hu","www.trapezlemezes.hu"]).');
  else
    for (const h of cfg.hostnames) {
      if (typeof h !== 'string' || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(h))
        err(`Invalid hostname: ${JSON.stringify(h)}`);
    }

  if (!ALLOWED_COUNTRIES.has(cfg.country_code))
    err(`country_code is invalid (${cfg.country_code}); allowed: ${[...ALLOWED_COUNTRIES].join(', ')}.`);
  if (!cfg.currency || typeof cfg.currency !== 'string') err('currency is required (e.g. "HUF", "GBP").');

  // Meta
  if (!cfg.meta || typeof cfg.meta !== 'object') err('meta block is required.');
  else {
    if (!/^\d{5,}$/.test(String(cfg.meta.pixel_id || '')))
      err(`meta.pixel_id is invalid (a numeric pixel ID is required), got: ${cfg.meta.pixel_id}`);
    if (!cfg.meta.access_token) err('meta.access_token is required (CAPI token).');
    if (cfg.meta.test_event_code)
      warn(
        `meta.test_event_code = "${cfg.meta.test_event_code}" — MUST be removed in PRODUCTION (otherwise every conversion goes to the Test stream).`
      );
  }

  // GA4
  if (!cfg.ga4 || typeof cfg.ga4 !== 'object') err('ga4 block is required.');
  else {
    if (!/^G-[A-Z0-9]+$/.test(String(cfg.ga4.measurement_id || '')))
      err(`ga4.measurement_id is invalid (G-XXXX format required), got: ${cfg.ga4.measurement_id}`);
    if (!cfg.ga4.api_secret) err('ga4.api_secret is required (MP api_secret from the GA4 admin UI).');
  }

  // Google Ads (optional — customer_id may be null)
  if (!cfg.gads || typeof cfg.gads !== 'object') err('gads block is required (customer_id may be null).');
  else {
    const cid = cfg.gads.customer_id;
    if (cid !== null && cid !== undefined) {
      if (!/^\d{10}$/.test(String(cid)))
        err(`gads.customer_id must be 10 digits WITHOUT HYPHENS (UI: 123-456-7890 → 1234567890), got: ${cid}`);
    }
    const lcid = cfg.gads.login_customer_id;
    if (lcid !== null && lcid !== undefined && !/^\d{10}$/.test(String(lcid)))
      err(`gads.login_customer_id must be 10 digits without hyphens or null, got: ${lcid}`);
    if (cfg.gads.conversion_actions) {
      for (const [ev, id] of Object.entries(cfg.gads.conversion_actions)) {
        if (!VALID_ACTION_EVENTS.has(ev))
          err(`gads.conversion_actions has an unknown event name: ${ev} (allowed: ${[...VALID_ACTION_EVENTS].join(', ')}).`);
        if (!/^\d+$/.test(String(id)))
          err(`gads.conversion_actions["${ev}"] requires a numeric conversionAction ID, got: ${id}`);
      }
    }
    if (cid && !cfg.gads.conversion_actions)
      warn('gads.customer_id is set, but there is no conversion_actions — Google Ads conversions will be skipped.');
  }

  // Consent default recommendation for EEA
  if (EEA_COUNTRIES.has(cfg.country_code) && cfg.require_consent !== true)
    warn(
      `country_code=${cfg.country_code} (EEA) — require_consent: true is recommended (GDPR fail-closed). Currently: ${cfg.require_consent}.`
    );
}

/** The worker's SiteConfig shape (src/lib/config.ts) — this is exactly what we put into KV. */
function toSiteConfig(cfg) {
  const sc = {
    site_id: cfg.site_id,
    country_code: cfg.country_code,
    currency: cfg.currency,
    meta: {
      pixel_id: String(cfg.meta.pixel_id),
      access_token: cfg.meta.access_token
    },
    // Model 2: ga4 is OFFLINE-ONLY — the worker uses it only for the offline GA4 MP
    // augment in lead-status.ts. On-site GA4 comes from the browser (Google tag).
    ga4: {
      measurement_id: cfg.ga4.measurement_id,
      api_secret: cfg.ga4.api_secret
    },
    gads: {
      customer_id: cfg.gads.customer_id ?? null,
      login_customer_id: cfg.gads.login_customer_id ?? null
    }
  };
  if (cfg.meta.test_event_code) sc.meta.test_event_code = cfg.meta.test_event_code;
  if (cfg.gads.conversion_actions) sc.gads.conversion_actions = cfg.gads.conversion_actions;
  if (cfg.require_consent === true) sc.require_consent = true;
  return sc;
}

function routeBlock(hostnames) {
  // The zone is the main (apex) domain — the www is served by the same zone.
  const apex = hostnames
    .map((h) => h.replace(/^www\./, ''))
    .reduce((a, b) => (a.length <= b.length ? a : b));
  return hostnames
    .map((h) => `[[routes]]\npattern = "${h}/api/event/*"\nzone_name = "${apex}"`)
    .join('\n\n');
}

function kvPutCommands(hostnames, json, nsId) {
  const compact = JSON.stringify(JSON.parse(json));
  return hostnames
    .map(
      (h) =>
        `wrangler kv key put --namespace-id ${nsId} "${h}" '${compact.replace(/'/g, "'\\''")}'`
    )
    .join('\n');
}

function integrationChecklist(cfg) {
  const host = cfg.hostnames[0];
  return `# Integration checklist — ${cfg.site_id} (${host})

## Worker side
- [ ] KV entry/entries uploaded (see kv-put.sh / the commands above)
- [ ] wrangler.toml: route block added (see routes.toml) → \`wrangler deploy\`
- [ ] (if Google Ads) OAuth done for the customer_id: GET /api/event/oauth-init (X-Admin-Token)
${cfg.meta.test_event_code ? '- [ ] ⚠️ test_event_code REMOVED from KV before going live' : ''}

## Astro site side
- [ ] components/ + lib/ copied into src/ as siblings (src/components/ + src/lib/);
      components import the lib via ../lib (no path alias needed)
- [ ] <Tracking/> + <TrackingNoscript/> + <Turnstile/> placed in the layout
- [ ] PUBLIC_TURNSTILE_SITE_KEY set (.env) + Turnstile invisible widget on the page
      (\`<div id="cf-turnstile-invisible">\`, provided by <Turnstile/>)
- [ ] CookieYes (from GTM) active → consent comes automatically from the cookieyes-consent cookie
- [ ] At conversion points use the documented API: \`trackLeadSubmit({ email, phone, value, currency })\`,
      \`trackContactSubmit(...)\`, or \`trackServerEvent('<event_name>', { value, currency, email, phone })\`
      (clicks auto-bind via <Tracking/>). Allowed gateway event names: ${INGRESS_EVENT_NAMES.join(', ')}

## Verification (after deploy)
- [ ] curl https://${host}/api/event/health → {"status":"ok"}
- [ ] Meta Events Manager → Test Events: the browser + server event with the SAME event_id (dedup)
- [ ] GA4 DebugView: the conversion + (if UTM) campaign_details is visible
- [ ] Google Ads → Conversions: the upload shows up (gclid match or Enhanced Conversions)
- [ ] Cloudflare Workers Logs: no TRK-* error for 24h
`;
}

function main() {
  const args = parseArgs(argv.slice(2));
  let cfg;
  try {
    cfg = JSON.parse(readInput(args.input));
  } catch (e) {
    console.error('Invalid JSON input:', e.message);
    exit(1);
  }

  validate(cfg);
  if (ERRORS.length) {
    console.error('❌ Validation errors:\n' + ERRORS.map((e) => '  - ' + e).join('\n'));
    exit(1);
  }

  const siteConfig = toSiteConfig(cfg);
  const json = JSON.stringify(siteConfig, null, 2);
  const routes = routeBlock(cfg.hostnames);
  const kv = kvPutCommands(cfg.hostnames, json, args.kvNamespaceId);
  const checklist = integrationChecklist(cfg);

  if (WARNINGS.length) console.error('⚠️  Warnings:\n' + WARNINGS.map((w) => '  - ' + w).join('\n') + '\n');

  if (args.out) {
    mkdirSync(args.out, { recursive: true });
    writeFileSync(`${args.out}/site-config.json`, json + '\n');
    writeFileSync(`${args.out}/routes.toml`, routes + '\n');
    writeFileSync(`${args.out}/kv-put.sh`, '#!/usr/bin/env bash\nset -euo pipefail\n' + kv + '\n');
    writeFileSync(`${args.out}/INTEGRATION.md`, checklist);
    console.error(`✅ Written: ${args.out}/ (site-config.json, routes.toml, kv-put.sh, INTEGRATION.md)`);
  } else {
    console.log('=== KV site-config (' + cfg.hostnames.join(', ') + ') ===\n' + json);
    console.log('\n=== wrangler.toml route block ===\n' + routes);
    console.log('\n=== KV put commands ===\n' + kv);
    console.log('\n=== Integration checklist ===\n' + checklist);
  }
}

main();
