# Event migration — legacy → canonical

GENERATED from `events.json` by `server/gen-event-aliases.mjs` (alongside
`event-aliases.json`). For an existing live site, a reporting tool unions the
**legacy** and **canonical** names into one metric, and uses the per-site
`cutover_date` (in `event-aliases.json`) to mark where the old names stop.

## Migration plan per live site
1. Note the site's current (legacy) event names from its live GTM / GA4.
2. Deploy the updated `gtm/container.json` + `lib/` so the client emits canonical names.
3. Set `cutover_date` to that deploy date; in reporting, union legacy+canonical via the
   `aliases` map below (before the date the legacy names carry the data, after it the
   canonical names do).

## Alias table

| Legacy GA4 name | Legacy dataLayer name | Canonical name | Meta | Kind |
|---|---|---|---|---|
| `quote_calculator_conversion` | `calculator_complete` | `quote_calculator_submitted` | Lead | conversion |
| `callback_conversion` | `callback_click` | `callback_request_submitted` | Lead | conversion |
| `contact_form_submit` | `contact_submit` | `contact_form_submitted` | Contact | conversion |
| `phone_conversion` | `phone_click` | `phone_number_clicked` | Contact | conversion |
| `email_conversion` | `email_click` | `email_address_clicked` | Contact | conversion |
| `whatsapp_conversion` | `whatsapp_click` | `whatsapp_button_clicked` | Contact | conversion |
| `booking_click` | `—` | `begin_checkout` | InitiateCheckout | ecommerce |
| `quote_calculator_first_view` | `—` | `quote_calculator_opened` | ViewContent | engagement |

> The gateway also accepts the legacy GA4 names and normalizes them to canonical at
> ingress (Serverside), so a not-yet-migrated client keeps working during the parallel run.
