/**
 * Forbidden-pattern scanner. Runs as part of `npm run test:security`.
 *
 * Guards the kit's own executable source (src/ + scripts/) against shipping an
 * E-E-A-T anti-pattern as if it were a recommendation, or hardcoding fake
 * trust data. Reference docs under references/ legitimately NAME these
 * anti-patterns, so they are out of scope here (scanned by humans, not this).
 *
 * Exit: 0 = clean, 1 = violations, 2 = crash. Mirrors the tracking-kit scanner.
 */
import fg from 'fast-glob';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');

interface ForbiddenRule {
  id: string;
  pattern: RegExp;
  reason: string;
}

const FORBIDDEN: ForbiddenRule[] = [
  {
    id: 'speakable-recommendation',
    pattern: /\bspeakable\b/i,
    reason:
      'Speakable schema is news-only; this kit must never recommend it. (Discuss it in references/dont-forbidden.md, not in code.)',
  },
  {
    id: 'hardcoded-aggregate-rating',
    pattern: /ratingValue\s*[:=]\s*['"]?\d/,
    reason: 'No hardcoded review/rating literals — ratings must reflect real, verifiable data (owned by schema-audit).',
  },
  {
    id: 'placeholder-domain',
    pattern: /https?:\/\/(?:www\.)?example\.com/i,
    reason: 'Placeholder origin example.com must not ship in source.',
  },
  {
    id: 'lorem-ipsum',
    pattern: /lorem ipsum/i,
    reason: 'Placeholder lorem-ipsum copy must not ship in source.',
  },
  {
    id: 'console-log',
    pattern: /(^|\s)console\.log\(/,
    reason: 'Use console.warn/console.error in tooling; console.log slips noise into CI output.',
  },
];

const ALLOWLIST: Array<{ file: string; ruleIds: string[]; reason: string }> = [
  {
    file: 'scripts/eeat-audit.ts',
    ruleIds: ['console-log'],
    reason: 'The CLI intentionally prints its report to stdout via console.log.',
  },
];

function isAllowed(rel: string, ruleId: string): boolean {
  return ALLOWLIST.some((a) => a.file === rel && a.ruleIds.includes(ruleId));
}

async function main(): Promise<void> {
  const files = await fg(['src/**/*.ts', 'scripts/**/*.ts'], {
    cwd: repoRoot,
    absolute: true,
    ignore: ['**/node_modules/**'],
  });
  const hits: Array<{ rel: string; rule: ForbiddenRule; line: number; preview: string }> = [];
  for (const file of files) {
    const rel = path.relative(repoRoot, file).replaceAll('\\', '/');
    const lines = readFileSync(file, 'utf8').split('\n');
    for (const rule of FORBIDDEN) {
      if (isAllowed(rel, rule.id)) continue;
      lines.forEach((line, idx) => {
        if (rule.pattern.test(line)) hits.push({ rel, rule, line: idx + 1, preview: line.trim() });
      });
    }
  }
  if (hits.length === 0) {
    console.error(`[forbidden-patterns] OK — scanned ${files.length} files, 0 violations.`);
    return;
  }
  console.error(`[forbidden-patterns] FAILED — ${hits.length} violation(s):\n`);
  for (const h of hits) {
    console.error(`  ${h.rel}:${h.line}  [${h.rule.id}]`);
    console.error(`    > ${h.preview}`);
    console.error(`    ${h.rule.reason}\n`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error('[forbidden-patterns] scanner crashed:', err);
  process.exit(2);
});
