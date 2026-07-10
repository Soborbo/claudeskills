#!/usr/bin/env node
// @ts-check
/**
 * verify — layered verification orchestrator.
 *
 * Runs the layers in order and prints one honest summary. Design rules:
 *
 *   - A SKIP is never a PASS. Layers that can't run (no creds, no build, no
 *     browser) exit with code 3 and show up as SKIPPED in the summary. In
 *     --strict mode a skip fails the run — that is the mode that actually
 *     "excludes" the historical bug classes; the default mode tells you
 *     exactly which claims remain unverified.
 *   - Layers are independent: one failing doesn't stop the rest, so a run
 *     always produces the complete picture.
 *
 * Layers:
 *   source     verify-source.mjs      — call-site invariants (fast, no deps)
 *   dist       verify-dist.mjs        — built-HTML invariants
 *   gtm-live   verify-gtm-live.mjs    — code events vs the LIVE container
 *   e2e        playwright test        — network-truth funnel (site adapter)
 *   live-data  verify-live-data.mjs   — GA4 attribution quality (outcome)
 *
 * Configure per site with verify.site.json (see docs/VERIFICATION.md):
 *   {
 *     "src": "./src",
 *     "dist": "./dist/client",
 *     "mpFn": "sendGA4MP",
 *     "conversionEvents": ["quote_calculator_conversion", "..."],
 *     "keyEvents": ["quote_calculator_conversion", "..."],
 *     "e2eDir": "./e2e",
 *     ...verify-dist manifest keys
 *   }
 *
 * Usage:
 *   node verify/run-verify.mjs [--layers source,dist,gtm-live,e2e,live-data]
 *     [--config ./verify.site.json] [--strict] [--base-url URL]
 */

import { spawn } from 'node:child_process';
import { readFile, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const HERE = dirname(fileURLToPath(import.meta.url));

const { values: args } = parseArgs({
  options: {
    layers: { type: 'string', default: 'source,dist,gtm-live,e2e,live-data' },
    config: { type: 'string', default: './verify.site.json' },
    strict: { type: 'boolean', default: false },
    'base-url': { type: 'string' },
  },
});

function run(cmd, argv, opts = {}) {
  return new Promise((resolve) => {
    // shell:true on Windows: npx is npx.cmd and Node refuses implicit .cmd spawning.
    const child = spawn(cmd, argv, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
    child.on('close', (code) => resolve(code ?? 2));
    child.on('error', (err) => {
      console.error(`  could not start ${cmd}: ${err.message}`);
      resolve(2);
    });
  });
}

async function main() {
  const cfg = existsSync(args.config) ? JSON.parse(await readFile(args.config, 'utf8')) : {};
  const layers = args.layers.split(',').map((s) => s.trim());
  const eventsFile = join(HERE, '.events-found.json');
  /** @type {Array<{layer: string, outcome: 'PASS'|'FAIL'|'SKIP'|'ERROR'}>} */
  const results = [];
  const record = (layer, code) => {
    results.push({ layer, outcome: code === 0 ? 'PASS' : code === 3 ? 'SKIP' : code === 1 ? 'FAIL' : 'ERROR' });
  };

  for (const layer of layers) {
    console.log(`\n━━━ layer: ${layer} ${'━'.repeat(Math.max(0, 58 - layer.length))}`);
    switch (layer) {
      case 'source': {
        const code = await run('node', [
          join(HERE, 'verify-source.mjs'),
          '--src', cfg.src ?? './src',
          ...(cfg.mpFn ? ['--mp-fn', cfg.mpFn] : []),
          '--emit-events', eventsFile,
        ]);
        record(layer, code);
        break;
      }
      case 'dist': {
        const code = await run('node', [
          join(HERE, 'verify-dist.mjs'),
          '--dist', cfg.dist ?? './dist/client',
          '--manifest', args.config,
          ...(args['base-url'] ? ['--base-url', args['base-url']] : []),
        ]);
        record(layer, code);
        break;
      }
      case 'gtm-live': {
        const code = await run('node', [
          join(HERE, 'verify-gtm-live.mjs'),
          '--events', eventsFile,
          ...(cfg.conversionEvents ? ['--conversion-events', cfg.conversionEvents.join(',')] : []),
          ...(cfg.gtmSnapshot ? ['--snapshot', cfg.gtmSnapshot] : []),
          ...(cfg.committedGtm ? ['--committed', cfg.committedGtm] : []),
        ]);
        record(layer, code);
        break;
      }
      case 'e2e': {
        const dir = cfg.e2eDir ?? './e2e';
        if (!existsSync(dir)) {
          console.error(`  ⚠ SKIPPED (NOT verified): no e2e dir at ${dir} — the network-truth layer did not run.`);
          record(layer, 3);
          break;
        }
        // Capability skips inside the factory write to this file so a green
        // Playwright exit with unverified network claims records as SKIP,
        // never PASS.
        const skipFile = join(HERE, '.e2e-skips.txt');
        await rm(skipFile, { force: true });
        const code = await run('npx', ['playwright', 'test', '--config', dir], {
          env: {
            ...process.env,
            VERIFY_SKIP_FILE: skipFile,
            ...(args['base-url'] ? { VERIFY_BASE_URL: args['base-url'] } : {}),
            ...(args.strict ? { VERIFY_STRICT: '1' } : {}),
          },
        });
        let hadSkips = false;
        try { hadSkips = (await stat(skipFile)).size > 0; } catch { /* no skips */ }
        if (code === 0 && hadSkips) {
          console.error('  ⚠ e2e passed its runnable assertions but capability-skipped network-level claims — recording SKIP, not PASS (see lines above).');
          record(layer, 3);
        } else {
          record(layer, code === 0 ? 0 : 1);
        }
        break;
      }
      case 'live-data': {
        const code = await run('node', [
          join(HERE, 'verify-live-data.mjs'),
          '--key-events', (cfg.keyEvents ?? cfg.conversionEvents ?? []).join(','),
          ...(cfg.liveData?.days ? ['--days', String(cfg.liveData.days)] : []),
          ...(cfg.liveData?.maxUnassigned ? ['--max-unassigned', String(cfg.liveData.maxUnassigned)] : []),
        ]);
        record(layer, code);
        break;
      }
      default:
        console.error(`  unknown layer: ${layer}`);
        record(layer, 2);
    }
  }

  console.log('\n━━━ verification summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const r of results) {
    const mark = r.outcome === 'PASS' ? '✅' : r.outcome === 'SKIP' ? '⚠️ ' : '❌';
    console.log(`  ${mark} ${r.layer.padEnd(10)} ${r.outcome}`);
  }
  const failed = results.filter((r) => r.outcome === 'FAIL' || r.outcome === 'ERROR');
  const skipped = results.filter((r) => r.outcome === 'SKIP');
  if (skipped.length > 0) {
    console.log(
      `\n  ${skipped.length} layer(s) SKIPPED — those claims are NOT verified.` +
      (args.strict ? ' (--strict: treating as failure)' : ' Run with creds/build/browser to close them, or --strict to fail on skips.'),
    );
  }
  const exit = failed.length > 0 || (args.strict && skipped.length > 0) ? 1 : 0;
  console.log(`\nverify: ${exit === 0 ? 'PASS' : 'FAIL'}`);
  process.exit(exit);
}

main().catch((err) => {
  console.error(`FATAL: ${err.stack || err}`);
  process.exit(2);
});
