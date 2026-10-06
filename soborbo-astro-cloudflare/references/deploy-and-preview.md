# Deploy, preview, observability

Generic wrangler usage (commands, environments, rollback, `--dry-run`) is in the
`wrangler` skill. This file is how our projects differ.

## One deploy path per project

The project's `CLAUDE.md` names it: a GitHub Actions workflow (leadgen template:
`.github/workflows/deploy.yml` ships CI's verified build artifact), Workers Builds, or a
manual script (soborbo-crm `./deploy.sh <client>`, the Serverside gateway, bristolheatpump
`npm run deploy`). Use that path. Running `wrangler deploy` by hand on a CI-deployed project
can ship an unreviewed working tree and race the pipeline.

When a manual deploy is the documented path:

1. Clean tree at the intended commit (a fresh worktree if the checkout is shared).
2. `npm ci && npm run build` (the build may run the image pipeline first).
3. `npx wrangler deploy --dry-run` to see bindings and vars without uploading.
4. Deploy with the project's command, with `--keep-vars` if any var lives only in the
   dashboard (`pitfalls.md` #2).
5. Open the live site in a browser, not only with curl (`pitfalls.md` #5), and check the
   SSR routes and one form.

## Domain cutover

- Bind the new Worker as a Custom Domain, then list every Worker's routes for that
  hostname and remove legacy ones (`pitfalls.md` #4).
- `workers_dev: false` once the real domain is live, so `*.workers.dev` is not a duplicate
  host. www↔bare and http→https for **prerendered** pages need zone rules (Bulk Redirect +
  Always Use HTTPS): the asset layer serves those pages without running the Worker, so a
  middleware redirect never fires for them.

## Preview and staging must not be indexed

The old `import.meta.env.MODE !== 'production'` check does nothing: every `astro build` runs
in production mode, previews included. Decide by **hostname**, at both layers, because
prerendered pages never pass through the middleware:

- Asset layer, in `public/_headers` (absolute-URL rule):
  ```
  https://:version.:subdomain.workers.dev/*
    X-Robots-Tag: noindex
  ```
- SSR responses, in `src/middleware.ts`: set `X-Robots-Tag: noindex` when the request
  hostname is not the canonical host from `siteConfig`.

Or switch the preview hosts off when nobody needs them (`workers_dev: false`,
`preview_urls: false`).

**Client review of an unreleased site:** put the preview hostname behind Cloudflare Access
(one-time PIN to the client's email address) instead of sharing an open URL. noindex only
asks crawlers not to index; Access keeps the page and its draft content private.

## Observability

- Every Worker config has
  `"observability": { "enabled": true }`. New Workers get it by default, but writing it into
  the config makes it survive a re-created Worker and shows in review. This gives Workers
  Logs: `console.log/error` output (log structured JSON) plus invocation logs, searchable in
  the dashboard.
- Traces: `"observability": { "traces": { "enabled": true, "head_sampling_rate": ... } }`
  for app-like projects where request timing across bindings matters. Sample on busy
  Workers; see `perishable-facts.md` for its beta and billing status.
- The self-hosted error pipeline (`tail_consumers: [{ "service": "error-notifier" }]`, the
  client tracker and `/api/error-log`) is **retired**: its alerts never reached anyone. Do
  not add it to new sites. When a site gets its next substantive PR, remove the
  `tail_consumers` entry and the tracker wiring in the same PR.
- Sentry only for app-like projects with users and logins (soborbo-crm, fitapp), where
  issue grouping and source maps pay off. Lead-gen sites use Workers Logs only.
- A 500 with no log line means a handler without a top-level `try/catch`
  (`pitfalls.md` #6); fix that before adding tooling.

## D1 migrations

Generic flow (`migrations create`, `apply --local`, then `--remote`) is in the `wrangler`
skill. Ours: test on a staging or local copy with real-shaped data; on a populated client
database, table-rebuild migrations go through `d1 execute --file` (`pitfalls.md`).
A Worker rollback does not roll back D1 data.
