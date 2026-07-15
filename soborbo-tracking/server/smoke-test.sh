#!/usr/bin/env bash
#
# smoke-test.sh — curl smoke test for the event-gateway worker (Run 6 contract).
#
# Checks the worker's OWN gate logic (no external API calls, nothing reaches Meta):
#   1) /api/event/health                          -> 200, {"status":"ok"}
#   2) unknown route                              -> 404
#   3) browser path, malformed JSON               -> 204 (silent drop — beacons don't read bodies)
#   4) browser path, NO Origin header             -> 403 (Origin allow-list is fail-closed)
#   5) browser path, server-ingress-only event    -> 403 (TRK-400-017 — form conversions
#      (contact_form_submitted) with allowed Origin    may NOT use the browser path)
#   6) browser path, low-risk click event         -> 204 (allowed Origin + allowed event)
#      (phone_number_clicked)                        404 if the host is not in SITE_CONFIG KV
#   7) server ingress, NO token                   -> 401 (no browser fallback)
#   8) server ingress, WRONG token                -> 401
#   9) [optional, with a real token] server ingress + token -> 204
#
# What curl CANNOT check — the daily smoke cron covers it end-to-end
# (site worker scheduled() -> conversion-server -> Meta TEST stream -> D1 ledger,
# guarded by the gateway daily digest via SMOKE_SITES):
#   - that the event actually reaches Meta CAPI and books an honest ledger row.
#
# NEVER test with a live browser pixel, and NEVER put test_event_code in KV.
# Synthetic proof goes through the AUTHENTICATED ingress with the per-request
# test code only (two production Meta leaks happened the other way).
#
# Usage:
#   ./smoke-test.sh <SITE_HOST> [SERVER_TOKEN]
#
# Examples:
#   ./smoke-test.sh https://example.com
#   ./smoke-test.sh https://example.com "$TRACKING_GATEWAY_TOKEN"
#
# SITE_HOST must be a host that is (or will be) in the SITE_CONFIG KV — the
# Origin header sent below is derived from it.

set -uo pipefail

BASE_URL="${1:-}"
SERVER_TOKEN="${2:-}"

if [ -z "$BASE_URL" ]; then
  echo "Usage: $0 <SITE_HOST> [SERVER_TOKEN]" >&2
  echo "Example: $0 https://example.com" >&2
  exit 2
fi

BASE_URL="${BASE_URL%/}"
ORIGIN="$BASE_URL"
NOW="$(date +%s)"
PASS=0
FAIL=0

# check <description> <expected-code-regex> <actual-code>
check() {
  local desc="$1" expected="$2" actual="$3"
  if [[ "$actual" =~ $expected ]]; then
    printf '  \033[32mPASS\033[0m  %-52s [%s]\n' "$desc" "$actual"
    PASS=$((PASS + 1))
  else
    printf '  \033[31mFAIL\033[0m  %-52s [got: %s, want: %s]\n' "$desc" "$actual" "$expected"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== event-gateway worker — smoke test (Run 6 gates) ==="
echo "Target: $BASE_URL   Origin: $ORIGIN"
echo

# 1) Health
HEALTH_BODY="$(curl -s "$BASE_URL/api/event/health")"
HEALTH_CODE="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/event/health")"
check "health endpoint 200" '^200$' "$HEALTH_CODE"
if [[ "$HEALTH_BODY" == *'"status":"ok"'* ]]; then
  printf '  \033[32mPASS\033[0m  %-52s [%s]\n' "health body status:ok" "$HEALTH_BODY"
  PASS=$((PASS + 1))
else
  printf '  \033[31mFAIL\033[0m  %-52s [%s]\n' "health body status:ok" "$HEALTH_BODY"
  FAIL=$((FAIL + 1))
fi

# 2) Unknown route
UNKNOWN_CODE="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/this-route-does-not-exist")"
check "unknown route 404" '^404$' "$UNKNOWN_CODE"

# 3) Browser path: malformed JSON → 204 silent drop (the beacon caller never reads it)
BADJSON_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  "$BASE_URL/api/event/conversion" \
  -H 'Content-Type: application/json' -H "Origin: $ORIGIN" \
  --data-raw '{ this is not valid json')"
check "browser: malformed JSON 204 (silent)" '^204$' "$BADJSON_CODE"

# 4) Browser path: no Origin → 403 (fail-closed allow-list)
NOORIGIN_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  "$BASE_URL/api/event/conversion" \
  -H 'Content-Type: application/json' \
  -d "{\"event_name\":\"phone_number_clicked\",\"event_id\":\"smoke-noorigin-${NOW}\",\"event_time\":${NOW}}")"
check "browser: missing Origin 403" '^40[34]$' "$NOORIGIN_CODE"

# 5) Browser path: server-ingress-only event → 403 (TRK-400-017)
GATED_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  "$BASE_URL/api/event/conversion" \
  -H 'Content-Type: application/json' -H "Origin: $ORIGIN" \
  -d "{\"event_name\":\"contact_form_submitted\",\"event_id\":\"smoke-gated-${NOW}\",\"event_time\":${NOW}}")"
check "browser: gated event (contact form) 403" '^40[34]$' "$GATED_CODE"

# 6) Browser path: allowed low-risk click event → 204 (or 404 if host not in KV)
CLICK_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  "$BASE_URL/api/event/conversion" \
  -H 'Content-Type: application/json' -H "Origin: $ORIGIN" \
  -d "{\"event_name\":\"phone_number_clicked\",\"event_id\":\"smoke-click-${NOW}\",\"event_time\":${NOW},\"event_source_url\":\"${BASE_URL}/smoke\"}")"
check "browser: low-risk click 204 (404 = host not in KV)" '^(204|404)$' "$CLICK_CODE"

# 7) Server ingress: no token → 401 (no browser fallback)
NOTOKEN_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  "$BASE_URL/api/event/conversion-server" \
  -H 'Content-Type: application/json' \
  -d "{\"event_name\":\"contact_form_submitted\",\"event_id\":\"smoke-srv-notoken-${NOW}\",\"event_time\":${NOW}}")"
check "server ingress: missing token 401" '^(401|404)$' "$NOTOKEN_CODE"

# 8) Server ingress: wrong token → 401
BADTOKEN_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  "$BASE_URL/api/event/conversion-server" \
  -H 'Content-Type: application/json' -H 'X-Admin-Token: definitely-not-the-token' \
  -d "{\"event_name\":\"contact_form_submitted\",\"event_id\":\"smoke-srv-badtoken-${NOW}\",\"event_time\":${NOW}}")"
check "server ingress: wrong token 401" '^(401|404)$' "$BADTOKEN_CODE"

# 9) Optional: real token → 204 (books a ledger row; use a smoke-* event_id so it
#    filters out of audits). Body carries NO test_event_code here on purpose — the
#    event has no user_data, so no vendor call happens for a meta-less payload;
#    prefer the daily smoke cron for the full Meta TEST-stream proof.
if [ -n "$SERVER_TOKEN" ]; then
  DAY="$(date +%Y%m%d)"
  REAL_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST \
    "$BASE_URL/api/event/conversion-server" \
    -H 'Content-Type: application/json' -H "X-Admin-Token: $SERVER_TOKEN" \
    -d "{\"event_name\":\"contact_form_submitted\",\"event_id\":\"smoke-curl-${DAY}\",\"event_time\":${NOW},\"source\":\"smoke-test.sh\",\"event_source_url\":\"${BASE_URL}/smoke\"}")"
  check "server ingress: valid token 204" '^204$' "$REAL_CODE"
fi

echo
echo "Result: $PASS passed, $FAIL failed."
echo
echo "--- What curl does NOT prove — the daily smoke cron + digest covers it ---"
echo "  * Live worker logs:  npx wrangler tail event-gateway"
echo "  * D1 ledger row for the event: deliveries.status must be accepted+http_status"
echo "    or skipped — NEVER accepted without a vendor HTTP status (TRK-950-004)."
echo "  * Meta Events Manager -> Test Events: only via the smoke cron / a payload"
echo "    whose test_event_code was resolved per-request (never from KV)."

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
