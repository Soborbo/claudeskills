# Tracking Kit — Test Base

This directory holds the automated test base for the tracking kit. The
contract: it must NOT be possible to silently regress consent, PII, dedup,
GA4 attribution, Meta CAPI, or the upgrade-window state machine.

## Layout

```
tests/
  _stubs/                 # next/server + cloudflare:workers shims for vitest
  setup/
    vitest.setup.ts       # jsdom defaults, dataLayer, consent helpers
  unit/                   # vitest unit tests against src/lib/tracking
  api/                    # vitest API route tests (uses next/server stub)
  cloudflare/             # env-shape + rate-limit tests
  security/
    scan-forbidden-patterns.ts  # CI-gating grep for anti-patterns
    scan-secrets.ts             # CI-gating grep for secret-shaped values
  e2e/                    # Playwright specs + Vite-served harness
    fixtures/             # minimal HTML + harness.ts the kit mounts into
```

## Running

```bash
# from tracking-kit/
npm install

# Fast path — what CI runs on every PR
npm run test:ci          # security + unit + api + cloudflare

# Everything (requires Playwright browsers; one-time install below)
npm run test:e2e:install
npm run test:all

# Coverage
npm run test:coverage    # html + lcov report under coverage/
```

## What each layer enforces

| Layer              | Catches                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| `security/scan-*`  | `deriveClientId` regression, hardcoded Meta/GA4/GTM IDs, console.log in `src/` |
| `unit/tracking`    | PII never reaches dataLayer; user_data side-channel honors ad consent  |
| `unit/conversion-state` | Exactly one primary_conversion per browser per cycle; late-fire works |
| `unit/meta-mirror` | Fail-closed consent gate; sendBeacon + fetch fallback; fbp/fbc validation |
| `unit/server`      | Origin gate strict; event_id / value / currency validation; SHA-256 hashing; **no synthetic GA4 client_id** |
| `unit/global-listeners` | Phone/email/whatsapp upgrade flow; scroll depth fires once     |
| `unit/form-tracking` | Abandonment beacon only above dwell threshold; suppressed after submit |
| `api/meta-capi.route` | Rate limit, consent gate, custom_data whitelist, event_time clamping |
| `api/abandonment.route` | No GA4 MP send without real `_ga` cookie; sessionId attached       |
| `cloudflare/env-validation` | `.env.example` declares the right keys; routes are server-rendered |
| `e2e/consent-denied` | Click conversions fire to dataLayer but Meta CAPI is NOT hit         |
| `e2e/consent-granted` | Upgrade flow + Meta CAPI gets `consent_state: granted` + zero PII in dataLayer |
| `e2e/datalayer-pii-scanner` | Self-test: scanner catches injected email/phone; clean session is clean |

## Adding a test

1. Pick the layer (unit if it's a single module function; api if it's a
   route; e2e if you need a real browser).
2. Use a fresh `formId` / state ID per test — module-level state (form
   abandonment Map, conversion-state timer) persists across tests in the
   same file.
3. Reach for `grantConsent()` / `denyConsent()` / `partialConsent({...})`
   from `tests/setup/vitest.setup.ts` rather than poking
   `window.google_tag_data` directly.

## Production deploy check

`tests/cloudflare/env-validation.test.ts` has gated assertions that the
production deploy strips `example.com` and `META_CAPI_TEST_EVENT_CODE`.
Enable them on the production branch by exporting `CHECK_PROD_ORIGINS=1`
before running vitest:

```bash
CHECK_PROD_ORIGINS=1 npm run test:cloudflare
```
