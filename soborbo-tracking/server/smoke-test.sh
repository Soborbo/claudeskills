#!/usr/bin/env bash
#
# smoke-test.sh — quick curl smoke test for the event-gateway worker.
#
# Checks the worker's OWN logic (no external API calls):
#   1) /api/event/health           -> 200, {"status":"ok"}
#   2) unknown route                -> 404
#   3) malformed JSON body          -> 204 (silent reject, CLAUDE.md #12)
#   4) missing turnstile_token      -> 204 (invalid payload, silent)
#   5) full valid payload           -> 204 (host configured + Turnstile OK)
#                                      403 (Turnstile rejected the token)
#                                      404 (host not in the SITE_CONFIG KV)
#
# What curl CANNOT check — do this manually (see the end of the script):
#   - whether the event actually reaches Meta CAPI / GA4 / Google Ads.
#
# Usage:
#   ./smoke-test.sh <BASE_URL> [TURNSTILE_TOKEN]
#
# Examples:
#   ./smoke-test.sh http://localhost:8787
#   ./smoke-test.sh https://event-gateway.<subdomain>.workers.dev
#   ./smoke-test.sh https://painlessremovals.com <real-turnstile-token>
#
# TURNSTILE_TOKEN is optional. With a production Turnstile secret a dummy token
# returns 403 (also correct). For a real 204 happy path use a token from a real
# browser, or Cloudflare's "always passes" test secret
# (1x0000000000000000000000000000000AA) in the worker's TURNSTILE_SECRET_KEY.

set -uo pipefail

BASE_URL="${1:-}"
TURNSTILE_TOKEN="${2:-dummy-smoke-token}"

if [ -z "$BASE_URL" ]; then
  echo "Usage: $0 <BASE_URL> [TURNSTILE_TOKEN]" >&2
  echo "Example: $0 https://event-gateway.<subdomain>.workers.dev" >&2
  exit 2
fi

BASE_URL="${BASE_URL%/}"
NOW="$(date +%s)"
PASS=0
FAIL=0

# check <description> <expected-code-regex> <actual-code>
check() {
  local desc="$1" expected="$2" actual="$3"
  if [[ "$actual" =~ $expected ]]; then
    printf '  \033[32mPASS\033[0m  %-46s [%s]\n' "$desc" "$actual"
    PASS=$((PASS + 1))
  else
    printf '  \033[31mFAIL\033[0m  %-46s [got: %s, want: %s]\n' "$desc" "$actual" "$expected"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== event-gateway worker — smoke test ==="
echo "Target: $BASE_URL"
echo

# 1) Health
HEALTH_BODY="$(curl -s "$BASE_URL/api/event/health")"
HEALTH_CODE="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/event/health")"
check "health endpoint 200" '^200$' "$HEALTH_CODE"
if [[ "$HEALTH_BODY" == *'"status":"ok"'* ]]; then
  printf '  \033[32mPASS\033[0m  %-46s [%s]\n' "health body status:ok" "$HEALTH_BODY"
  PASS=$((PASS + 1))
else
  printf '  \033[31mFAIL\033[0m  %-46s [%s]\n' "health body status:ok" "$HEALTH_BODY"
  FAIL=$((FAIL + 1))
fi

# 2) Unknown route
UNKNOWN_CODE="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/this-route-does-not-exist")"
check "unknown route 404" '^404$' "$UNKNOWN_CODE"

# 3) Malformed JSON
BADJSON_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  "$BASE_URL/api/event/conversion" \
  -H 'Content-Type: application/json' \
  --data-raw '{ this is not valid json')"
check "malformed JSON body 204 (silent)" '^204$' "$BADJSON_CODE"

# 4) Missing turnstile_token (invalid payload structure)
NOTOKEN_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  "$BASE_URL/api/event/conversion" \
  -H 'Content-Type: application/json' \
  -d "{\"event_name\":\"contact_form_submit\",\"event_id\":\"smoke-notoken-${NOW}\",\"event_time\":${NOW}}")"
check "missing turnstile_token 204 (silent)" '^204$' "$NOTOKEN_CODE"

# 5) Full valid payload
VALID_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  "$BASE_URL/api/event/conversion" \
  -H 'Content-Type: application/json' \
  -d "{\"event_name\":\"contact_form_submit\",\"event_id\":\"smoke-valid-${NOW}\",\"event_time\":${NOW},\"turnstile_token\":\"${TURNSTILE_TOKEN}\",\"value\":1,\"currency\":\"GBP\",\"source\":\"smoke-test\",\"event_source_url\":\"${BASE_URL}/smoke\",\"user_data\":{\"email\":\"smoke@example.com\"}}")"
check "valid payload 204/403/404" '^(204|403|404)$' "$VALID_CODE"
case "$VALID_CODE" in
  204) echo "         -> 204: host configured, Turnstile passed, fan-out started." ;;
  403) echo "         -> 403: Turnstile rejected the token (expected with a dummy token + a real secret)." ;;
  404) echo "         -> 404: host not in the SITE_CONFIG KV (normal on a workers.dev URL with no KV key)." ;;
esac

echo
echo "Result: $PASS passed, $FAIL failed."
echo
echo "--- What curl does NOT check — manual validation (after deploying $BASE_URL) ---"
echo "  * Live worker logs:   npx wrangler tail"
echo "    -> a 'Fan-out completed' line per event, with a success flag per platform."
echo "  * Meta Events Manager -> Test Events: the event shows up with source 'Server'"
echo "    (while test_event_code is set in the KV config)."
echo "  * GA4 -> Admin -> DebugView / Realtime: the server-side event appears."
echo "  * Google Ads -> Goals -> Conversions: 'Recording' status after 24-48h."
echo "  * R2 'soborbo-tracking-dlq' bucket: failed platform calls land here."

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
