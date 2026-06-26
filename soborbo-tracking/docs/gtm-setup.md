# GTM Setup

## Variables (Data Layer)

Create DLV for: `event_id`, `user_provided_data`, `value`, `currency`, `step_id`, `step_index`, `calculator_name`, `scroll_percentage`, `session_id`, `device`, `form_id`, `last_field`, `first_utm_source`, `first_utm_medium`, `last_utm_source`, `last_utm_medium`.

### User-Provided Data Variable
```
Type: User-Provided Data → Manual
Email: {{DLV - user_provided_data}}.email
Phone: {{DLV - user_provided_data}}.phone_number
Name: UPD - User Data
```

## Triggers (Custom Event)

One per event: `calculator_start`, `calculator_step`, `calculator_complete`, `lead_submit`, `contact_submit`, `phone_click`, `callback_click`, `form_abandon`, `scroll_depth`.

## Tags

### Consent Default
Custom HTML, fires on Consent Initialization. CookieYes handles updates.

### Conversion Linker
Type: Conversion Linker. Requires ad_storage. Trigger: Initialization. **Without this, Google Ads cannot attribute conversions.**

### Google Tag (GA4)
ID: G-XXXXXXXXXX. Requires analytics_storage. Trigger: All Pages.

### GA4 Events
One tag per event. Key: `generate_lead` on CE-lead_submit with value, currency, session_id, device, attribution params.

### Meta Pixel — Base
Custom HTML. Loads fbevents.js + `fbq('track', 'PageView')`. Requires ad_storage + ad_user_data. All Pages.

### Meta Pixel — Lead
```js
fbq('track', 'Lead', {value, currency}, { eventID: {{DLV - event_id}} });
```
Trigger: CE-lead_submit. The `eventID` MUST match the server CAPI `event_id`.

### Meta Pixel — Contact
```js
fbq('track', 'Contact', {}, { eventID: {{DLV - event_id}} });
```
Trigger: CE-contact_submit.

### Google Ads Conversion
Conversion Value: {{DLV - value}}. Transaction ID: {{DLV - event_id}}. User-provided data: {{UPD - User Data}}. Requires ad_storage + ad_user_data. Trigger: CE-lead_submit.

## Enhanced Conversions
Google Ads → Tools → Conversions → Enhanced Conversions: ON → Method: GTM. Check Diagnostics after 24-48h.
