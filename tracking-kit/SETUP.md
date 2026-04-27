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

If your funnel doesn't have an upgrade-window pattern, you can ignore
`UPGRADE_WINDOW_MS` and stop importing `conversion-state.ts` —
`trackEvent` and `mirrorMetaCapi` work standalone.

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
| `GA4_MEASUREMENT_ID` | server-side mirror | Used by `sendGA4MP()` |
| `GA4_API_SECRET` | server-side mirror | GA4 → Admin → Data Streams → Web → Measurement Protocol API secrets |
| `META_PIXEL_ID` | server-side mirror | Used by `sendMetaCapi()` |
| `META_CAPI_ACCESS_TOKEN` | server-side mirror | Meta Events Manager → Pixel → Settings → Conversions API → Generate access token |
| `META_CAPI_TEST_EVENT_CODE` | testing only | When set, all Meta CAPI hits land in Test Events. **Remove before going live.** |

Store the secrets (`GA4_API_SECRET`, `META_CAPI_ACCESS_TOKEN`,
`META_CAPI_TEST_EVENT_CODE`) as secret env vars in your hosting
platform. The rest can be plaintext.

Without `GA4_API_SECRET` / `META_CAPI_ACCESS_TOKEN` the server-side
mirrors silently no-op. Browser-side tracking keeps working.

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

In Google Ads Tag Assistant:

1. Tag Assistant Companion → record the funnel.
2. Confirm the `Primary Conversion` Google Ads tag fires on the
   late-conversion timer (or upgrade) with the right value and that
   "User-Provided Data: Provided" appears.

## 9. Go live

Once validation is green:

- **Remove `META_CAPI_TEST_EVENT_CODE`** from your env.
- Submit the GTM container — publish a new version with a description
  pointing to the commit / ticket.
- Mark conversions in Google Ads (if you're running Ads).
- Wait 24-48h before drawing any conclusions from the data — GA4 and
  Ads have a delay.

## Adding a new event later

See [EVENTS.md](EVENTS.md).
