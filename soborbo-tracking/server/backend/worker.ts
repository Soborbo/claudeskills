/**
 * Custom Worker entry (@astrojs/cloudflare v14 custom entrypoint): exports the
 * daily synthetic-lead smoke `scheduled()` handler ALONGSIDE the Astro SSR
 * handler. Copy to the site's `src/worker.ts`.
 *
 * Wiring (verified pattern — running on all three live sites):
 *  1. wrangler.toml / wrangler.jsonc:  main = "./src/worker.ts"
 *     and  [triggers] crons = ["43 4 * * *"]   (pick a non-round minute; stagger
 *     sites a few minutes apart so gateway logs stay readable).
 *  2. `astro build` compiles this file into dist/server/entry.mjs; the generated
 *     dist/server/wrangler.json carries main + triggers.crons. VERIFY THE
 *     GENERATED CONFIG after the first build — a TOML top-level key placed after
 *     a [table] silently becomes that table's sub-key (the keep_vars footgun:
 *     `keep_vars = true` must sit ABOVE every [section], or a deploy wipes the
 *     dashboard-managed vars).
 *  3. Set TRACKING_TEST_LEAD_EMAIL + TRACKING_TEST_EVENT_CODE vars (the Meta
 *     Test Events code for this site's pixel) — smoke.ts refuses to run without
 *     them.
 *  4. Register the site in the gateway's SMOKE_SITES var so the daily digest
 *     alarms on a missing/rejected smoke row.
 *
 * The Workers runtime types (ExecutionContext, ScheduledController) are local
 * minimal shapes — this compiles whether or not the repo's tsconfig pulls in the
 * @cloudflare/workers-types ambient names.
 */
import { handle } from '@astrojs/cloudflare/handler';
import { runDailySmokeLead } from './lib/tracking/smoke';
import type { GatewayEnv } from './lib/tracking/gateway-dispatch';

interface Ctx {
  waitUntil(promise: Promise<unknown>): void;
}

export default {
  async fetch(request: Request, env: unknown, ctx: Ctx): Promise<Response> {
    return handle(request as never, env as never, ctx as never);
  },
  async scheduled(_event: unknown, env: GatewayEnv, ctx: Ctx): Promise<void> {
    ctx.waitUntil(runDailySmokeLead(env));
  },
};
