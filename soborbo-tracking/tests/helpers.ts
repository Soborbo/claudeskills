/** Közös teszt-segédek a jsdom környezethez. */

/**
 * A CookieYes VALÓDI kategória-alakját emuláljuk: {necessary, functional,
 * analytics, performance, advertisement} — `marketing` kulcs NINCS. A `marketing`
 * opciót az `advertisement` kulcsra képezzük, így minden teszt a valós CMP-alak
 * ellen fut (a régi helper a nemlétező `marketing` kulcsot írta, ezért a suite
 * nem fogta meg a prod-ban minden konverziót elnémító consent-bugot).
 * Az alias-átvételt külön teszt fedi (`setCkyConsentRaw`).
 */
export function setCkyConsent(opts: { analytics?: boolean; marketing?: boolean } = {}): void {
  const categories = {
    analytics: !!opts.analytics,
    advertisement: !!opts.marketing,
    performance: !!opts.analytics,
    functional: true,
    necessary: true,
  };
  (window as unknown as { getCkyConsent: () => unknown }).getCkyConsent = () => ({ categories });
}

/** Nyers kategória-objektum beállítása (alak-regressziós tesztekhez). */
export function setCkyConsentRaw(categories: Record<string, boolean>): void {
  (window as unknown as { getCkyConsent: () => unknown }).getCkyConsent = () => ({ categories });
}

export function clearCkyConsent(): void {
  delete (window as unknown as { getCkyConsent?: unknown }).getCkyConsent;
}

/** Beállítja a window.location.search/pathname-et (jsdom history-n keresztül). */
export function setUrl(pathAndQuery: string): void {
  window.history.pushState({}, '', pathAndQuery.startsWith('/') ? pathAndQuery : '/' + pathAndQuery);
}

export function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${value}; path=/`;
}

export function clearCookies(): void {
  for (const c of document.cookie.split(';')) {
    const n = c.split('=')[0].trim();
    if (n) document.cookie = `${n}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

export function getDataLayer(): Record<string, unknown>[] {
  return (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer || [];
}

export function lastEvent(name?: string): Record<string, unknown> | undefined {
  const dl = getDataLayer();
  if (!name) return dl[dl.length - 1];
  for (let i = dl.length - 1; i >= 0; i--) if (dl[i].event === name) return dl[i];
  return undefined;
}

export function resetAll(): void {
  try { localStorage.clear(); } catch { /* */ }
  try { sessionStorage.clear(); } catch { /* */ }
  clearCookies();
  clearCkyConsent();
  (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
  // Enhanced Conversions side-channel (set by setUserDataForEC).
  delete (window as unknown as { __sbUserData?: unknown }).__sbUserData;
  document.getElementById('__sb_user_data__')?.remove();
  // Observability diagnostics ring.
  (window as unknown as { __sbTrackingDiag?: unknown[] }).__sbTrackingDiag = [];
  window.history.pushState({}, '', '/');
}
