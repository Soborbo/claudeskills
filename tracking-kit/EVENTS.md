# Event taxonomy guide

The kit ships with a default event taxonomy designed for a
**lead-generation funnel with an upgrade window** (form completion →
phone/email/whatsapp click). Adapt it to your funnel — most projects
will rename a few events and add one or two.

## Naming convention

- `snake_case`. GA4 lowercases everything anyway.
- Verb at the end for actions (`form_start`, `quote_complete`).
- Past tense for completions (`signup_completed`, not `signup_completing`).
- Keep names stable once events have been firing for >1 week — renaming
  re-segments your historical data.

## The default taxonomy

| Event | Purpose | Mirrors to |
| --- | --- | --- |
| `form_start` | First focus on a tracked form | GA4 only |
| `form_step_complete` | Step advance | GA4 only |
| `form_abandonment` | Tab close / hide with unsubmitted form | GA4 (browser + MP backstop) |
| `primary_conversion_complete` | Engagement signal — every primary completion, immediate | GA4 (browser + MP backstop) |
| `primary_first_view` | First primary completion in this browser, ever | GA4 + Meta `ViewContent` |
| `primary_conversion` | The actual conversion. Fires on upgrade OR window timeout | GA4 + Google Ads + Meta `Lead` |
| `callback_conversion` | Callback form submitted | GA4 + Google Ads + Meta `Lead` |
| `contact_form_submit` | Stand-alone contact-us form submitted | GA4 + Meta `Contact` |
| `phone_conversion` | tel: click | GA4 + Google Ads + Meta `Contact` |
| `email_conversion` | mailto: click | GA4 + Meta `Contact` |
| `whatsapp_conversion` | wa.me / whatsapp.com click | GA4 + Meta `Contact` |
| `scroll_50`, `scroll_90` | Scroll depth | GA4 only |

## Adapting to your funnel

### Lead-gen with calculator (e.g. moving quotes, insurance, loans)

Keep the default taxonomy. Rename `primary_conversion` to something
domain-specific if you want clarity in GA4 reports
(`quote_calculator_conversion`, `loan_quote_conversion`, etc.). Update
`META_EVENT_NAMES` in `config.ts` to match.

### E-commerce checkout

Drop the upgrade window entirely (don't import `conversion-state.ts`).
Replace the conversion events with:

| Event | When | Mirrors to |
| --- | --- | --- |
| `view_item` | Product page view | GA4 + Meta `ViewContent` |
| `add_to_cart` | Add-to-cart click | GA4 + Meta `AddToCart` |
| `begin_checkout` | Checkout start | GA4 + Meta `InitiateCheckout` |
| `purchase` | Order confirmation page | GA4 + Google Ads + Meta `Purchase` |

GA4 has standard names for these events that auto-populate the e-commerce
reports — use them verbatim. Update `META_EVENT_NAMES` in `config.ts`
and `ALLOWED_EVENTS` in `meta-capi.ts` accordingly (`Purchase` etc.).

### SaaS signup with free trial

Map `primary_conversion_complete` to `trial_started` and use the upgrade
window for `trial_started → paid_upgrade` instead of for phone clicks.
The state machine doesn't care about the semantic — it just times out.
Set `UPGRADE_WINDOW_MS` to a longer span (7 days, 14 days). If you do
this, also tighten `LATE_CATCHUP_MS` because a returning user 14 days
later is a different attribution story than a returning user 25 hours
later.

### Content site with newsletter signups

Keep `form_start` / `form_step_complete` / `form_abandonment`. Rename
`primary_conversion_complete` to `newsletter_subscribe` (no upgrade
window — fire as a direct conversion). Drop `phone_conversion`,
`email_conversion`, `whatsapp_conversion` if you don't have those
contact channels.

## Adding a new event

The flow has three sides: code, GTM container, and the analytics
platforms.

### 1. Code

```ts
import { trackEvent } from '@/lib/tracking';

trackEvent('your_new_event', {
  // event-scoped params — no PII
  category: 'whatever',
  value: 42,
  currency: 'EUR',
});
```

If the event needs a server-side CAPI mirror, add it to `META_EVENT_NAMES`
in `config.ts`:

```ts
export const META_EVENT_NAMES: Record<string, string> = {
  // ...
  your_new_event: 'Lead', // or 'Contact', 'ViewContent', 'Purchase', etc.
};
```

If the event needs a server-side GA4 MP mirror (rare — only when the
browser may not fire), call `sendGA4MP()` from your existing API route
that processed the action. Read the `client_id` / `session_id` from the
request's cookies with `readGa4IdsFromCookie()` first, and skip the send
when there's no `_ga` cookie — never pass a synthetic id (INVARIANT #17).

### 2. GTM container

- Add a **Custom Event** trigger with the exact name (`your_new_event`).
- Add at least one **tag** firing on it:
  - GA4 Event tag (with the params you want to keep in GA4 reports)
  - optional Google Ads Conversion Tracking tag (if it's a conversion
    you'd optimize Ads on)
  - optional Meta Pixel event tag (with `eventID` from `DLV - event_id`
    so CAPI dedups)
- If you push a new param, add a corresponding **Data Layer Variable**
  so tags can read it.

Submit and publish.

### 3. Analytics platforms

- **GA4**: register any new event-scoped params under Admin → Custom
  Definitions. Mark the event as a conversion if applicable.
- **Google Ads**: if you added a conversion action, set its category,
  count rule, and attribution model.
- **Meta**: if you added it to `META_EVENT_NAMES`, also add it to
  `ALLOWED_EVENTS` in `/api/meta/capi` so the endpoint accepts it.

Validate the new event using GTM Preview mode + GA4 DebugView + Meta
Test Events before pushing to production.

## Renaming or removing an event

Renaming breaks historical attribution. Prefer "deprecate, then add new":

1. Add the new event name and start firing both old and new for 30
   days.
2. Mirror the new event in GTM / GA4 / Ads / Meta side-by-side.
3. Cut over reports to the new event.
4. Stop firing the old event. Leave its trigger in GTM as "paused" for
   another 30 days in case anything still references it.

For pure removal: stop pushing the dataLayer event in code, then delete
the trigger and tags in GTM in a follow-up sprint (don't do it the
same day — the cached GTM library on user devices keeps firing the old
trigger for hours after publish).
