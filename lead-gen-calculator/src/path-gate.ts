/**
 * Allowlist gates (soft launch, maintenance, geo) must normalise the path
 * before matching and must preserve the query string.
 *
 * lomtalan.hu: LIVE_PAGES held '/ajanlat/' but the gate ran before Astro's
 * trailing-slash handling, so '/ajanlat' and '/arkalkulator?property=haz'
 * were 302'd to '/' — every ad/link without a trailing slash lost the funnel
 * AND its gclid.
 */

export function normalizePath(pathname: string): string {
  let p = (pathname || '/').toLowerCase();
  try {
    p = decodeURIComponent(p);
  } catch {
    /* keep raw */
  }
  p = p.replace(/\/{2,}/g, '/');
  if (!p.startsWith('/')) p = `/${p}`;
  const last = p.split('/').pop() ?? '';
  if (!p.endsWith('/') && !last.includes('.')) p = `${p}/`;
  return p;
}

export type GateDecision =
  | { action: 'pass' }
  | { action: 'redirect'; location: string; status: 301 | 302 };

export function gateRequest(
  url: URL,
  allow: ReadonlySet<string>,
  opts: { bypassPrefixes?: string[]; fallback?: string } = {},
): GateDecision {
  const raw = url.pathname;
  if ((opts.bypassPrefixes ?? []).some((p) => raw.startsWith(p))) return { action: 'pass' };
  const norm = normalizePath(raw);
  if (allow.has(norm)) {
    if (norm === raw) return { action: 'pass' };
    return { action: 'redirect', location: `${norm}${url.search}`, status: 301 };
  }
  // Even the fallback redirect keeps attribution params.
  return { action: 'redirect', location: `${opts.fallback ?? '/'}${url.search}`, status: 302 };
}
