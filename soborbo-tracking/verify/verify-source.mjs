#!/usr/bin/env node
// @ts-check
/**
 * LAYER: source — call-site invariants the type system can't express.
 *
 * These are grep/heuristic rules, deliberately: they run in <1s with zero
 * dependencies, and every one of them encodes a bug that shipped to
 * production and cost real conversions. False positives are silenced with an
 * explicit `// verify-allow: <rule>` comment on the SAME or PREVIOUS line —
 * the allowance is visible in review, which is the point.
 *
 * Rules:
 *   value-zero        — `value: 0` in a tracking push/dispatch. The gateway
 *                       strips zero values, so browser+server desync and Ads
 *                       ingests £0 conversions.
 *   nav-after-track   — `window.location.href = ...` (or .assign) within a
 *                       few lines after `trackEvent(`. Synchronous navigation
 *                       cancels GTM's pixel requests mid-flight — the bug that
 *                       zeroed "Callback requested" for months. Navigation
 *                       after a conversion must go through the navigation-safe
 *                       helper (eventCallback + safety timeout).
 *   mp-session-stitch — a call to the GA4 MP sender (default: `sendGA4MP(`)
 *                       whose call-site does not mention `sessionId`. An MP
 *                       hit without session stitching lands as Unassigned /
 *                       "(not set)" and never matches a gclid.
 *   pii-in-push       — a dataLayer/trackEvent object literal carrying a key
 *                       from the PII set. Defense-in-depth: the runtime strip
 *                       exists, but the push shouldn't be written at all.
 *
 * Usage:
 *   node verify/verify-source.mjs --src ./src \
 *     [--mp-fn sendGA4MP] [--emit-events ./events-found.json]
 *
 * `--emit-events` writes the list of dataLayer event names found in the
 * source — consumed by verify-gtm-live.mjs so the two layers share one
 * extraction.
 */

import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    src: { type: 'string', default: './src' },
    'mp-fn': { type: 'string', default: 'sendGA4MP' },
    'emit-events': { type: 'string' },
    'nav-window': { type: 'string', default: '12' },
  },
});

const SRC_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.astro'];
const PII_KEYS = [
  'user_data', 'user_email', 'user_phone', 'email', 'phone', 'phone_number',
  'first_name', 'last_name', 'name', 'street', 'city', 'postal_code', 'postcode',
  'em', 'ph', 'fn', 'ln',
];
const EVENT_NAME_RE = /\b(?:trackEvent|trackEventBeforeNavigate)\(\s*['"]([A-Za-z0-9_.]+)['"]/g;
const DL_PUSH_EVENT_RE = /dataLayer\.push\(\s*\{[^}]*?\bevent:\s*['"]([A-Za-z0-9_.]+)['"]/gs;
// Events routed through a variable (`eventName = 'email_conversion'; ...
// trackEvent(eventName, ...)`) — the literal is at the assignment site.
const EVENT_VAR_RE = /\beventName\s*=\s*['"]([A-Za-z0-9_.]+)['"]/g;

function allowed(lines, i, rule) {
  const re = new RegExp(`verify-allow:\\s*${rule}\\b`);
  return re.test(lines[i] ?? '') || re.test(lines[i - 1] ?? '');
}

async function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of await readdir(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const full = join(dir, name);
    const st = await stat(full);
    if (st.isDirectory()) out.push(...(await walk(full)));
    else if (SRC_EXTENSIONS.includes(extname(name)) && !/\.(test|spec)\./.test(name)) out.push(full);
  }
  return out;
}

/** The code portion of a line: comment-only lines -> '', trailing `//` text stripped.
 *  The rules must never fire on prose ABOUT the rules — the first real-world run
 *  flagged five comments that explain why value:0 is forbidden.
 *  Quote-aware: `//` inside a string literal ('https://…') is NOT a comment —
 *  a naive indexOf('//') made `const u = 'https://x'; window.location.href = u`
 *  entirely invisible to nav-after-track. */
function codeOf(line) {
  const t = line.trimStart();
  if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return '';
  let quote = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
    } else if (c === "'" || c === '"' || c === '`') {
      quote = c;
    } else if (c === '/' && line[i + 1] === '/') {
      return line.slice(0, i);
    }
  }
  return line;
}

function checkFile(file, text, failures, events) {
  const lines = text.split('\n');
  const navWindow = Number(args['nav-window']);

  for (let i = 0; i < lines.length; i++) {
    const line = codeOf(lines[i]);

    // value-zero — only inside tracking-ish calls (heuristic: the line or the
    // enclosing few lines mention track/dispatch/dataLayer/conversion).
    // `0.0`/`0.00` are the same bug as `0`; `0.5` is a real value.
    if (/\bvalue:\s*0(?:\.0+)?(?![.\d])/.test(line) && !allowed(lines, i, 'value-zero')) {
      const ctx = lines.slice(Math.max(0, i - 6), i + 2).join('\n');
      if (/track|dispatch|dataLayer|conversion|fbq/i.test(ctx)) {
        failures.push(`${file}:${i + 1} [value-zero] literal \`value: 0\` in a tracking payload — the gateway strips zeros; browser/server desync + £0 into Ads`);
      }
    }

    // nav-after-track — trackEvent( … followed by a synchronous location change.
    // Covers href=/assign()/replace(), INCLUDING nav on the same line as the
    // call (one-line JSX handlers) — the j=i pass scans the text after the
    // trackEvent( occurrence only.
    if (/\btrackEvent\(/.test(line) && !/trackEventBeforeNavigate/.test(line)) {
      for (let j = i; j <= Math.min(lines.length - 1, i + navWindow); j++) {
        const codeJ = j === i ? line.slice(line.indexOf('trackEvent(')) : codeOf(lines[j]);
        if (codeJ === '') continue;
        if (/window\.location\.(href\s*=|assign\(|replace\()/.test(codeJ)) {
          // tel:/mailto: assignments open the dialer/mail app WITHOUT
          // unloading the page — the pixel requests survive. Not a race.
          if (/tel:|mailto:/.test(codeJ)) break;
          if (!allowed(lines, j, 'nav-after-track') && !allowed(lines, i, 'nav-after-track')) {
            failures.push(`${file}:${j + 1} [nav-after-track] synchronous navigation ${navWindow} lines after trackEvent() at line ${i + 1} — cancels the pixel requests; use the navigation-safe helper (eventCallback + timeout)`);
          }
          break;
        }
        // A navigation-safe call in between clears the suspicion.
        if (/trackEventBeforeNavigate\(|eventCallback/.test(codeJ)) break;
      }
    }

    // mp-session-stitch — the MP sender call-site must mention sessionId.
    const mpFn = args['mp-fn'];
    if (mpFn && new RegExp(`\\b${mpFn}\\(`).test(line) && !allowed(lines, i, 'mp-session-stitch')) {
      // Take up to the end of the call: crude but effective — look within 25
      // lines. Comment-stripped: a `// TODO: wire sessionId` comment in the
      // window must NOT satisfy the rule.
      const callCtx = lines.slice(i, Math.min(lines.length, i + 25)).map(codeOf).join('\n');
      if (!/sessionId/.test(callCtx)) {
        failures.push(`${file}:${i + 1} [mp-session-stitch] ${mpFn}() call without a sessionId in the call-site — the MP hit lands Unassigned and never matches a gclid`);
      }
    }
  }

  // pii-in-push — inspect object literals passed to trackEvent / dataLayer.push.
  // Body capture runs to the `}` that closes the CALL (`}` + `)`), not the
  // first `}` — a nested object (`{ meta: { a: 1 }, email: e }`) must not
  // truncate the scan before the PII key.
  for (const re of [/\b(?:trackEvent|trackEventBeforeNavigate)\(\s*['"][^'"]+['"]\s*,\s*\{([\s\S]*?)\}\s*\)/g, /dataLayer\.push\(\s*\{([\s\S]*?)\}\s*\)/g]) {
    for (const m of text.matchAll(re)) {
      const body = m[1];
      for (const key of PII_KEYS) {
        // Key positions only (after `{`, `,` or start) — not values, so
        // `{ label: name }` doesn't fire. Shorthand (`{ email }`) counts:
        // the key IS the PII name, and the runtime guard strips it too.
        if (new RegExp(`(?:^|[{,])\\s*${key}\\s*(?=[:,}]|$)`).test(body)) {
          const lineNo = text.slice(0, m.index).split('\n').length;
          if (!allowed(text.split('\n'), lineNo - 1, 'pii-in-push')) {
            failures.push(`${file}:${lineNo} [pii-in-push] PII-shaped key \`${key}\` in a tracking push — PII belongs on the hidden side-channel, never the dataLayer`);
          }
        }
      }
    }
  }

  // Event vocabulary extraction (for verify-gtm-live).
  for (const re of [EVENT_NAME_RE, DL_PUSH_EVENT_RE, EVENT_VAR_RE]) {
    for (const m of text.matchAll(re)) events.add(m[1]);
  }
}

async function main() {
  const failures = [];
  const events = new Set();
  const files = await walk(args.src);
  if (files.length === 0) {
    console.error(`FATAL: no source files under ${args.src}`);
    process.exit(2);
  }
  for (const file of files) {
    checkFile(file, await readFile(file, 'utf8'), failures, events);
  }

  if (args['emit-events']) {
    const list = [...events].filter((e) => !e.startsWith('gtm.')).sort();
    await writeFile(args['emit-events'], JSON.stringify(list, null, 2));
    console.log(`  emitted ${list.length} event name(s) -> ${args['emit-events']}`);
  }

  for (const f of failures) console.error(`  FAIL  ${f}`);
  console.log(`\nverify-source: ${files.length} file(s), ${failures.length} failure(s)`);
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`FATAL: ${err.stack || err}`);
  process.exit(2);
});
