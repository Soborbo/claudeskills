/**
 * Shared types for the eeat-signals auditor.
 *
 * House conventions (inherited from the skills HARD-RULES):
 *  - Stateless + deterministic: every check is a pure function of its input.
 *  - Non-deciding: checks REPORT, they never mutate or "fix" the page.
 *  - `not_found` is a first-class, non-blocking status (the `not_found:true`
 *    convention) — used when a signal is not applicable to the page.
 *  - Gaps are surfaced as `observed_differences`, never as "opportunities".
 */

export type Market = 'uk' | 'hu' | 'generic';

/** Whether a page is a service page, a product page, or generic content. */
export type PageKind = 'service' | 'product' | 'article' | 'generic';

export type Status =
  | 'pass' // signal present and adequate
  | 'warn' // present but weak, or a recommended (non-required) signal is absent
  | 'fail' // a required signal is missing, or a forbidden pattern is present
  | 'not_found'; // signal not applicable to this page — informational only

export interface CheckResult {
  /** Stable identifier, e.g. `author.visible-byline`. Never renamed. */
  id: string;
  /** Human-readable name of the signal being checked. */
  signal: string;
  status: Status;
  /** What was observed vs. what the signal expects. Present unless `pass`. */
  observed_differences?: string;
}

export interface PageAuditInput {
  html: string;
  /** Page URL or file path — used only for reporting + heuristics. */
  url?: string;
  market?: Market;
  /** Override page-kind detection when the caller already knows it. */
  kind?: PageKind;
}

export interface SiteAuditInput {
  /** Directory of built HTML (e.g. `dist/`). */
  dir?: string;
  /** Raw robots.txt contents, if available. */
  robotsTxt?: string;
  market?: Market;
}

export interface AuditSummary {
  results: CheckResult[];
  counts: Record<Status, number>;
  /** 0 when there are no `fail` results, 1 otherwise. */
  exitCode: 0 | 1;
}
