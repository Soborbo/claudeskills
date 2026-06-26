/** Közös teszt-segédek a jsdom környezethez. */

export function setCkyConsent(opts: { analytics?: boolean; marketing?: boolean } = {}): void {
  const categories = {
    analytics: !!opts.analytics,
    marketing: !!opts.marketing,
    functional: true,
    necessary: true,
  };
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
  window.history.pushState({}, '', '/');
}
