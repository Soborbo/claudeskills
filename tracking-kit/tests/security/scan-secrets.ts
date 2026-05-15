/**
 * Secret-shape scanner. Looks for things that LOOK like real secrets
 * baked into source files. A clean .env.example is fine — the keys are
 * named but the values are empty. A token literal in TS source is not.
 *
 * Scope: scans every tracked file under tracking-kit/ except node_modules
 * and `.env.example` (which is explicitly the keys-without-values
 * template). Test fixtures are also exempt so we can use FAKE tokens in
 * tests without tripping the scanner.
 */

import fg from 'fast-glob';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');

interface SecretRule {
  id: string;
  pattern: RegExp;
  reason: string;
}

const SECRET_RULES: SecretRule[] = [
  {
    id: 'meta-graph-token',
    // Meta access tokens start with EAA…  and are long.
    pattern: /\bEAA[A-Za-z0-9]{40,}\b/,
    reason: 'Looks like a Meta Graph API access token (EAA…). Move to env / secret store.',
  },
  {
    id: 'ga4-measurement-id-literal',
    pattern: /['"]G-[A-Z0-9]{6,}['"]/,
    reason: 'GA4 Measurement ID hardcoded. Read from env (GA4_MEASUREMENT_ID).',
  },
  {
    id: 'gtm-container-literal',
    pattern: /['"]GTM-[A-Z0-9]{6,}['"]/,
    reason: 'GTM container ID hardcoded. Read from env (GTM_ID / PUBLIC_GTM_ID).',
  },
  {
    id: 'meta-pixel-id-literal',
    // 15-16 digit numeric strings embedded as quoted literals — Meta
    // Pixel IDs are ~15 digits.
    pattern: /['"]\d{15,16}['"]/,
    reason: 'Looks like a Meta Pixel ID hardcoded. Read from env (META_PIXEL_ID).',
  },
  {
    id: 'ga4-api-secret-literal',
    pattern: /GA4_API_SECRET\s*[:=]\s*['"][^'"]{8,}['"]/,
    reason: 'Hardcoded GA4 API secret. Read from env.',
  },
  {
    id: 'meta-access-token-literal',
    pattern: /META_CAPI_ACCESS_TOKEN\s*[:=]\s*['"][^'"]{8,}['"]/,
    reason: 'Hardcoded Meta CAPI access token. Read from env.',
  },
];

const EXEMPT_FILES: string[] = [
  '.env.example',
  // GTM snippet templates contain the placeholder GTM-XXXXXXX which the
  // integrator find/replaces. The forbidden-patterns scanner catches the
  // structural concern (example.com); the secrets scanner is for real
  // tokens, not placeholder snippets.
  'src/components/gtm-head.html',
  'src/components/gtm-body.html',
  'src/components/GTMHead.astro',
  'src/components/GTMBody.astro',
  'src/components/GTMNext.tsx',
];

const EXEMPT_PREFIXES: string[] = [
  'tests/',
  'node_modules/',
];

/** A literal made entirely of placeholder characters (X's, zeros, etc) is
 *  not a secret — it's a "fill this in" marker. */
function isObviousPlaceholder(match: string): boolean {
  // Strip surrounding quotes if present.
  const trimmed = match.replace(/^['"]|['"]$/g, '');
  return /^(?:GTM-|G-)?X+$/i.test(trimmed) || /^0+$/.test(trimmed);
}

function isExempt(file: string): boolean {
  const rel = path.relative(repoRoot, file).replaceAll('\\', '/');
  if (EXEMPT_FILES.includes(rel)) return true;
  return EXEMPT_PREFIXES.some((p) => rel.startsWith(p));
}

async function main(): Promise<void> {
  const files = await fg(['**/*.{ts,tsx,js,jsx,astro,html,json,env,yml,yaml}', '.env*'], {
    cwd: repoRoot,
    absolute: true,
    dot: true,
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.astro/**',
      '**/.next/**',
      '**/coverage/**',
    ],
  });

  const hits: Array<{ file: string; rule: SecretRule; line: number; preview: string }> = [];

  for (const file of files) {
    if (isExempt(file)) continue;
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    for (const rule of SECRET_RULES) {
      lines.forEach((line, idx) => {
        const m = line.match(rule.pattern);
        if (!m) return;
        if (isObviousPlaceholder(m[0])) return;
        hits.push({ file, rule, line: idx + 1, preview: line.trim().slice(0, 200) });
      });
    }
  }

  if (hits.length === 0) {
    console.log(`[secrets-scan] OK — scanned ${files.length} files, 0 secret-shaped strings.`);
    return;
  }

  console.error(`[secrets-scan] FAILED — ${hits.length} suspected secret(s):\n`);
  for (const h of hits) {
    const rel = path.relative(repoRoot, h.file);
    console.error(`  ${rel}:${h.line}  [${h.rule.id}]`);
    console.error(`    > ${h.preview}`);
    console.error(`    ${h.rule.reason}\n`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error('[secrets-scan] scanner crashed:', err);
  process.exit(2);
});
