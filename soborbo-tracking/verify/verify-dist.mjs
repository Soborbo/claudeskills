#!/usr/bin/env node
// @ts-check
/**
 * LAYER: dist — built-output invariants.
 *
 * Checks the HTML that actually ships (`dist/`), NOT the source. This is the
 * layer that catches "the component exists but this page doesn't include it"
 * seam bugs — the class that unit tests are structurally blind to. Two of the
 * five historical bug classes lived here:
 *
 *   - /instantquote/your-quote/ (the page that fires the quote conversion)
 *     had no Turnstile script/container because it didn't use the layout the
 *     Turnstile was added to → every server-side Meta CAPI leg was silently
 *     dropped for months.
 *   - A build without GTM_ID in the environment ships every static page with
 *     no GTM at all (the `{gtmId && ...}` guard renders nothing) — invisible
 *     in source review.
 *
 * Invariants (per HTML page in dist):
 *   1. TURNSTILE PAIRING — any page that is "conversion-capable" (has tel:/
 *      mailto:/wa.me links, OR loads a script bundle that dispatches gateway
 *      conversions, OR is force-listed in the manifest) must include BOTH the
 *      challenges.cloudflare.com/turnstile script AND the invisible container
 *      element. Half a pair is worse than none — the dispatcher waits for the
 *      widget and silently drops the event.
 *   2. GTM PRESENT — every page must contain the googletagmanager.com loader
 *      with a non-empty container ID, plus the <noscript> iframe fallback.
 *   3. CONSENT ORDER — the Consent Mode default block must appear BEFORE the
 *      GTM loader in the document (string-position check; the default block
 *      is identified by `('consent', 'default'` or `"consent","default"`).
 *
 * SSR pages don't exist in dist as HTML. List them in the manifest under
 * `ssrPages` with a served base URL (`--base-url`) to fetch and check live,
 * or accept the LOUD skip that is printed when no base URL is given —
 * silence must never look like success.
 *
 * Usage:
 *   node verify/verify-dist.mjs --dist ./dist/client \
 *     [--manifest ./verify.site.json] [--base-url https://preview.example.com]
 *
 * Manifest shape (all optional):
 *   {
 *     "conversionCapablePages": ["/instantquote/", "/contact/"],   // force-require turnstile pair
 *     "turnstileExempt": ["/some/page/"],                          // documented exceptions
 *     "ssrPages": ["/instantquote/your-quote/"],                   // not in dist; fetch via --base-url
 *     "dispatchBundleMarkers": ["cf-turnstile-invisible"]          // extra substrings marking dispatch-capable JS
 *   }
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    dist: { type: 'string', default: './dist/client' },
    manifest: { type: 'string', default: './verify.site.json' },
    'base-url': { type: 'string' },
    verbose: { type: 'boolean', default: false },
  },
});

const TURNSTILE_SCRIPT_RE = /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/;
const TURNSTILE_CONTAINER_RE = /id="cf-turnstile-invisible"/;
// The standard GTM snippet concatenates the container id AT RUNTIME
// (`gtm.js?id='+i`), so the loader URL in the HTML never carries it —
// require the loader AND a GTM-XXXX token anywhere on the page instead.
// (First calibration run failed all 115 pages by expecting the id inline.)
const GTM_LOADER_RE = /googletagmanager\.com\/gtm\.js/;
const GTM_ID_TOKEN_RE = /GTM-[A-Z0-9]{4,}/;
const GTM_NOSCRIPT_RE = /googletagmanager\.com\/ns\.html\?id=GTM-[A-Z0-9]+/;
const CONSENT_DEFAULT_RE = /\(\s*['"]consent['"]\s*,\s*['"]default['"]/;
const TEL_LINK_RE = /href="tel:/;
const MAILTO_LINK_RE = /href="mailto:/;
const WHATSAPP_LINK_RE = /href="https?:\/\/(?:[^"/]*\.)?(?:wa\.me|whatsapp\.com)/;

// The manifest file is shared with run-verify.mjs (verify.site.json does
// double duty), so warn on keys NEITHER consumer knows — a typo like
// `turnstileExampt` would otherwise silently disable an exemption.
const KNOWN_MANIFEST_KEYS = new Set([
  // verify-dist keys
  'conversionCapablePages', 'turnstileExempt', 'ssrPages', 'dispatchBundleMarkers',
  // run-verify keys (ignored here, legitimate in the shared file)
  'src', 'dist', 'mpFn', 'conversionEvents', 'keyEvents', 'gtmSnapshot',
  'committedGtm', 'e2eDir', 'liveData',
]);

async function loadManifest(path) {
  if (!existsSync(path)) return {};
  try {
    const manifest = JSON.parse(await readFile(path, 'utf8'));
    for (const key of Object.keys(manifest)) {
      if (!KNOWN_MANIFEST_KEYS.has(key)) {
        console.error(`  WARN  unknown manifest key \`${key}\` in ${path} — typo? It is silently ignored by every layer.`);
      }
    }
    return manifest;
  } catch (err) {
    console.error(`FATAL: manifest ${path} is not valid JSON: ${err.message}`);
    process.exit(2);
  }
}

async function walkHtml(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    const st = await stat(full);
    if (st.isDirectory()) out.push(...(await walkHtml(full)));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** dist file path -> the URL path it serves (Astro convention: /x/index.html -> /x/). */
function urlPathOf(distRoot, file) {
  let rel = '/' + relative(distRoot, file).split(sep).join('/');
  if (rel.endsWith('/index.html')) rel = rel.slice(0, -'index.html'.length);
  return rel;
}

function isConversionCapable(html, urlPath, manifest) {
  if ((manifest.conversionCapablePages ?? []).includes(urlPath)) return { capable: true, why: 'manifest' };
  if (TEL_LINK_RE.test(html)) return { capable: true, why: 'tel: link' };
  if (MAILTO_LINK_RE.test(html)) return { capable: true, why: 'mailto: link' };
  if (WHATSAPP_LINK_RE.test(html)) return { capable: true, why: 'whatsapp link' };
  for (const marker of manifest.dispatchBundleMarkers ?? []) {
    if (html.includes(marker)) return { capable: true, why: `marker "${marker}"` };
  }
  return { capable: false, why: '' };
}

function checkPage(html, urlPath, manifest, failures, warnings) {
  // 2. GTM present, with a real container id somewhere on the page.
  const gtm = GTM_LOADER_RE.test(html);
  if (!gtm) {
    failures.push(`${urlPath}: GTM loader missing — this page ships untracked`);
  } else if (!GTM_ID_TOKEN_RE.test(html)) {
    failures.push(`${urlPath}: GTM loader present but NO container id token on the page — GTM_ID was empty at build time`);
  } else if (!GTM_NOSCRIPT_RE.test(html)) {
    warnings.push(`${urlPath}: GTM <noscript> iframe fallback missing`);
  }

  // 3. Consent default precedes the GTM loader.
  if (gtm) {
    const consentIdx = html.search(CONSENT_DEFAULT_RE);
    const gtmIdx = html.search(GTM_LOADER_RE);
    if (consentIdx === -1) {
      failures.push(`${urlPath}: no Consent Mode default block found — GTM loads with no consent default`);
    } else if (consentIdx > gtmIdx) {
      failures.push(`${urlPath}: Consent Mode default appears AFTER the GTM loader — tags can fire before the default applies`);
    }
  }

  // 1. Turnstile pairing on conversion-capable pages.
  const exempt = (manifest.turnstileExempt ?? []).includes(urlPath);
  const { capable, why } = isConversionCapable(html, urlPath, manifest);
  const hasScript = TURNSTILE_SCRIPT_RE.test(html);
  const hasContainer = TURNSTILE_CONTAINER_RE.test(html);
  if (capable && !exempt) {
    if (!hasScript || !hasContainer) {
      failures.push(
        `${urlPath}: conversion-capable (${why}) but Turnstile ${!hasScript && !hasContainer ? 'script AND container' : !hasScript ? 'script' : 'container'} missing — gateway dispatches from this page are silently dropped`,
      );
    }
  } else if ((hasScript) !== (hasContainer)) {
    // Half a pair anywhere is a latent bug even on non-capable pages.
    warnings.push(`${urlPath}: Turnstile ${hasScript ? 'script without container' : 'container without script'} — incomplete pair`);
  }
}

async function main() {
  const manifest = await loadManifest(args.manifest);
  const failures = [];
  const warnings = [];
  let pages = 0;

  if (!existsSync(args.dist)) {
    console.error(`FATAL: dist directory not found: ${args.dist} — build first`);
    process.exit(2);
  }

  for (const file of await walkHtml(args.dist)) {
    const urlPath = urlPathOf(args.dist, file);
    const html = await readFile(file, 'utf8');
    pages++;
    checkPage(html, urlPath, manifest, failures, warnings);
    if (args.verbose) console.log(`  checked ${urlPath}`);
  }

  // SSR pages aren't in dist — fetch them if we have a base URL, else the
  // layer must report SKIP (exit 3), NOT pass: the historical months-long
  // Turnstile/CAPI bug lived on exactly such an SSR page, and a green
  // summary over an unchecked page is the failure mode this harness exists
  // to kill.
  let skippedSsr = 0;
  const ssrPages = manifest.ssrPages ?? [];
  if (ssrPages.length > 0) {
    if (args['base-url']) {
      for (const p of ssrPages) {
        const url = args['base-url'].replace(/\/$/, '') + p;
        try {
          const res = await fetch(url, { redirect: 'follow' });
          // A styled 404/500 renders with the full layout (GTM, consent,
          // Turnstile) and would "verify" a broken route as PASS — status
          // and final-URL must match what we asked for.
          if (!res.ok) {
            failures.push(`${p}: SSR page returned HTTP ${res.status} — a broken route cannot count as verified`);
            continue;
          }
          const finalPath = new URL(res.url).pathname;
          if (finalPath !== p && finalPath !== p.replace(/\/$/, '')) {
            failures.push(`${p}: SSR fetch was redirected to ${finalPath} — verified the wrong page`);
            continue;
          }
          const html = await res.text();
          pages++;
          // CLEAN path: conversionCapablePages / turnstileExempt matching
          // must work for SSR pages too — a decorated label would silently
          // disable force-listing and exemptions exactly here.
          console.error(`  info  SSR fetch ${p} <- ${url}`);
          checkPage(html, p, manifest, failures, warnings);
        } catch (err) {
          failures.push(`${p}: SSR page fetch failed (${err.message}) — could not verify`);
        }
      }
    } else {
      skippedSsr = ssrPages.length;
      console.error(
        `\n  ⚠ SKIPPED (NOT verified): ${ssrPages.length} SSR page(s) — ${ssrPages.join(', ')}\n` +
        `    These do not exist in dist/. Pass --base-url to fetch and check them live.\n` +
        `    A skip is NOT a pass — this layer will report SKIP, not PASS.\n`,
      );
    }
  }

  for (const w of warnings) console.error(`  WARN  ${w}`);
  for (const f of failures) console.error(`  FAIL  ${f}`);
  console.log(`\nverify-dist: ${pages} page(s), ${failures.length} failure(s), ${warnings.length} warning(s)${skippedSsr ? `, ${skippedSsr} SSR page(s) UNVERIFIED` : ''}`);
  process.exit(failures.length > 0 ? 1 : skippedSsr > 0 ? 3 : 0);
}

main().catch((err) => {
  console.error(`FATAL: ${err.stack || err}`);
  process.exit(2);
});
