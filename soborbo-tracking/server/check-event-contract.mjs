#!/usr/bin/env node
// @ts-check
/**
 * Asserts that the browser event vocabulary is in sync between the source code,
 * the canonical docs, and the committed GTM container — for soborbo-tracking v5.
 *
 * The runtime truth is the CODE: events.ts (and components) emit dataLayer events
 * via `push({ event: 'X', ... })`. This check anchors on those and verifies:
 *
 *   1. Every emitted browser event is documented in docs/CANONICAL-EVENTS.md.
 *   2. Every emitted browser event has a `CE - X` (CUSTOM_EVENT) trigger in the
 *      GTM container.
 *   3. Every such trigger fires at least one non-paused tag.
 *   4. (warning) GTM CUSTOM_EVENT triggers that no code path emits — possible
 *      dead trigger / drift the other way.
 *
 * Gateway `event_name` values (phone_conversion, contact_form_submit, …) are the
 * SERVER vocabulary and are covered by tests/canonical-events.test.ts; this script
 * is about the BROWSER dataLayer ↔ GTM ↔ docs contract.
 *
 * Failures print a short diff to stderr and exit non-zero. Wire into CI — drift
 * here is invisible at runtime and is a common way tracking silently breaks.
 *
 * It ALSO guards the vendored gateway contract:
 *
 *   5. `events.json` (the vendored copy of Serverside/src/events.json) must be
 *      post-Run-6: it must carry `server_ingress_only` flags. A re-vendor from an
 *      old engine checkout fails loudly here instead of silently reopening the
 *      browser path for form conversions.
 *   6. With `--engine <path-to-Serverside/src/events.json>`: byte-level JSON
 *      equality between the vendored copy and the engine's source of truth.
 *      Run it whenever the Serverside repo is checked out next to this one.
 *
 * Usage (defaults shown):
 *   node server/check-event-contract.mjs \
 *     --src ./lib,./components \
 *     --events ./docs/CANONICAL-EVENTS.md \
 *     --gtm ./gtm/container.json \
 *     [--engine ../Serverside/src/events.json]
 *
 * `--gtm` is optional; when the file is missing, checks (2)–(4) are skipped.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const { values: args } = parseArgs({
  options: {
    src: { type: 'string', default: './lib,./components' },
    events: { type: 'string', default: './docs/CANONICAL-EVENTS.md' },
    gtm: { type: 'string', default: './gtm/container.json' },
    engine: { type: 'string' },
  },
});

const VENDORED_EVENTS_PATH = fileURLToPath(new URL('../events.json', import.meta.url));

const SRC_EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.astro'];
// dataLayer pushes: `push({ event: 'X' ... })` or `dataLayer.push({ event: 'X' ... })`.
const EVENT_KEY_RE = /\bevent:\s*['"]([A-Za-z0-9_.]+)['"]/g;
// GTM bootstrap events that are not tracking events.
const IGNORE_EVENTS = new Set(['gtm.js', 'gtm.dom', 'gtm.load', 'gtm.start']);
// Inline-code spans on markdown list items / table rows (the documented names).
const MD_LINE_RE = /^(?:[-*]\s+|\|).*$/gm;
const INLINE_CODE_RE = /`([A-Za-z0-9_]+)`/g;

async function walk(dir, exts) {
  /** @type {string[]} */
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of await readdir(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const path = join(dir, name);
    const st = await stat(path);
    if (st.isDirectory()) out.push(...(await walk(path, exts)));
    else if (exts.includes(extname(name))) out.push(path);
  }
  return out;
}

async function eventsInCode(srcDirs) {
  /** @type {Map<string, string[]>} event -> call sites */
  const found = new Map();
  for (const dir of srcDirs) {
    for (const f of await walk(dir, SRC_EXTENSIONS)) {
      const lines = (await readFile(f, 'utf8')).split('\n');
      lines.forEach((line, i) => {
        EVENT_KEY_RE.lastIndex = 0;
        let m;
        while ((m = EVENT_KEY_RE.exec(line))) {
          const e = m[1];
          if (IGNORE_EVENTS.has(e) || e.includes('.')) continue;
          if (!found.has(e)) found.set(e, []);
          /** @type {string[]} */ (found.get(e)).push(`${f}:${i + 1}`);
        }
      });
    }
  }
  return found;
}

async function eventsInDoc(eventsMdPath) {
  const text = await readFile(eventsMdPath, 'utf8');
  /** @type {Set<string>} */
  const out = new Set();
  MD_LINE_RE.lastIndex = 0;
  let line;
  while ((line = MD_LINE_RE.exec(text))) {
    INLINE_CODE_RE.lastIndex = 0;
    let m;
    while ((m = INLINE_CODE_RE.exec(line[0]))) out.add(m[1]);
  }
  return out;
}

async function gtmAnalysis(gtmPath) {
  const json = JSON.parse(await readFile(gtmPath, 'utf8'));
  const cv = json.containerVersion ?? json;
  const triggers = cv.trigger ?? [];
  const tags = cv.tag ?? [];

  /** @type {Map<string, string>} triggerId -> event name */
  const eventByTrigger = new Map();
  for (const t of triggers) {
    if (t.type !== 'CUSTOM_EVENT') continue;
    for (const f of t.customEventFilter ?? []) {
      const ps = Object.fromEntries((f.parameter ?? []).map((p) => [p.key, p.value]));
      if (ps.arg0 === '{{_event}}' && ps.arg1) eventByTrigger.set(String(t.triggerId), ps.arg1);
    }
  }

  /** @type {Map<string, number>} triggerId -> non-paused tag count */
  const activeTagsByTrigger = new Map();
  for (const tag of tags) {
    if (tag.paused) continue;
    for (const trId of tag.firingTriggerId ?? []) {
      const k = String(trId);
      activeTagsByTrigger.set(k, (activeTagsByTrigger.get(k) ?? 0) + 1);
    }
  }
  return { eventByTrigger, activeTagsByTrigger };
}

async function main() {
  const srcDirs = args.src.split(',').map((s) => s.trim()).filter(Boolean);
  const codeEvents = await eventsInCode(srcDirs);
  const docEvents = await eventsInDoc(args.events);

  const gtmExists = existsSync(args.gtm);
  /** @type {Map<string, {triggerId: string, activeTagCount: number}[]>} */
  const gtmEvents = new Map();
  if (gtmExists) {
    const { eventByTrigger, activeTagsByTrigger } = await gtmAnalysis(args.gtm);
    for (const [trId, name] of eventByTrigger) {
      if (!gtmEvents.has(name)) gtmEvents.set(name, []);
      /** @type {{triggerId: string, activeTagCount: number}[]} */ (gtmEvents.get(name)).push({
        triggerId: trId, activeTagCount: activeTagsByTrigger.get(trId) ?? 0,
      });
    }
  } else {
    console.warn(`! GTM container not found at ${args.gtm} — skipping checks (2)–(4).`);
  }

  const errors = [];
  const warnings = [];

  // 5. Vendored events.json sanity: must be the post-Run-6 shape.
  let vendored = null;
  try {
    vendored = JSON.parse(await readFile(VENDORED_EVENTS_PATH, 'utf8'));
    const ingressOnly = vendored.filter((e) => e.server_ingress_only === true).map((e) => e.name);
    if (ingressOnly.length === 0) {
      errors.push(
        '[events.json]  no event carries server_ingress_only:true — the vendored copy predates Run 6. Re-vendor from Serverside/src/events.json.'
      );
    }
  } catch (e) {
    errors.push(`[events.json]  cannot read/parse vendored events.json: ${e.message}`);
  }

  // 6. Optional engine-drift check: vendored copy ≡ engine source of truth.
  if (args.engine) {
    try {
      const engine = JSON.parse(await readFile(args.engine, 'utf8'));
      if (JSON.stringify(engine) !== JSON.stringify(vendored)) {
        errors.push(
          `[engine drift] vendored events.json differs from ${args.engine} — re-vendor (cp) it; the engine is the source of truth.`
        );
      }
    } catch (e) {
      errors.push(`[engine drift] cannot read/parse ${args.engine}: ${e.message}`);
    }
  }

  // 1. code → docs
  for (const [event, sites] of codeEvents) {
    if (!docEvents.has(event)) {
      const extra = sites.length > 1 ? ` (and ${sites.length - 1} more)` : '';
      errors.push(`[code → docs]  '${event}' emitted from ${sites[0]}${extra} — not in CANONICAL-EVENTS.md`);
    }
  }

  if (gtmExists) {
    // 2. code → GTM trigger
    for (const [event, sites] of codeEvents) {
      if (!gtmEvents.has(event)) {
        errors.push(`[code → gtm]   '${event}' (${sites[0]}) has no CUSTOM_EVENT trigger in the GTM container`);
      }
    }
    // 3. GTM trigger → at least one active tag
    for (const [event, triggers] of gtmEvents) {
      const totalActive = triggers.reduce((s, t) => s + t.activeTagCount, 0);
      if (totalActive === 0) {
        errors.push(`[gtm orphan]   trigger for '${event}' (id ${triggers.map((t) => t.triggerId).join(',')}) fires no active tags`);
      }
    }
    // 4. GTM trigger with no code emitter (warning only)
    for (const event of gtmEvents.keys()) {
      if (!codeEvents.has(event)) {
        warnings.push(`[gtm → code]   GTM has a '${event}' trigger but no code path emits it (dead trigger?)`);
      }
    }
  }

  for (const w of warnings) console.warn(`  ! ${w}`);

  if (errors.length === 0) {
    const gtmPart = gtmExists ? `, ${gtmEvents.size} GTM triggers` : '';
    console.log(`✓ Event contract OK — ${codeEvents.size} browser events in code, ${docEvents.size} doc names${gtmPart}`);
    process.exit(0);
  }
  console.error(`✗ Event contract drift (${errors.length} issue${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

main().catch((err) => {
  console.error('check-event-contract failed:', err);
  process.exit(2);
});
