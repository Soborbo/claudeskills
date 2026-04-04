# Cloudflare Setup

## Overview

| Service | Purpose |
|---------|---------|
| Workers | Runtime for the form handler |
| Turnstile | Invisible CAPTCHA |
| KV | Rate limiting + dedup storage |

## Runtime: Workers

The form handler runs as a Cloudflare Worker with the standard `export default { fetch }` pattern.

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // env contains all secrets and KV bindings
    // ctx.waitUntil() for non-blocking background work (e.g. Sheets save)
  },
};
```

**Environment access:** Always via the `env` parameter. Never `import.meta.env` (that's build-time only and does not exist in Workers runtime).

---

## Turnstile (CAPTCHA)

### 1. Create Widget

1. Cloudflare Dashboard → Turnstile → Add Site
2. Choose **Invisible** mode
3. Copy Site Key (frontend) + Secret Key (backend)

### 2. Frontend

```html
<div class="cf-turnstile" data-sitekey="0x4AAAAAAA..."></div>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

### 3. Backend Verification

Uses `application/x-www-form-urlencoded` (Cloudflare's documented standard).

See `assets/boilerplate/lib/turnstile.ts` for implementation.

---

## KV (Rate Limiting + Dedup)

**Note:** KV is eventually consistent. Acceptable for form spam control.

### 1. Create Namespace

```bash
npx wrangler kv:namespace create "RATE_LIMIT"
# Output: id = "xxxxxxxx"
```

### 2. Configure wrangler.toml

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your-namespace-id"
```

### 3. Usage

See `assets/boilerplate/lib/rate-limit.ts` and `assets/boilerplate/lib/dedupe.ts`.

---

## Google Sheets API

Direct API calls with a service account. No webhook, no Apps Script.

### 1. Create Service Account

1. Google Cloud Console → IAM & Admin → Service Accounts
2. Create service account (e.g. `forms@your-project.iam.gserviceaccount.com`)
3. Create a JSON key → download the key file

### 2. Share the Spreadsheet

Open the target Google Sheet → Share → add the service account email as Editor.

### 3. Prepare the Sheet

Row 1 must contain column headers matching the field names in `submit.ts`:

```
leadId | name | email | phone | message | sourcePage | submittedAt | utmSource | utmMedium | utmCampaign
```

### 4. Set Secrets

Extract from the JSON key file:

```bash
wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
# paste: forms@your-project.iam.gserviceaccount.com

wrangler secret put GOOGLE_PRIVATE_KEY
# paste the full private key including -----BEGIN/END-----

wrangler secret put GOOGLE_SHEET_ID
# paste the spreadsheet ID from the URL
```

The implementation (`sheets.ts`) handles JWT signing, token exchange, and row append via the Sheets API v4 — all using Workers-native Web Crypto API.

---

## Deploy

```bash
# Local development
npx wrangler dev

# Deploy to production
npx wrangler deploy
```

### Setting Secrets

```bash
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put BREVO_API_KEY
wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
wrangler secret put GOOGLE_PRIVATE_KEY
wrangler secret put GOOGLE_SHEET_ID
wrangler secret put IP_HASH_SALT
```

### Local Development

Create a `.dev.vars` file (gitignored):

```
TURNSTILE_SECRET_KEY=0x...
RESEND_API_KEY=re_...
BREVO_API_KEY=xkeysib-...
GOOGLE_SERVICE_ACCOUNT_EMAIL=forms@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1aBcDeFg...
IP_HASH_SALT=dev-salt
```

---

## Environment Variables Summary

| Variable | Scope | Purpose |
|----------|-------|---------|
| `TURNSTILE_SITE_KEY` | Frontend | Widget display |
| `TURNSTILE_SECRET_KEY` | Worker (`env`) | Token verification |
| `RATE_LIMIT_KV` | KV binding | Rate limit + dedup |
| `RESEND_API_KEY` | Worker (`env`) | Primary email |
| `BREVO_API_KEY` | Worker (`env`) | Fallback email |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Worker (`env`) | Sheets API auth |
| `GOOGLE_PRIVATE_KEY` | Worker (`env`) | Sheets API JWT signing |
| `GOOGLE_SHEET_ID` | Worker (`env`) | Target spreadsheet |
| `IP_HASH_SALT` | Worker (`env`) | IP anonymisation |

---

## Checklist

- [ ] Worker project created (`wrangler init` or existing)
- [ ] Turnstile widget created (invisible mode)
- [ ] KV namespace created and bound in `wrangler.toml`
- [ ] Google Cloud service account created
- [ ] Google Sheet shared with service account email
- [ ] Sheet row 1 has correct column headers
- [ ] All secrets set via `wrangler secret put`
- [ ] `.dev.vars` configured for local dev
- [ ] `wrangler dev` works locally
- [ ] `wrangler deploy` succeeds
