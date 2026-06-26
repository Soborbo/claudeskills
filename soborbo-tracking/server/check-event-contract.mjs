#!/usr/bin/env node
// @ts-check
/**
 * Asserts that the tracking-kit's event vocabulary is in sync between
 * source code and GTM container.
 *
 * Three checks:
 *   1. Every `trackEvent('X', ...)` call site in the source tree has an
 *      entry in EVENTS.md.
 *   2. Every event listed in EVENTS.md has a `CE - X` (custom-event)
 *      trigger in the committed GTM container JSON.
 *   3. Every such trigger fires at least one non-paused tag.
 *
 * Failures print a short diff to stderr and exit non-zero. Wire this into
 * your CI before merge — drift here is invisible at runtime and is the
 * single most common way this kit fails in production.
 *
 * EVENTS.md format expected: events listed as markdown list items or
 * table rows whose first inline-code span is the event name. E.g.:
 *
 *     - `primary_conversion` — Lead, fires on phone-click upgrade. …
 *     | `phone_conversion`        | tel: click | GA4 + Meta `Contact` |
 *
 * Usage:
 *   node scripts/check-event-contract.mjs \
 *     --src ./src \
 *     --events ./EVENTS.md \
 *     --gtm ./gtm/container.json
 *
 * The `--gtm` argument is optional. When omitted (or the file is
 * missing), the GTM-side checks (2) and (3) are skipped with a notice —
 * useful for repos that don't commit the container yet. INVARIANTS.md
 * requires committing it; ship the file as soon as you have one.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    src: { type: 'string', default: './src' },
    events: { type: 'string', default: './EVENTS.md' },
    gtm: { type: 'string', default: './gtm/container.json' },
  },
});

const SRC_EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.astro'];
const TRACK_CALL_RE = /\btrackEvent\(\s*['"]([a-zA-Z0-9_]+)['"]/g;
/** Inline-code span on any markdown list item or table row. Captures
 *  every event-shaped identifier on a line, so multi-event rows like
 *  "| `scroll_50`, `scroll_90` | ... |" enumerate both. The leading
 *  anchor guards against picking up arbitrary code spans in prose. */
const EVENTS_MD_LINE_RE = /^(?:[-*]\s+|\|).*$/gm;
const INLINE_CODE_RE = /`([a-zA-Z0-9_]+)`/g;

async function walk(dir, exts) {
  /** @type {string[]} */
  const out = [];
  for (const name of await readdir(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const path = join(dir, name);
    const st = await stat(path);
    if (st.isDirectory()) {
      out.push(...(await walk(path, exts)));
    } else if (exts.includes(extname(name))) {
      out.push(path);
    }
  }
  return out;
}

async function eventsInCode(srcDir) {
  const files = await walk(srcDir, SRC_EXTENSIONS);
  /** @type {Map<string, string[]>} */
  const found = new Map();
  for (const f of files) {
    const text = await readFile(f, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      TRACK_CALL_RE.lastIndex = 0;
      let m;
      while ((m = TRACK_CALL_RE.exec(line))) {
        const e = m[1];
        if (!found.has(e)) found.set(e, []);
        /** @type {string[]} */ (found.get(e)).push(`${f}:${i + 1}`);
      }
    });
  }
  return found;
}

async function eventsInDoc(eventsMdPath) {
  const text = await readFile(eventsMdPath, 'utf8');
  /** @type {Set<string>} */
  const out = new Set();
  EVENTS_MD_LINE_RE.lastIndex = 0;
  let line;
  while ((line = EVENTS_MD_LINE_RE.exec(text))) {
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
      if (ps.arg0 === '{{_event}}' && ps.arg1) {
        eventByTrigger.set(String(t.triggerId), ps.arg1);
      }
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
  const codeEvents = await eventsInCode(args.src);
  const docEvents = await eventsInDoc(args.events);

  const gtmExists = existsSync(args.gtm);
  /** @type {Map<string, Array<{triggerId: string, activeTagCount: number}>>} */
  const gtmEvents = new Map();
  if (gtmExists) {
    const { eventByTrigger, activeTagsByTrigger } = await gtmAnalysis(args.gtm);
    for (const [trId, name] of eventByTrigger) {
      if (!gtmEvents.has(name)) gtmEvents.set(name, []);
      /** @type {Array<{triggerId: string, activeTagCount: number}>} */ (gtmEvents.get(name)).push({
        triggerId: trId,
        activeTagCount: activeTagsByTrigger.get(trId) ?? 0,
      });
    }
  } else {
    console.warn(
      `! GTM container not found at ${args.gtm} — skipping checks (2) and (3). ` +
        `Commit the container as required by INVARIANTS.md to enable them.`,
    );
  }

  const errors = [];

  // 1. Code → EVENTS.md
  for (const [event, sites] of codeEvents) {
    if (!docEvents.has(event)) {
      const extra = sites.length > 1 ? ` (and ${sites.length - 1} more)` : '';
      errors.push(
        `[code → docs]  '${event}' emitted from ${sites[0]}${extra} — not in EVENTS.md`,
      );
    }
  }

  if (gtmExists) {
    // 2. EVENTS.md → GTM trigger
    for (const event of docEvents) {
      if (!gtmEvents.has(event)) {
        errors.push(
          `[docs → gtm]   EVENTS.md lists '${event}' — no CUSTOM_EVENT trigger in GTM container`,
        );
      }
    }

    // 3. GTM trigger → at least one active tag
    for (const [event, triggers] of gtmEvents) {
      const totalActive = triggers.reduce((s, t) => s + t.activeTagCount, 0);
      if (totalActive === 0) {
        const ids = triggers.map((t) => t.triggerId).join(',');
        errors.push(
          `[gtm orphan]   trigger for '${event}' (id ${ids}) fires no active tags`,
        );
      }
    }
  }

  if (errors.length === 0) {
    const gtmPart = gtmExists ? `, ${gtmEvents.size} in GTM` : '';
    console.log(
      `✓ Event contract OK — ${codeEvents.size} in code, ${docEvents.size} in EVENTS.md${gtmPart}`,
    );
    process.exit(0);
  }
  console.error(
    `✗ Event contract drift (${errors.length} issue${errors.length === 1 ? '' : 's'}):\n`,
  );
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

main().catch((err) => {
  console.error('check-event-contract failed:', err);
  process.exit(2);
});
