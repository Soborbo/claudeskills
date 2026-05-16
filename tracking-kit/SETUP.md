# Setup guide

Step-by-step bring-up for a new project. Follow top to bottom.

## Prerequisites

You need accounts and IDs for:

- **Google Tag Manager** — a container, e.g. `GTM-XXXXXXX`
- **GA4** — a property + data stream + Measurement Protocol API secret
- **Meta Events Manager** — a Pixel ID + Conversions API access token
- **Google Ads** (optional) — conversion actions for the events you
  want to optimize Smart Bidding on
- **A CMP** (CookieYes / Cookiebot / OneTrust / Klaro). Free plans
  work for setup; paid plans recover modeled conversions under
  consent denial.

## 1. Drop the kit into your repo

Copy these into your project tree:

| Source | Destination |
| --- | --- |
| `src/lib/tracking/` | `src/lib/tracking/` (or wherever your alias resolves `@/lib/tracking`) |
| `src/components/GTMHead.astro` + `GTMBody.astro` | your shared Astro layout (Astro projects) |
| `src/components/GTMNext.tsx` | your `app/layout.tsx` (Next.js App Router) |
| `src/components/gtm-head.html` + `gtm-body.html` | your `<head>` / `<body>` (vanilla HTML) |
| `src/api/astro/meta-capi.ts` | `src/pages/api/meta/capi.ts` (Astro) |
| `src/api/astro/abandonment.ts` | `src/pages/api/track/abandonment.ts` (Astro) |
| `src/api/nextjs/meta-capi.route.ts` | `app/api/meta/capi/route.ts` (Next.js) |
| `src/api/nextjs/abandonment.route.ts` | `app/api/track/abandonment/route.ts` (Next.js) |

Adjust import paths if your TypeScript alias for the tracking lib is
not `@/lib/tracking`.

Install the runtime dependency:

```bash
npm install @noble/hashes
```

(Or swap `server.ts` to use WebCrypto's `crypto.subtle.digest` — see
the comment at the top of that file. Then no dep needed.)

## 2. Edit `config.ts` for your project

Open [src/lib/tracking/config.ts](src/lib/tracking/config.ts) and update:

- `STORAGE_PREFIX` → a short identifier unique to your project (3-4
  chars). All localStorage keys, BroadcastChannel name, and the hidden
  DOM element id derive from this. Avoid collisions if the same domain
  hosts multiple properties.
- `DEFAULT_CURRENCY` → `'EUR'` / `'USD'` / `'GBP'` etc.
- `DEFAULT_COUNTRY` → primary user country for E.164 phone normalization.
- `COUNTRY_DIAL_CODES` → add any countries you operate in.
- `UPGRADE_WINDOW_MS` → time after primary completion during which a
  higher-intent action is treated as an upgrade. Default 60 minutes.
- `META_EVENT_NAMES` → which internal event names mirror to Meta CAPI,
  and what Meta event-name they map to.

- `ENABLE_UPGRADE_WINDOW` → leave at `false` (the default). The
  upgrade-window pattern is gated behind this flag because, in a
  production deployment, it lost ~87% of quote conversions. Flip to
  `true` only if you've measured your funnel's in-window upgrade rate
  is high enough (≥80%) to justify the lost late-fires. See
  INVARIANTS.md → "Conversions fire immediately; dedup at the
  platform". When `true`, the first invocation per session emits a
  loud `console.warn`.

## 3. Wire the GTM components

### Astro

In your shared layout (`src/layouts/BaseLayout.astro` or similar):

```astro
---
import GTMHead from '@/components/GTMHead.astro';
import GTMBody from '@/components/GTMBody.astro';
---
<html>
  <head>
    <GTMHead />
    <!-- everything else -->
  </head>
  <body>
    <GTMBody />
    <slot />
  </body>
</html>
```

### Next.js (App Router)

In `app/layout.tsx`:

```tsx
import { GTMHead, GTMBody } from '@/components/GTMNext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head><GTMHead /></head>
      <body>
        <GTMBody />
        {children}
      </body>
    </html>
  );
}
```

### Vanilla HTML

Paste `gtm-head.html` as the FIRST thing inside `<head>`. Paste
`gtm-body.html` immediately after `<body>`. Replace `GTM-XXXXXXX` with
your container ID.

## 4. Set environment variables

| Var | Required for | Purpose |
| --- | --- | --- |
| `GTM_ID` (or `PUBLIC_GTM_ID` / `NEXT_PUBLIC_GTM_ID`) | client | Used by `GTMHead` to render the GTM bootstrap |
| `GA4_MEASUREMENT_ID` | server-side mirror | Used by `sendGA4MP()`; also used by `readGa4IdsFromCookie()` to derive the `_ga_<container>` session-cookie name |
| `GA4_API_SECRET` | server-side mirror | GA4 → Admin → Data Streams → Web → Measurement Protocol API secrets |
| `META_PIXEL_ID` | server-side mirror | Used by `sendMetaCapi()` |
| `META_CAPI_ACCESS_TOKEN` | server-side mirror | Meta Events Manager → Pixel → Settings → Conversions API → Generate access token |
| `META_CAPI_TEST_EVENT_CODE` | testing only | When set, all Meta CAPI hits land in Test Events. **Remove before going live.** |

Store the secrets (`GA4_API_SECRET`, `META_CAPI_ACCESS_TOKEN`,
`META_CAPI_TEST_EVENT_CODE`) as secret env vars in your hosting
platform. The rest can be plaintext.

Without `GA4_API_SECRET` / `META_CAPI_ACCESS_TOKEN` the server-side
mirrors no-op (so Preview deploys without secrets don't 500) — but
they emit a loud structured warning the first time each missing
secret is hit per process. Watch for `[GA4MP] GA4_API_SECRET is
missing` and `[MetaCAPI] META_CAPI_ACCESS_TOKEN is missing` in your
log tail; ensure your routing forwards entries with
`__pipeline: 'error'` to the operator. See INVARIANT #21.

## 5. Configure GTM

You build the GTM container in the GTM UI. The kit does NOT include a
pre-built container JSON — every project's container differs in event
names and tag selection — but here's the minimum config for the
default events:

### Variables

- **Built-in**: enable `Click URL`, `Click Element`, `Page Path`,
  `Page Title`, `Referrer`, `Page URL`.
- **Data Layer Variables** (DLV):
  - `DLV - event_id`
  - `DLV - value`
  - `DLV - currency`
  - `DLV - service`
  - `DLV - source`
  - `DLV - form_name`
  - one per event-specific param you push
- **Custom JavaScript** (read PII from the hidden DOM element for
  Google Ads UPD):
  ```js
  function() {
    var el = document.getElementById('__tk_user_data__');
    if (!el) return undefined;
    return {
      email: el.dataset.email,
      phone_number: el.dataset.phone,
      address: {
        first_name: el.dataset.firstName,
        last_name: el.dataset.lastName,
        city: el.dataset.city,
        postal_code: el.dataset.postalCode,
        country: el.dataset.country,
      }
    };
  }
  ```
  Name it `JS - User Data Object`.
- **Constant** `META_PIXEL_ID` set to your Pixel ID.
- **Constant** `GA4_MEASUREMENT_ID` set to your G-XXXXXXXXX id.

### Triggers

For each internal event name in your taxonomy, create a **Custom Event**
trigger that matches the event name exactly.

### Tags

- **Google Tag (GA4)** — fires on `All Pages`, configured with your
  Measurement ID. In `Shared event settings`, add a `user_data` row
  reading from `JS - User Data Object` (this gives every GA4 + Ads
  conversion automatic Enhanced Conversions).
- **GA4 Event** tags — one per event you want in GA4. Reference the DLVs
  for params.
- **Google Ads Conversion Tracking** tags — one per Ads conversion
  action. Map `event_id`, `value`, `currency` from DLVs. Conversion
  Linker tag should also fire on `All Pages`.
- **Meta Pixel base** tag (Custom HTML) — fires on `Consent Initialization`
  with `ad_storage = granted` requirement. Use Meta's standard snippet
  with your Pixel ID.
- **Meta Pixel event** tags — one per Meta event you fire (Lead, Contact,
  ViewContent). Pass `eventID` from `DLV - event_id` so server-side
  CAPI dedups.
- **Your CMP tag** (CookieYes / Cookiebot / OneTrust) — fires on the
  built-in `Consent Initialization - All Pages` trigger. The CMP's own
  install instructions include the GTM-tag install path.

### Consent settings on the GTM tags

- Google tags: `Built-in consent settings: Not set` (Google handles
  this automatically based on Consent Mode v2).
- Meta tags + custom HTML: `Additional consent → Require → ad_storage`.

## 6. Configure GA4

- Admin → Events → mark as conversion: every conversion event you fire
  (`primary_conversion`, `callback_conversion`, `phone_conversion`,
  `email_conversion`, `whatsapp_conversion`).
- Admin → Data Streams → Web → Measurement Protocol API secrets →
  create one (use this value as `GA4_API_SECRET`).
- Admin → Custom Definitions → register event-scoped params:
  `service`, `form_name`, `source`, `last_step`, `late_conversion` (and
  anything else you push that you want to slice on).

## 7. Configure Meta Events Manager

- Settings → "Automatic Advanced Matching": ON.
- Settings → Conversions API → Generate access token → set as
  `META_CAPI_ACCESS_TOKEN`.
- Test Events tab → grab the test code → set `META_CAPI_TEST_EVENT_CODE`
  during validation. **Remove it before production traffic.**

## 8. Validate end-to-end

Set `META_CAPI_TEST_EVENT_CODE` and visit your site with a fresh
browser session.

1. Complete the primary funnel.
2. Click the phone / email / WhatsApp button.
3. In Meta Events Manager → Test Events you should see:
   - `Lead` event marked **"Browser AND Server"** (the dedup
     succeeded — same `event_id` from Pixel and CAPI)
   - `Contact` event for the phone click, also "Browser AND Server"
4. If you see only "Browser" → CAPI is not firing or `event_id` is not
   being read. Check `/api/meta/capi` request logs and confirm
   `META_CAPI_ACCESS_TOKEN` is set.

In GA4 DebugView:

1. Open Chrome DevTools → Application → Local Storage → confirm a
   `tk_conversion_state` entry appears after primary completion.
2. GA4 Admin → DebugView → confirm `primary_conversion_complete`,
   `scroll_50`/`scroll_90` events appear.
3. Open a fresh incognito session with a `?gclid=test123` (or your real
   ad URL) → accept all cookies → complete the funnel. In DebugView,
   find the **server-side** `primary_conversion_complete` event and
   confirm its params include `session_id` (matching the browser
   event's session), and that `Realtime → Session source/medium` does
   NOT file it under `(not set)/(not set)`. If it does, the MP send used
   a synthetic `client_id` — confirm `readGa4IdsFromCookie()` is wired
   into your save endpoint and that `GA4_MEASUREMENT_ID` is set
   server-side. See INVARIANT #17.

In Google Ads Tag Assistant:

1. Tag Assistant Companion → record the funnel.
2. Confirm the `Primary Conversion` Google Ads tag fires on the
   late-conversion timer (or upgrade) with the right value and that
   "User-Provided Data: Provided" appears.

## 9. Commit the GTM container & wire CI

Export the GTM container as JSON (GTM UI → Admin → Export Container) and
commit it to the consuming repo at `gtm/container.json`. **Do not
`.gitignore` it.** Code changes that affect `trackEvent` call sites must
ship in the same PR as the corresponding container update — INVARIANT
#22.

Wire the contract checker into CI:

```bash
npm run check:events
```

The script (`scripts/check-event-contract.mjs`) enforces three rules:

1. Every `trackEvent('X')` call site appears in `EVENTS.md`.
2. Every `EVENTS.md` event has a `CE - X` custom-event trigger in
   `gtm/container.json`.
3. Every such trigger fires at least one non-paused tag.

Run it locally before pushing and gate merges on it in your CI
(GitHub Actions, etc.). If the GTM container is missing the script
skips checks (2) and (3) with a notice, but you should always commit
it.

## 10. Deploy the conversion-volume watchdog

See [MONITORING.md](MONITORING.md). A Cloudflare Worker queries GA4
daily, compares each `KEY_EVENT` against a 7-day baseline, and alerts
the operator via Resend if any event drops below 60% of baseline. This
is the safety net for the failure mode where a silent tracking
regression goes undetected for weeks.

## 11. Go live

Once validation is green:

- **Remove `META_CAPI_TEST_EVENT_CODE`** from your env.
- Submit the GTM container — publish a new version with a description
  pointing to the commit / ticket. Commit the published export.
- Mark conversions in Google Ads (if you're running Ads).
- Wait 24-48h before drawing any conclusions from the data — GA4 and
  Ads have a delay.
- Walk through [CHECKLIST.md](CHECKLIST.md) → "Post-deploy
  verification (within 24h)".

## Adding a new event later

See [EVENTS.md](EVENTS.md).

## Migrating from a legacy GTM container

If you're cutting over from a previous tracking implementation that used
its own GTM container (rather than starting fresh), two pieces of stale
state survive in Meta after you swap the container — both need a manual
cleanup pass, neither is automatic.

### A. Custom Events queue cleanup

Meta Events Manager → **Custom Events** lists every event name that
fired from your pixel in the last 28 days. Even after the old container
is unpublished, those event names sit there with `Active` status until
the rolling window expires. Two concrete failure modes:

1. **Custom audiences** built on a legacy event keep recruiting users
   from the old `Active` status until day 28, then go silent — no
   warning, just a drift in audience size.
2. **Lookalikes** seeded on a legacy event silently degrade for the
   same reason.

**Workflow.** After the cutover and one full production session:

```bash
# Extract event names triggered by the NEW container
python3 -c "
import json,sys
data=json.load(open(sys.argv[1]))
for t in data['containerVersion'].get('trigger',[]):
    for f in t.get('customEventFilter',[]):
        for p in f.get('parameter',[]):
            if p.get('key')=='arg1':
                print(p.get('value',''))
" new-workspace.json | sort -u > new-events.txt

# Same for the OLD container, then diff
python3 -c "..." old-workspace.json | sort -u > old-events.txt
diff new-events.txt old-events.txt
```

Every event name that appears in `old-events.txt` but NOT in
`new-events.txt` → manually mark `Block` in Meta Events Manager. They
will not stop firing on their own; the queue is append-only by design.

**Watch for renaming patterns:** the kit's canonical names are
suffix-explicit (`contact_form_submit`, not `contact_form`;
`callback_conversion`, not `callback`). Legacy containers often used
the bare verb. Bare-verb event names in the old list are virtually
always retired.

### B. Blocked Parameters carryover

If the old container shipped raw `user_email` / `user_phone` on any
event, Meta will have flagged those event-parameter pairs in **Settings
→ Blocked parameters** with `Action required` status. Switching to the
kit does NOT clear the flag — Meta has no signal that the underlying
container changed.

Per INVARIANT #16, the unblock workflow is:

1. Confirm the flagged event-parameter pair is no longer reachable in
   the new container — grep both the new GTM JSON for any tag that
   passes the param to `fbq()`, and the codebase for any
   `trackEvent('flagged_event', { flagged_param: ... })` call.
2. Deploy the kit + run one production session.
3. In Meta Events Manager → Settings → Blocked parameters →
   `Request review` → answer `yes` to the self-attestation popup.

The attestation lights the recurrence-detection clock. If a single
session in the next 7 days re-leaks the same param on the same event,
Meta auto-re-blocks more aggressively. Verify in Tag Assistant before
clicking — not after.
