/**
 * Site-level orchestration + summary. Stateless: the caller supplies the
 * built HTML directory and (optionally) robots.txt; nothing is written back.
 */
import fg from 'fast-glob';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { AuditSummary, CheckResult, Market, Status } from './types';
import { auditPage } from './checks';
import { checkRobotsAiAccess } from './crawlers';

export function summarize(results: CheckResult[]): AuditSummary {
  const counts: Record<Status, number> = { pass: 0, warn: 0, fail: 0, not_found: 0 };
  for (const r of results) counts[r.status]++;
  return { results, counts, exitCode: counts.fail > 0 ? 1 : 0 };
}

export interface SiteAuditOptions {
  dir: string;
  robotsTxt?: string;
  market?: Market;
  /** Glob of HTML files to audit, relative to `dir`. */
  glob?: string;
}

/** Audit every HTML file under `dir`, prefixing each result id with its file. */
export async function auditSite(opts: SiteAuditOptions): Promise<AuditSummary> {
  const market = opts.market ?? 'generic';
  const files = await fg(opts.glob ?? '**/*.html', {
    cwd: opts.dir,
    absolute: true,
    ignore: ['**/node_modules/**'],
  });
  const results: CheckResult[] = [];
  for (const file of files) {
    const rel = path.relative(opts.dir, file);
    const html = await readFile(file, 'utf8');
    for (const r of auditPage({ html, url: rel, market })) {
      results.push({ ...r, id: `${rel}::${r.id}` });
    }
  }
  results.push(...checkRobotsAiAccess(opts.robotsTxt));
  return summarize(results);
}
