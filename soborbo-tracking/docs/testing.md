# Testing Checklist

## 1. Consent

- [ ] Banner appears on first visit
- [ ] Reject all → no `sb_` keys in localStorage or sessionStorage
- [ ] No events in GTM Preview before consent
- [ ] Accept analytics → scroll/step events fire, no localStorage writes
- [ ] Accept marketing → `sb_tracking` in localStorage, beacons sent
- [ ] Consent change without page reload → tracking activates immediately

## 2. Submit — Single Event

- [ ] One click = exactly one `quote_calculator_submitted` in dataLayer
- [ ] No recursion (form submits once, handler runs once)
- [ ] Invalid form → browser validation, NO tracking
- [ ] Valid form → hidden fields populated → redirect to action URL
- [ ] `event_id` is a full UUID format
- [ ] **No raw PII in the dataLayer** (no `email` / `phone_number` /
      `user_provided_data`) — PII goes to the hidden side-channel
      (`window.__sbUserData` / `#__sb_user_data__`), see CANONICAL-EVENTS.md / gtm-setup.md
- [ ] Same `event_id` on the dataLayer push AND the gateway POST (dedup)

## 3. Submit — Multi-Button

- [ ] Two submit buttons with different name/value pairs
- [ ] Click button A → backend receives button A's name/value
- [ ] Click button B → backend receives button B's name/value

## 4. Two Forms on One Page

- [ ] Each form has independent abandon timer
- [ ] Submitting form A ≠ cancel abandon on form B
- [ ] Each fires its own conversion event (no crosstalk)

## 5. View Transitions (Astro)

- [ ] Navigate → tracking re-inits
- [ ] Scroll to 50% = exactly one event (no stacking)
- [ ] Phone links on new page bound correctly
- [ ] Abandon timer from old page cleaned up

## 6. Form Abandonment

- [ ] Focus field → wait 60s → `form_abandoned` with `last_field`
- [ ] Submit before 60s → no abandon event
- [ ] Route change before submit → abandon timer cleaned up

## 7. Phone + Callback + Email + WhatsApp (both channels)

- [ ] Click tel: → `phone_number_clicked` (dataLayer) **and** `phone_number_clicked` (gateway POST), same `event_id`
- [ ] Click again same session → no duplicate on EITHER channel (session dedup)
- [ ] Check sessionStorage `sb_click_phone_*`
- [ ] Page reload → still deduped within session timeout
- [ ] Callback button → `callback_request_submitted` + `callback_request_submitted`
- [ ] mailto: link → `email_address_clicked` + `email_address_clicked`
- [ ] WhatsApp link (wa.me / *.whatsapp.com) → `whatsapp_button_clicked` + `whatsapp_button_clicked`
- [ ] Marketing-only consent (analytics denied) → gateway conversion STILL fires, no dataLayer event
- [ ] Analytics-only consent (marketing denied) → dataLayer event fires, NO gateway POST

## 8. Calculator Funnel

- [ ] Start → step → option → complete all fire with session_id
- [ ] Funnel numbers in GA4 make sense (start ≥ complete)

## 9. Attribution

- [ ] Visit with `?gclid=xxx` → accept consent → check `sb_first_touch`
- [ ] Second visit with different UTM → first touch unchanged, last touch updated
- [ ] Conversion event includes both first_* and last_* fields

## 10. Server side — event-gateway worker (Meta CAPI + GA4 MP + Google Ads)

> The server side is the `Soborbo/Serverside` event-gateway worker, served
> same-origin at **`/api/event/conversion`** (not the old in-app `/api/track`).

- [ ] POST `/api/event/conversion` returns 2xx (browser Network tab / `sendBeacon`)
- [ ] Meta Events Manager → Test Events shows the server event
- [ ] Event Match Quality 6+/10
- [ ] Browser Pixel `eventID` = server `event_id` (deduplication)
- [ ] Google Ads → conversion uploads visible (offline/diagnostics)
- [ ] GA4: NOT double-counted (browser GA4 + gateway MP — see CANONICAL-EVENTS.md)

## 11. Gateway validation (server-side, in Soborbo/Serverside)

- [ ] Missing/invalid Turnstile token → handled per the gateway's policy
- [ ] `event_name` not in the allowed set → rejected
- [ ] No marketing consent (EEA `require_consent`) → ad-platform dispatch withheld
- [ ] Wrong origin → rejected
- [ ] Rate limit exceeded → 429
- [ ] PII is hashed server-side (never logged raw)

## 12. Edge Cases

- [ ] Safari private mode → no errors, graceful degradation
- [ ] URL params captured before consent, persisted after
- [ ] Very long utm_campaign (>256 chars) → rejected by schema
- [ ] Phone with spaces/brackets → normalized correctly
- [ ] Multiple tabs → session shared via sessionStorage
- [ ] `?debugTracking=1` → events logged to console

## Debug

**No events**: Console errors? Is dataLayer defined? Consent granted?
**Gateway not sending**: Check the `/api/event/conversion` response (Network tab) and
the gateway worker logs (`wrangler tail`). Turnstile token present? Marketing consent?
Per-site KV config bound? (Meta/GA4/Ads secrets live in the gateway KV, not the site.)
**Double submit**: Check the `isSubmitting` guard. `requestSubmit()` re-fires the submit
event once — the guard makes the second pass a no-op (no `preventDefault`).
**Attribution missing**: Consent given before URL changed? Check `sb_first_touch`.
