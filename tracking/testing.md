# Testing Checklist

## 1. Consent

- [ ] Banner appears on first visit
- [ ] Reject all → no `sb_` keys in localStorage or sessionStorage
- [ ] No events in GTM Preview before consent
- [ ] Accept analytics → scroll/step events fire, no localStorage writes
- [ ] Accept marketing → `sb_tracking` in localStorage, beacons sent
- [ ] Consent change without page reload → tracking activates immediately

## 2. Submit — Single Event

- [ ] One click = exactly one `lead_submit` in dataLayer
- [ ] No recursion (form submits once, handler runs once)
- [ ] Invalid form → browser validation, NO tracking
- [ ] Valid form → hidden fields populated → redirect to action URL
- [ ] `event_id` is a full UUID format

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

- [ ] Focus field → wait 60s → `form_abandon` with `last_field`
- [ ] Submit before 60s → no abandon event
- [ ] Route change before submit → abandon timer cleaned up

## 7. Phone + Callback

- [ ] Click tel: → `phone_click` fires
- [ ] Click again same session → no duplicate
- [ ] Check sessionStorage `sb_click_phone_*`
- [ ] Page reload → still deduped within session timeout
- [ ] Callback button → `callback_click` fires

## 8. Calculator Funnel

- [ ] Start → step → option → complete all fire with session_id
- [ ] Funnel numbers in GA4 make sense (start ≥ complete)

## 9. Attribution

- [ ] Visit with `?gclid=xxx` → accept consent → check `sb_first_touch`
- [ ] Second visit with different UTM → first touch unchanged, last touch updated
- [ ] Conversion event includes both first_* and last_* fields

## 10. Meta CAPI

- [ ] `/api/track` returns 200
- [ ] Meta Events Manager → Test Events shows server event
- [ ] Event Match Quality 6+/10
- [ ] Browser Pixel `eventID` = server `event_id` (deduplication)

## 11. Server Validation

- [ ] Invalid JSON → 400
- [ ] Unknown fields → 400 (strict mode)
- [ ] Lead without email → 400
- [ ] Payload >32KB → 413
- [ ] Wrong origin → 403
- [ ] Wrong TRACK_TOKEN → 401
- [ ] >10 requests/min → 429

## 12. Edge Cases

- [ ] Safari private mode → no errors, graceful degradation
- [ ] URL params captured before consent, persisted after
- [ ] Very long utm_campaign (>256 chars) → rejected by schema
- [ ] Phone with spaces/brackets → normalized correctly
- [ ] Multiple tabs → session shared via sessionStorage
- [ ] `?debugTracking=1` → events logged to console

## Debug

**No events**: Console errors? Is dataLayer defined? Consent granted?
**CAPI not sending**: Check `/api/track` response. Cloudflare Functions logs. Env vars set?
**Double submit**: Check `isSubmitting` guard. Using `form.submit()` not `requestSubmit()`?
**Attribution missing**: Consent given before URL changed? Check `sb_first_touch`.
