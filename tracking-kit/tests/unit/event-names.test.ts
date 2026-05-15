/**
 * Cross-contract check between the three places event names live:
 *
 *   1. CODE       — `trackEvent('name', …)` call sites in src/, plus the
 *                   dynamic names assigned in `global-listeners.ts`.
 *   2. META MAP   — `META_EVENT_NAMES` in src/lib/tracking/config.ts.
 *                   Its KEYS are internal event names; its VALUES are
 *                   the Meta-side event names the CAPI route forwards.
 *   3. ROUTES     — `ALLOWED_EVENTS` Set in both API route templates.
 *                   The CAPI route rejects anything not in this set.
 *   4. DOCS       — the default-taxonomy table in EVENTS.md.
 *
 * A rename in one of these without the others is a silent break:
 *   - Drop an internal name from META_EVENT_NAMES → client mirror
 *     silently no-ops for that event (lost CAPI attribution).
 *   - Drop a Meta name from ALLOWED_EVENTS → route rejects the mirror
 *     with 400 even though the client was about to send it.
 *   - Forget to add a new event to EVENTS.md → integrators wire up GTM
 *     against an undocumented name and the kit drifts from its docs.
 *
 * This test pins all four against each other.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { META_EVENT_NAMES } from '../../src/lib/tracking/config';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

/** Every internal event name passed to `trackEvent('literal', …)` in
 *  src/. Dynamic dispatches (`trackEvent(eventName, …)`) are picked up
 *  by the dedicated regex below. */
function extractLiteralTrackEventNames(): Set<string> {
  const files = [
    'src/lib/tracking/conversion-state.ts',
    'src/lib/tracking/form-tracking.ts',
    'src/lib/tracking/global-listeners.ts',
    'src/examples/form-success-handler.ts',
  ];
  const out = new Set<string>();
  const re = /trackEvent\(\s*['"]([a-z0-9_]+)['"]/g;
  for (const f of files) {
    const text = read(f);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      out.add(m[1]);
    }
  }
  return out;
}

/** Dynamic event names emitted by global-listeners.ts (where the name
 *  comes from a variable rather than a literal argument). */
function extractDynamicListenerNames(): Set<string> {
  const text = read('src/lib/tracking/global-listeners.ts');
  const out = new Set<string>();
  const re = /eventName\s*=\s*['"]([a-z0-9_]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.add(m[1]);
  }
  return out;
}

/** Meta event names whitelisted by an API route's `ALLOWED_EVENTS` Set. */
function extractAllowedEvents(routeFile: string): Set<string> {
  const text = read(routeFile);
  const block = text.match(/ALLOWED_EVENTS\s*=\s*new Set[^[]*\[([^\]]+)\]/);
  if (!block) throw new Error(`Could not locate ALLOWED_EVENTS in ${routeFile}`);
  const out = new Set<string>();
  for (const m of block[1].matchAll(/['"]([A-Za-z][A-Za-z0-9]+)['"]/g)) {
    out.add(m[1]);
  }
  return out;
}

/** Pulls event names out of the DEFAULT-taxonomy table in EVENTS.md.
 *  The alternative-funnel sections (e-commerce, SaaS, content site) are
 *  illustrative examples of how to adapt the kit, not the kit's own
 *  contract — so we only scan from `## The default taxonomy` up to the
 *  next `##` header. */
function extractEventsFromDocs(): Set<string> {
  const text = read('EVENTS.md');
  const start = text.indexOf('## The default taxonomy');
  if (start < 0) throw new Error('EVENTS.md is missing "## The default taxonomy" section');
  const rest = text.slice(start + '## The default taxonomy'.length);
  const end = rest.indexOf('\n## ');
  const section = end < 0 ? rest : rest.slice(0, end);

  const out = new Set<string>();
  for (const line of section.split('\n')) {
    if (!line.startsWith('|')) continue;
    if (line.includes('| Event |') || line.startsWith('| ---')) continue;
    const m = line.match(/^\|\s*`([a-z0-9_,\s`]+)`/);
    if (!m) continue;
    // A single cell may list comma-separated events (`scroll_50`, `scroll_90`).
    for (const piece of m[1].split(/[,`]/)) {
      const name = piece.trim();
      if (/^[a-z][a-z0-9_]+$/.test(name)) out.add(name);
    }
  }
  return out;
}

const LITERAL_TRACK_EVENTS = extractLiteralTrackEventNames();
const DYNAMIC_TRACK_EVENTS = extractDynamicListenerNames();
const EMITTED_IN_CODE = new Set([...LITERAL_TRACK_EVENTS, ...DYNAMIC_TRACK_EVENTS]);

const META_KEYS = new Set(Object.keys(META_EVENT_NAMES));
const META_VALUES = new Set(Object.values(META_EVENT_NAMES));

const NEXT_ALLOWED = extractAllowedEvents('src/api/nextjs/meta-capi.route.ts');
const ASTRO_ALLOWED = extractAllowedEvents('src/api/astro/meta-capi.ts');

const DOCS_EVENTS = extractEventsFromDocs();

describe('META_EVENT_NAMES <-> route ALLOWED_EVENTS', () => {
  it('every Meta event in META_EVENT_NAMES is whitelisted by the Next.js route', () => {
    for (const meta of META_VALUES) {
      expect(NEXT_ALLOWED, `Next.js route ALLOWED_EVENTS missing "${meta}"`).toContain(meta);
    }
  });

  it('every Meta event in META_EVENT_NAMES is whitelisted by the Astro route', () => {
    for (const meta of META_VALUES) {
      expect(ASTRO_ALLOWED, `Astro route ALLOWED_EVENTS missing "${meta}"`).toContain(meta);
    }
  });

  it('Next.js and Astro routes whitelist the exact same set of Meta events', () => {
    expect([...NEXT_ALLOWED].sort()).toEqual([...ASTRO_ALLOWED].sort());
  });

  it('no orphan Meta names in ALLOWED_EVENTS (every whitelisted name has a code path)', () => {
    for (const meta of NEXT_ALLOWED) {
      expect(META_VALUES, `ALLOWED_EVENTS contains "${meta}" but no entry in META_EVENT_NAMES maps to it — dead whitelist`).toContain(meta);
    }
  });
});

describe('META_EVENT_NAMES <-> code (internal names that mirror to Meta)', () => {
  it('every conversion-shaped emitted name is registered in META_EVENT_NAMES', () => {
    // Events whose name ends in `_conversion` or `_first_view` are
    // expected to mirror to Meta. If they aren't in the map, the
    // client mirror silently no-ops and we lose CAPI attribution.
    const shouldMirror = [...EMITTED_IN_CODE].filter((n) =>
      /_conversion$|_first_view$/.test(n),
    );
    for (const name of shouldMirror) {
      expect(
        META_KEYS,
        `"${name}" looks like a conversion but META_EVENT_NAMES has no mapping — its Meta mirror will silently no-op`,
      ).toContain(name);
    }
  });

  it('every dynamic listener name in global-listeners.ts is in META_EVENT_NAMES', () => {
    // The upgrade flow in global-listeners.ts calls mirrorMetaCapi()
    // with the literal `eventName` it just assigned. If the map drops
    // one, the upgrade silently stops mirroring.
    for (const name of DYNAMIC_TRACK_EVENTS) {
      expect(META_KEYS).toContain(name);
    }
  });

  it('META_EVENT_NAMES has no keys that are pure GA4-only events', () => {
    // form_start / scroll_50 etc. should NOT be in META_EVENT_NAMES;
    // putting them there would cause mirrorMetaCapi to forward
    // engagement events as Meta conversions.
    const ga4Only = ['form_start', 'form_step_complete', 'form_abandonment', 'scroll_50', 'scroll_90'];
    for (const name of ga4Only) {
      expect(META_KEYS, `"${name}" is GA4-only but appears in META_EVENT_NAMES`).not.toContain(name);
    }
  });
});

describe('EVENTS.md <-> code', () => {
  it('every event documented in EVENTS.md is either emitted in src/ or registered in META_EVENT_NAMES', () => {
    // Some documented events (callback_conversion, primary_first_view,
    // primary_conversion_complete, contact_form_submit) are emitted by
    // the integrator's form-success-handler, not by the kit itself.
    // Either being in META_EVENT_NAMES (mirror contract) or showing up
    // in the example handler is enough evidence the kit knows about it.
    for (const docEvent of DOCS_EVENTS) {
      const knownToCode = EMITTED_IN_CODE.has(docEvent) || META_KEYS.has(docEvent);
      expect(
        knownToCode,
        `EVENTS.md documents "${docEvent}" but no trackEvent('${docEvent}', …) call site AND no META_EVENT_NAMES entry — docs are drifting`,
      ).toBe(true);
    }
  });

  it('every kit-emitted event name is documented in EVENTS.md', () => {
    for (const name of EMITTED_IN_CODE) {
      expect(
        DOCS_EVENTS,
        `"${name}" is emitted by the kit but missing from the EVENTS.md taxonomy table`,
      ).toContain(name);
    }
  });

  it('every internal name in META_EVENT_NAMES is documented in EVENTS.md', () => {
    for (const key of META_KEYS) {
      expect(
        DOCS_EVENTS,
        `META_EVENT_NAMES maps "${key}" → "${META_EVENT_NAMES[key]}" but EVENTS.md does not list it`,
      ).toContain(key);
    }
  });
});

describe('snake_case convention (per EVENTS.md naming rules)', () => {
  it.each([...EMITTED_IN_CODE])('emitted event "%s" is snake_case', (name) => {
    expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
  });

  it.each([...META_KEYS])('META_EVENT_NAMES key "%s" is snake_case', (key) => {
    expect(key).toMatch(/^[a-z][a-z0-9_]*$/);
  });
});

describe('debug surface (helps when this suite fails)', () => {
  it('summarises the inputs to the contract checks', () => {
    const summary = {
      emittedInCode: [...EMITTED_IN_CODE].sort(),
      metaMapKeys: [...META_KEYS].sort(),
      metaMapValues: [...META_VALUES].sort(),
      nextAllowed: [...NEXT_ALLOWED].sort(),
      astroAllowed: [...ASTRO_ALLOWED].sort(),
      docsEvents: [...DOCS_EVENTS].sort(),
    };
    // Sanity: each list has at least one entry. If any is empty, an
    // extractor regex broke and every other assertion in this file is
    // vacuous — fail loud.
    expect(summary.emittedInCode.length).toBeGreaterThan(0);
    expect(summary.metaMapKeys.length).toBeGreaterThan(0);
    expect(summary.metaMapValues.length).toBeGreaterThan(0);
    expect(summary.nextAllowed.length).toBeGreaterThan(0);
    expect(summary.astroAllowed.length).toBeGreaterThan(0);
    expect(summary.docsEvents.length).toBeGreaterThan(0);
  });
});
