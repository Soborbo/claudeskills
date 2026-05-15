/**
 * Forbidden-pattern scanner. Runs as part of `npm run test:security`.
 *
 * Fails CI when a production source file regresses on a tracking-kit
 * invariant. See ../../INVARIANTS.md for the rationale of each pattern.
 *
 * Scope: ONLY `src/` is scanned. Tests, docs, and `.env.example` are
 * exempt by directory. If you legitimately need to reference a forbidden
 * pattern (e.g. an INVARIANTS doc that names the anti-pattern by name),
 * keep it under `tests/`, `*.md`, or add an explicit `ALLOWLIST_FILES`
 * entry below with a brief justification.
 */

import fg from 'fast-glob';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const srcRoot = path.join(repoRoot, 'src');

interface ForbiddenRule {
  /** Stable identifier shown in failure output. */
  id: string;
  /** Pattern to grep for. */
  pattern: RegExp;
  /** Why it's forbidden — printed alongside any hit. */
  reason: string;
}

const FORBIDDEN: ForbiddenRule[] = [
  {
    id: 'fingerprint-client-id',
    pattern: /\b(deriveClientId|fingerprintClientId)\b/,
    reason:
      'Synthetic GA4 client_id poisons attribution (INVARIANT #17). Read the real _ga cookie via readGa4IdsFromCookie() and skip the send when absent.',
  },
  {
    id: 'meta-test-event-code-literal',
    pattern: /META_CAPI_TEST_EVENT_CODE\s*=\s*['"][A-Z0-9]+['"]/,
    reason:
      'Hardcoded Meta test_event_code routes production traffic to Test Events. Use env vars; never inline.',
  },
  {
    id: 'placeholder-domain-in-prod-path',
    // Match `example.com` as a URL host but NOT as a domain inside docs
    // comments or readme prose. We scan only TS source so a comment will
    // still match — that's intentional: production source shouldn't ship
    // with the placeholder origin in comments either, except for the
    // ALLOWED_ORIGINS scaffold which we exempt below.
    pattern: /https?:\/\/(?:www\.)?example\.com/i,
    reason:
      'Placeholder origin "example.com" must be replaced with the real origin before deployment.',
  },
  {
    id: 'console-log-in-tracking',
    pattern: /(^|\s)console\.log\(/,
    reason:
      'Use the Logger contract or `console.warn`/`console.debug` instead. `console.log` slips raw PII into production logs.',
  },
];

/**
 * Files whose mentions of a forbidden pattern are intentional and
 * shouldn't fail the scan. Keep this list short and annotated.
 */
const ALLOWLIST: Array<{ file: string; ruleIds: string[]; reason: string }> = [
  {
    // The ALLOWED_ORIGINS scaffold in the route templates is the
    // CUSTOMIZE-this-on-deploy marker. Tests in cloudflare/env-validation
    // assert these are replaced in real deploys.
    file: 'src/api/nextjs/meta-capi.route.ts',
    ruleIds: ['placeholder-domain-in-prod-path'],
    reason: 'Scaffold placeholder; replaced by the integrator.',
  },
  {
    file: 'src/api/nextjs/abandonment.route.ts',
    ruleIds: ['placeholder-domain-in-prod-path'],
    reason: 'Scaffold placeholder; replaced by the integrator.',
  },
  {
    file: 'src/api/astro/meta-capi.ts',
    ruleIds: ['placeholder-domain-in-prod-path'],
    reason: 'Scaffold placeholder; replaced by the integrator.',
  },
  {
    file: 'src/api/astro/abandonment.ts',
    ruleIds: ['placeholder-domain-in-prod-path'],
    reason: 'Scaffold placeholder; replaced by the integrator.',
  },
  {
    file: 'src/lib/tracking/server.ts',
    ruleIds: ['fingerprint-client-id'],
    reason:
      'server.ts has a comment naming deriveClientId as an explicit anti-pattern — exempt the comment, not new code.',
  },
];

function isAllowed(file: string, ruleId: string): boolean {
  const rel = path.relative(repoRoot, file).replaceAll('\\', '/');
  return ALLOWLIST.some((a) => a.file === rel && a.ruleIds.includes(ruleId));
}

async function main(): Promise<void> {
  const files = await fg('src/**/*.{ts,tsx,js,jsx,astro,html}', {
    cwd: repoRoot,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.astro/**'],
  });

  const hits: Array<{ file: string; rule: ForbiddenRule; line: number; preview: string }> = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    for (const rule of FORBIDDEN) {
      if (isAllowed(file, rule.id)) continue;
      lines.forEach((line, idx) => {
        if (rule.pattern.test(line)) {
          hits.push({ file, rule, line: idx + 1, preview: line.trim() });
        }
      });
    }
  }

  if (hits.length === 0) {
    console.log(`[forbidden-patterns] OK — scanned ${files.length} files, 0 violations.`);
    return;
  }

  console.error(`[forbidden-patterns] FAILED — ${hits.length} violation(s):\n`);
  for (const h of hits) {
    const rel = path.relative(repoRoot, h.file);
    console.error(`  ${rel}:${h.line}  [${h.rule.id}]`);
    console.error(`    > ${h.preview}`);
    console.error(`    ${h.rule.reason}\n`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error('[forbidden-patterns] scanner crashed:', err);
  process.exit(2);
});
