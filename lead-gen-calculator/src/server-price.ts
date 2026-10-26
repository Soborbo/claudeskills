/**
 * Server-side price reconciliation.
 *
 * Invariant K: the server recomputes the price from the submitted ANSWERS
 * with the same pure pricing module the client uses, and the server value is
 * what reaches the CRM, the e-mail, Sheets and the conversion `value`.
 * A client-supplied total is only a hint for drift logging. 4 of 6 audited
 * sites forwarded the client total (lomtalan calc_mid → Ads value, up to 100 M).
 */

export interface PriceReconciliation {
  /** The value to use downstream. null = could not price (send no conversion value). */
  value: number | null;
  mismatch: boolean;
  clientValue: number | null;
}

export function reconcilePrice(
  serverValue: number | null | undefined,
  clientValue: unknown,
  opts: { relTolerance?: number; absTolerance?: number; max?: number } = {},
): PriceReconciliation {
  const rel = opts.relTolerance ?? 0.01;
  const abs = opts.absTolerance ?? 1;
  const max = opts.max ?? Number.POSITIVE_INFINITY;
  const client = typeof clientValue === 'number' && Number.isFinite(clientValue) ? clientValue : null;
  const server =
    typeof serverValue === 'number' && Number.isFinite(serverValue) && serverValue >= 0 && serverValue <= max
      ? serverValue
      : null;

  if (server === null) return { value: null, mismatch: client !== null, clientValue: client };
  const mismatch = client !== null && Math.abs(client - server) > Math.max(abs, server * rel);
  return { value: server, mismatch, clientValue: client };
}
