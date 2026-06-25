/**
 * eeat-audit CLI — run with tsx.
 *
 *   npm run audit -- --dir ./dist --market hu --robots ./dist/robots.txt
 *   npm run audit -- --html ./dist/index.html --market uk
 *
 * Exit code is 0 when there are no `fail` results, 1 otherwise — so it can gate
 * a deploy. It REPORTS only; it never edits the site (non-deciding).
 */
import { readFile } from 'node:fs/promises';
import { auditPage } from '../src/eeat/checks';
import { auditSite, summarize } from '../src/eeat/audit';
import { checkRobotsAiAccess } from '../src/eeat/crawlers';
import type { AuditSummary, CheckResult, Market } from '../src/eeat/types';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const ICON: Record<CheckResult['status'], string> = {
  pass: '✅',
  warn: '⚠️ ',
  fail: '❌',
  not_found: '·',
};

function render(summary: AuditSummary): void {
  for (const r of summary.results) {
    const line = `${ICON[r.status]} [${r.id}] ${r.signal}`;
    if (r.status === 'fail') console.error(line);
    else console.log(line);
    if (r.observed_differences) console.log(`      ↳ ${r.observed_differences}`);
  }
  const { pass, warn, fail, not_found } = summary.counts;
  console.log(
    `\neeat-signals: ${pass} pass · ${warn} warn · ${fail} fail · ${not_found} n/a`,
  );
  console.log(fail > 0 ? '❌ FAIL — required E-E-A-T signals missing.' : '✅ No blocking E-E-A-T gaps.');
}

async function main(): Promise<void> {
  const market = (arg('market') as Market) ?? 'generic';
  const dir = arg('dir');
  const html = arg('html');
  const robotsPath = arg('robots');
  const robotsTxt = robotsPath ? await readFile(robotsPath, 'utf8') : undefined;

  let summary: AuditSummary;
  if (dir) {
    summary = await auditSite({ dir, market, robotsTxt, glob: arg('glob') });
  } else if (html) {
    const content = await readFile(html, 'utf8');
    const results = [
      ...auditPage({ html: content, url: html, market }),
      ...checkRobotsAiAccess(robotsTxt),
    ];
    summary = summarize(results);
  } else {
    console.error('Usage: eeat-audit --dir ./dist [--market uk|hu] [--robots ./dist/robots.txt]');
    console.error('   or: eeat-audit --html ./dist/index.html [--market uk|hu]');
    process.exit(2);
  }
  render(summary);
  process.exit(summary.exitCode);
}

main().catch((err) => {
  console.error('[eeat-audit] crashed:', err);
  process.exit(2);
});
