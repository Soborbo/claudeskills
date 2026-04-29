# Extended Setup & Troubleshooting

## Prerequisites

The shared `soborbo-error-pipeline` repo must be deployed already. You should
have:

- An `error-notifier` worker visible in your Cloudflare account
- An `error-admin` worker, ideally already behind Cloudflare Access
- A KV namespace bound as `ERROR_KV` to both workers
- Resend secrets configured on the notifier

If any of those are missing, complete the setup in the
`soborbo-error-pipeline/README.md` first. This skill assumes they exist.

## File placement in the producer project

Copy the three reference files exactly to:

```
src/lib/errors/tracker.ts          ← references/tracker.ts
src/lib/errors/client-init.ts      ← references/client-init.ts
src/pages/api/error-log.ts         ← references/error-log-endpoint.ts
```

If your project uses a different alias than `@/`, adjust the import in
`client-init.ts` accordingly.

## Wiring the script

In your base layout (e.g. `src/layouts/Base.astro`), add as the **last**
script before `</body>`:

```astro
<script>
  import { initErrorTracker } from '@/lib/errors/client-init';
  initErrorTracker({
    siteId: import.meta.env.PUBLIC_SITE_ID || 'unknown',
    endpoint: '/api/error-log',
  });
</script>
```

`PUBLIC_SITE_ID` is what the admin uses to filter and label rows. Set it in
`.env`:

```
PUBLIC_SITE_ID=painlessremovals
```

Match it to the producer worker's `name` in `wrangler.jsonc` for consistency.

## Wiring the Tail Worker

Append to the producer's `wrangler.jsonc`:

```jsonc
{
  "name": "painlessremovals",
  // ... rest of config
  "tail_consumers": [
    { "service": "error-notifier" }
  ]
}
```

Redeploy the producer:

```bash
wrangler deploy
```

That's it. Logs and exceptions from this worker now flow into the pipeline.

## Verification

1. **Smoke-test the endpoint locally:**

```bash
curl -X POST http://localhost:4321/api/error-log \
  -H 'Content-Type: application/json' \
  -d '{"__pipeline":"error","code":"TEST-MANUAL-001","message":"hello","url":"http://test","source":"curl","context":{},"stack":"","sessionId":"","requestId":"abc","userAgent":"","viewport":"","connection":"","fingerprint":"f","ts":"2026-04-29T00:00:00Z","pageLoadedAgo":0}'
```

Expect `204`. (`TEST-MANUAL-001` won't be in `codes.ts` so the notifier will
default to `ERROR` severity — fine for a smoke test.)

2. **Verify the Tail Worker is receiving:**

```bash
# In the soborbo-error-pipeline repo:
npm run tail:notifier
```

Trigger an error in the producer (e.g. visit a page that throws). You should
see log output flow through. Check the admin shortly after.

3. **Confirm the admin sees it:**

Open the admin URL → records should appear within ~10 seconds (KV
eventual-consistency window).

## Common issues

### "I deployed but no records show up"

Check, in order:

1. `tail_consumers` is set in the producer's `wrangler.jsonc` and the
   producer was **redeployed** after the change (config changes need a deploy)
2. The producer's `observability.enabled = true` in `wrangler.jsonc`
3. `npm run tail:notifier` shows incoming events when you trigger an error

### "Records appear but no email arrives for CRITICAL"

1. Verify `RESEND_API_KEY` is set as a secret on the notifier worker
2. Check `ALERT_EMAIL_FROM` is verified in your Resend dashboard
3. Check the throttle KV — if you tested the same `(site, code)` combination
   recently, you'll be throttled for up to 4 hours. Clear with:
   ```bash
   wrangler kv key delete --binding ERROR_KV \
     "throttle:email:painlessremovals:HTTP-500-001" \
     --config wrangler.notifier.jsonc
   ```

### "I see uncaught exceptions in the dashboard but no client-side errors"

Likely the producer endpoint isn't accessible. Check:

1. The Astro project has SSR enabled (server output mode, not static)
2. `/api/error-log` returns 204 to a manual `curl` POST
3. The browser dev tools Network tab shows the `sendBeacon` request firing
   (filter by "error-log") — **note** sendBeacon won't show in the Network
   panel of all browsers; if missing, throw a manual error in console:
   `import('@/lib/errors/tracker').then(m => m.trackError('TEST-001'))`

### "Bundle is bigger than 1.5KB"

Check that `tracker.ts` doesn't import anything other than what's listed.
The pipeline tracker is intentionally dependency-free. If your bundler shows
more, look for accidental re-exports of `codes.ts` (which would balloon the
client to ~50KB).

## Migration from the old `error-tracking` skill

If you previously installed the old skill:

1. Delete `src/lib/errors/codes.ts` from the producer (notifier owns it now)
2. Delete `src/lib/errors/types.ts`
3. Delete `src/lib/errors/sanitize.ts` (the notifier handles sanitisation)
4. Delete `src/lib/errors/web-vitals.ts` (separate concern; new skill TBD)
5. Delete `src/lib/errors/error-report.ts` (replaced by `error-log.ts`)
6. Delete `src/lib/errors/tracker-server.ts` (server logging is now via
   plain `console.error(JSON.stringify(...))` — see SKILL.md)
7. Delete `src/pages/api/error-report.ts`
8. Replace `src/lib/errors/client-catcher.ts` and `tracker.ts` with the
   files from this skill's `references/`

Server-side calls of the form `trackServerError('CODE-001', e, ctx, cfg)`
need to be replaced with structured `console.error(JSON.stringify({...}))`.
The notifier resolves the rest.
