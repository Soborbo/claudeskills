#!/usr/bin/env node
/**
 * generate-site.mjs — deterministic per-site wiring generator.
 *
 * PORT of the engine's `Serverside/scripts/generate-site.mjs` (Run 6) reading the
 * skill's vendored events.json. If the two generators ever disagree, the ENGINE
 * wins — re-port it; do not fork the logic here.
 *
 * Takes a site-config input and produces the KV entry/entries, the wrangler route
 * block, the `wrangler kv key put` commands, the per-site CRM/backend token, and
 * an integration checklist.
 *
 * Usage:
 *   node server/generate-site.mjs --input site.json [--out dir/] [--kv-namespace-id ID]
 *   cat site.json | node server/generate-site.mjs
 *
 * No external dependencies (Node built-ins only). Deterministic except the
 * generated token: the same input yields the same output.
 *
 * HARD GATES (exit 1, not warnings):
 *  - `meta.test_event_code` present → ERROR. The KV config is edge-cached (300s);
 *    a test code in KV has TWICE routed real production conversions into Meta's
 *    Test stream. Per-request test codes (TRACKING_TEST_LEAD_EMAIL keying) are the
 *    only sanctioned mechanism. Explicit sprint-testing opt-in:
 *    `--allow-test-event-code`.
 *  - `gads.conversion_actions` keys must be CANONICAL event names. Legacy GA4
 *    aliases are rejected: the ingress canonicalizes names BEFORE the lookup, so a
 *    legacy-keyed map never matches at runtime — dead config that used to pass
 *    silently.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { argv, exit } from 'node:process';
import { fileURLToPath } from 'node:url';

// The SITE_CONFIG KV namespace fixed in the gateway's wrangler.toml (default).
const DEFAULT_SITE_CONFIG_NS = 'edd34e28eee847c09c26f9d9e3ea04ab';

// Canonical event source — vendored copy of Serverside/src/events.json (the
// single source of truth). NO hand list: the generator accepts exactly what the
// worker does. `check-event-contract.mjs --engine <path>` guards the vendored
// copy against engine drift.
const EVENTS = JSON.parse(
  readFileSync(fileURLToPath(new URL('../events.json', import.meta.url)), 'utf8')
);
// Client-postable (ingress) event names: server-channel, NON-offline.
const INGRESS_EVENTS = EVENTS.filter((e) => e.channels.includes('server') && e.kind !== 'offline');
// Run 6 gate: high-value (server_ingress_only) events get 403 on the browser
// path — ONLY the site backend may send them, with the per-site token, on
// /api/event/conversion-server. The checklist lists them separately so a new
// site's form conversions never get wired to the browser path (that would be
// TRK-400-017 + silent conversion loss).
const BROWSER_EVENT_NAMES = INGRESS_EVENTS.filter((e) => e.server_ingress_only !== true).map((e) => e.name);
const SERVER_ONLY_EVENT_NAMES = INGRESS_EVENTS.filter((e) => e.server_ingress_only === true).map((e) => e.name);
// gads.conversion_actions keys: canonical names ONLY (see HARD GATES above).
const VALID_ACTION_EVENTS = new Set(EVENTS.map((e) => e.name));

// Drift guard: the committed JSON schema's conversion_actions enum must match the
// events.json-derived set (otherwise regenerate the schema).
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
  const out = { input: null, out: null, kvNamespaceId: DEFAULT_SITE_CONFIG_NS, allowTestEventCode: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input') out.input = args[++i];
    else if (args[i] === '--out') out.out = args[++i];
    else if (args[i] === '--kv-namespace-id') out.kvNamespaceId = args[++i];
    else if (args[i] === '--allow-test-event-code') out.allowTestEventCode = true;
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

function validate(cfg, opts = {}) {
  if (!cfg || typeof cfg !== 'object') return err('Input is not an object.');

  if (!cfg.site_id || typeof cfg.site_id !== 'string') err('site_id is required (string).');
  if (!Array.isArray(cfg.hostnames) || cfg.hostnames.length === 0)
    err('hostnames is required (non-empty array, e.g. ["example.com","www.example.com"]).');
  else
    for (const h of cfg.hostnames) {
      if (typeof h !== 'string' || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(h))
        err(`Invalid hostname: ${JSON.stringify(h)}`);
    }

  if (!ALLOWED_COUNTRIES.has(cfg.country_code))
    err(`country_code is invalid (${cfg.country_code}); allowed: ${[...ALLOWED_COUNTRIES].join(', ')}.`);
  if (!cfg.currency || typeof cfg.currency !== 'string') err('currency is required (e.g. "HUF", "GBP").');
  else if (!/^[A-Z]{3}$/.test(cfg.currency))
    err(`currency is invalid (3-letter ISO 4217 required, e.g. "HUF", "GBP", "EUR"), got: ${cfg.currency}`);

  // Meta
  if (!cfg.meta || typeof cfg.meta !== 'object') err('meta block is required.');
  else {
    if (!/^\d{5,}$/.test(String(cfg.meta.pixel_id || '')))
      err(`meta.pixel_id is invalid (a numeric pixel ID is required), got: ${cfg.meta.pixel_id}`);
    if (!cfg.meta.access_token) err('meta.access_token is required (CAPI token).');
    // HARD GATE: test_event_code in KV routes every production conversion into
    // Meta's Test stream for as long as the edge cache serves it (two real
    // incidents). Error by default; explicit sprint-testing opt-in only.
    if (cfg.meta.test_event_code) {
      if (opts.allowTestEventCode)
        warn(
          `meta.test_event_code = "${cfg.meta.test_event_code}" — allowed (--allow-test-event-code). MUST be removed before production!`
        );
      else
        err(
          `meta.test_event_code = "${cfg.meta.test_event_code}" is present — in production every conversion would go to the Meta Test stream. Remove it from the input; the sanctioned test mechanism is the PER-REQUEST code keyed on TRACKING_TEST_LEAD_EMAIL (see server/backend/). For deliberate pre-launch testing pass --allow-test-event-code.`
        );
    }
  }

  // GA4 — OPTIONAL and LEGACY. The gateway sends NO GA4 at all (on-site GA4 is
  // browser-owned; the offline GA4 leg is disabled — without a real client_id
  // every event would start a synthetic GA4 client). The block is only read by
  // the /debug-ga4 diagnostic and old-DLQ retries. Omit it for new sites.
  if (cfg.ga4 === undefined || cfg.ga4 === null) {
    // fine — nothing to validate
  } else if (typeof cfg.ga4 !== 'object') {
    err('ga4 block must be an object (or omit it entirely).');
  } else {
    warn('ga4 block present — note the gateway sends NO GA4 (browser owns on-site GA4; offline leg disabled). The block is diagnostics-only.');
    if (!/^G-[A-Z0-9]+$/.test(String(cfg.ga4.measurement_id || '')))
      err(`ga4.measurement_id is invalid (G-XXXX format required), got: ${cfg.ga4.measurement_id}`);
    if (!cfg.ga4.api_secret) err('ga4.api_secret is required when the ga4 block is present.');
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
          err(`gads.conversion_actions has an unknown/legacy event name: ${ev} (canonical names only: ${[...VALID_ACTION_EVENTS].join(', ')}).`);
        if (!/^\d+$/.test(String(id)))
          err(`gads.conversion_actions["${ev}"] requires a numeric conversionAction ID, got: ${id}`);
      }
    }
    if (cid && !cfg.gads.conversion_actions)
      warn('gads.customer_id is set, but there is no conversion_actions — Google Ads conversions will be skipped.');
  }

  // Per-site CRM/backend token (optional input). If provided we hash it
  // deterministically; if not, the generator creates one (see resolveCrmToken).
  if (cfg.crm_token !== undefined && cfg.crm_token !== null) {
    if (typeof cfg.crm_token !== 'string' || cfg.crm_token.length < 16)
      err('crm_token is invalid (string, ≥16 chars) — or omit it to have one generated.');
  }

  // Consent default recommendation for EEA
  if (EEA_COUNTRIES.has(cfg.country_code) && cfg.require_consent !== true)
    warn(
      `country_code=${cfg.country_code} (EEA) — require_consent: true is recommended (GDPR fail-closed). Currently: ${cfg.require_consent}.`
    );
}

/** The worker's SiteConfig shape (Serverside src/lib/config.ts) — exactly what goes into KV. */
function toSiteConfig(cfg) {
  const sc = {
    site_id: cfg.site_id,
    country_code: cfg.country_code,
    currency: cfg.currency,
    meta: {
      pixel_id: String(cfg.meta.pixel_id),
      access_token: cfg.meta.access_token
    },
    gads: {
      customer_id: cfg.gads.customer_id ?? null,
      login_customer_id: cfg.gads.login_customer_id ?? null
    }
  };
  // ga4 optional + legacy: diagnostics-only (the gateway sends no GA4).
  if (cfg.ga4) {
    sc.ga4 = {
      measurement_id: cfg.ga4.measurement_id,
      api_secret: cfg.ga4.api_secret
    };
  }
  if (cfg.meta.test_event_code) sc.meta.test_event_code = cfg.meta.test_event_code;
  if (cfg.gads.conversion_actions) sc.gads.conversion_actions = cfg.gads.conversion_actions;
  if (cfg.require_consent === true) sc.require_consent = true;
  return sc;
}

/**
 * Per-site server-ingress token (backend conversions + CRM offline loop). ONLY
 * the SHA-256 hash goes into KV (crm_token_sha256); the plaintext goes into
 * crm-secret.env for the site worker + CRM deploy. If the input provides
 * `crm_token` → deterministic (we hash that). If not → random 32 bytes
 * (base64url), and we warn you to save it NOW.
 */
function resolveCrmToken(cfg) {
  let token = cfg.crm_token;
  let generated = false;
  if (!token) {
    token = randomBytes(32).toString('base64url');
    generated = true;
  }
  const hash = createHash('sha256').update(token).digest('hex');
  return { token, hash, generated };
}

function crmSecretEnv(cfg, token) {
  const url = `https://${cfg.hostnames[0]}/api/event/lead-status`;
  return (
    `# ${cfg.site_id} — server-ingress + CRM offline-loop secrets. Set these as\n` +
    `# deploy secrets (wrangler secret put / dashboard). The token plaintext exists\n` +
    `# ONLY here — the gateway KV stores just its SHA-256. Do not commit.\n` +
    `#\n` +
    `# SITE worker (backend conversions, smoke cron):\n` +
    `TRACKING_GATEWAY_TOKEN=${token}\n` +
    `#\n` +
    `# CRM deploy (offline lead-status loop):\n` +
    `TRACKING_WORKER_URL=${url}\n` +
    `TRACKING_ADMIN_TOKEN=${token}\n` +
    `# The CRM uses these to convert minor→major value and fill user_data.country\n` +
    `# (the Worker falls back to the site currency when omitted).\n` +
    `TRACKING_CURRENCY=${cfg.currency}\n` +
    `TRACKING_COUNTRY_CODE=${cfg.country_code}\n`
  );
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

## Gateway (worker) side
- [ ] KV entry/entries uploaded (see kv-put.sh / the commands above)
- [ ] Serverside wrangler.toml: route block added (see routes.toml) → branch + PR → deploy.
      Verify the DEFAULT branch first (\`git remote show origin | grep "HEAD branch"\`) and
      which branch Workers Builds deploys — they are not always \`main\`.
- [ ] (if Google Ads) OAuth done for the customer_id: GET /api/event/oauth-init (X-Admin-Token)
- [ ] site_id added to the gateway's SMOKE_SITES var (daily smoke-lead guard)
${cfg.meta.test_event_code ? '- [ ] ⚠️ test_event_code REMOVED before go-live (--allow-test-event-code was used)\n' : ''}
## Server ingress (backend conversions + CRM offline loop)
- [ ] Site worker secrets set from crm-secret.env: \`TRACKING_GATEWAY_TOKEN\` (+ SITE_URL var)
- [ ] Site wrangler config: \`[[services]] binding = "GATEWAY" service = "event-gateway"\`
      (a plain fetch to your own /api/event/* is short-circuited by Cloudflare — it never arrives)
- [ ] CRM deploy secrets set: \`TRACKING_WORKER_URL\` + \`TRACKING_ADMIN_TOKEN\`
- [ ] The KV site-config contains \`crm_token_sha256\` (kv-put.sh uploads it) → the global
      ADMIN_API_TOKEN NO LONGER writes to this site (tenant isolation)
- [ ] Test: POST /api/event/conversion-server with the token → 204; with a WRONG token → 401

## Astro site side
- [ ] components/ + lib/ copied into src/ as siblings (src/components/ + src/lib/)
- [ ] server/backend/{gateway-dispatch,smoke}.ts copied into src/lib/tracking/, worker.ts into src/,
      \`main\` + \`[triggers] crons\` set (see server/backend/README.md; keep_vars ABOVE every [table]!)
- [ ] <Tracking/> + <TrackingNoscript/> placed in the layout
- [ ] CookieYes (from GTM) active → consent comes automatically from the cookieyes-consent cookie
- [ ] BROWSER conversion points (click events) use the lib: trackPhoneConversion() /
      trackEmailConversion() / trackWhatsappConversion() / trackServerEvent().
      Browser-path event names: ${BROWSER_EVENT_NAMES.join(', ')}
- [ ] SERVER-ONLY conversions (form/lead/purchase) go from the SITE BACKEND:
      sendGatewayConversion() on /api/event/conversion-server, REUSING the browser
      event_id (hidden field) and passing the CRM's id as lead_id. On the browser
      path these get 403 (TRK-400-017): ${SERVER_ONLY_EVENT_NAMES.join(', ')}
- [ ] AUDIT EVERY CALL SITE IN THE REPO (not the deployed bundle — client scripts
      aren't in the worker bundle): no server-only event is dispatched from browser code

## Verification (after deploy)
- [ ] curl https://${host}/api/event/health → {"status":"ok"}
- [ ] Synthetic proof via the AUTHENTICATED ingress only (smoke cron / curl with the
      per-site token + test_event_code in the BODY). NO live-pixel browser testing.
- [ ] D1 ledger: the smoke event books \`meta\` with status \`accepted\` + an HTTP status
      (or \`skipped\` when the site has no Meta block) — NEVER \`accepted\` without http_status
- [ ] Meta Events Manager → Test Events: browser + server event with the SAME event_id (dedup)
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

  validate(cfg, { allowTestEventCode: args.allowTestEventCode });
  if (ERRORS.length) {
    console.error('❌ Validation errors:\n' + ERRORS.map((e) => '  - ' + e).join('\n'));
    exit(1);
  }

  const siteConfig = toSiteConfig(cfg);
  // Per-site token: the hash goes into KV (SiteConfig), the plaintext to the deploys.
  const crm = resolveCrmToken(cfg);
  siteConfig.crm_token_sha256 = crm.hash;

  const json = JSON.stringify(siteConfig, null, 2);
  const routes = routeBlock(cfg.hostnames);
  const kv = kvPutCommands(cfg.hostnames, json, args.kvNamespaceId);
  const checklist = integrationChecklist(cfg);
  const secretEnv = crmSecretEnv(cfg, crm.token);

  if (WARNINGS.length) console.error('⚠️  Warnings:\n' + WARNINGS.map((w) => '  - ' + w).join('\n') + '\n');
  if (crm.generated)
    console.error(
      `🔑 Per-site token GENERATED — save it NOW (KV stores only the hash; it cannot be recovered):\n   ${crm.token}\n`
    );

  if (args.out) {
    mkdirSync(args.out, { recursive: true });
    writeFileSync(`${args.out}/site-config.json`, json + '\n');
    writeFileSync(`${args.out}/routes.toml`, routes + '\n');
    writeFileSync(`${args.out}/kv-put.sh`, '#!/usr/bin/env bash\nset -euo pipefail\n' + kv + '\n');
    writeFileSync(`${args.out}/crm-secret.env`, secretEnv);
    writeFileSync(`${args.out}/INTEGRATION.md`, checklist);
    console.error(
      `✅ Written: ${args.out}/ (site-config.json, routes.toml, kv-put.sh, crm-secret.env, INTEGRATION.md)`
    );
  } else {
    console.log('=== KV site-config (' + cfg.hostnames.join(', ') + ') ===\n' + json);
    console.log('\n=== wrangler.toml route block ===\n' + routes);
    console.log('\n=== KV put commands ===\n' + kv);
    console.log('\n=== Deploy secrets (crm-secret.env) ===\n' + secretEnv);
    console.log('\n=== Integration checklist ===\n' + checklist);
  }
}

main();
