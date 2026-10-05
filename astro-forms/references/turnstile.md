# Turnstile on Soborbo forms

Generic setup (creating the widget, render modes, explicit rendering, the
siteverify recipe in other languages) is in the official `turnstile-spin` skill.
This file covers only what the leadgen template does on top of it.

Code: `src/lib/forms/turnstile.ts` (server), `src/lib/forms/turnstile-widget.ts`
(browser), leadgen-template-site PR #1, branch `fix/turnstile-fail-closed`.

## Verdict classes and responses

`verifyTurnstile()` returns one of three failure classes. The class decides whose
fault it is, the HTTP status and the log code. None of them lets the lead through.

| Situation | Class | HTTP | Code |
|---|---|---|---|
| `TURNSTILE_SECRET_KEY` not set | config | 500 | `CFG-ENV-004` |
| Cloudflare rejects our secret (`invalid-input-secret`) | config | 500 | `TURN-KEY-002` |
| No hostname allowlist could be built | config | 500 | `TURN-KEY-002` |
| No token | rejected | 403 | `TURN-TOKEN-001` |
| Token longer than 2048 characters | rejected | 403 | `TURN-TOKEN-002` |
| Spent or expired token (`timeout-or-duplicate`) | rejected | 403 | `TURN-VERIFY-002` |
| Invalid token, wrong hostname, wrong action | rejected | 403 | `TURN-VERIFY-001` |
| Network error, timeout, 5xx, non-JSON, `internal-error` | unavailable | 503 | `TURN-VERIFY-003` |

The visitor sees a "security check failed, please try again" message for
`rejected`, and the generic error message (with the phone number) for the others.

## Hostname allowlist

- `TURNSTILE_HOSTNAMES` (comma-separated var) is authoritative when set. Use it for
  extra domains, previews, and local dev with test keys.
- Unset: the canonical host from the site config plus the host the request hit
  (covers a `*.workers.dev` preview posting to itself). `www.` is treated as the
  same host.
- `localhost` never belongs in a production value.

The widget's own hostname list (Cloudflare dashboard) is separate: every domain the
widget renders on must be listed there too, or the browser shows
`TurnstileError: 110200` and never produces a token.

## Actions

Each surface sets `data-action` on its widget and the server accepts only the
listed actions for that `formId`:

| formId | Accepted actions |
|---|---|
| `contact` | `contact` |
| `quote` | `quote` |
| `quote-callback` | `quote`, `callback` (the result page reuses the quote widget) |
| `quote-exit` | `exit-callback` |

A token with no action at all is accepted (widgets without `data-action`, some
test keys). If you add a form, add its action to the map in `submit.ts`.

## Browser side

- Reset after any failed POST (`resetTurnstileWidget(form)`), because siteverify
  consumes the token even when a later stage fails.
- A second POST from the same page (quote result -> "call me back") needs a fresh
  token: `freshTurnstileToken(form)` resets and polls for up to 8 s.
- Tokens expire after 5 minutes. A visitor who leaves the form open longer gets a
  `timeout-or-duplicate` 403 on the first try and succeeds after the reset.
- If `challenges.cloudflare.com` is blocked for a visitor, they cannot submit. The
  error message offers the phone number; that is the accepted trade-off of
  fail-closed.

## Test keys

Dummy keys (always pass / always fail / spent token) are listed with their source
in `perishable-facts.md`. Production secrets reject dummy tokens. With the dummy
secret, check what `hostname` and `action` siteverify actually returns before
setting `TURNSTILE_HOSTNAMES` in `.dev.vars`: the PR #1 author observed
`example.com` with no action, while the Cloudflare docs page says `localhost` and
`test`. A returned action of `test` would fail the action check for every form.
