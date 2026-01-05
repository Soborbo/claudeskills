/**
 * Zaraz (Meta CAPI) Events
 * Cloudflare Zaraz-on keresztül
 * 
 * FONTOS: Csak marketing consent után hívd!
 * 
 * ⚠️ SECURITY: Meta Access Token SOHA nem kerül kódba!
 * Csak Cloudflare Dashboard → Zaraz → Tool Settings-ben tárold.
 */

declare global {
  interface Window {
    zaraz?: {
      track: (eventName: string, params: Record<string, unknown>) => void;
      set: (key: string, value: unknown) => void;
    };
  }
}

export interface MetaEventParams {
  email: string;
  phone?: string;
  value?: number;
  currency?: string;
  contentName?: string;
}

/**
 * Zaraz elérhető-e?
 */
function isZarazAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.zaraz !== 'undefined';
}

/**
 * Meta Lead event küldése
 * 
 * ⚠️ CONSENT REQUIRED: Csak marketing consent után hívd!
 * 
 * Zaraz automatikusan hash-eli az em és ph mezőket (SHA-256)
 */
export function trackMetaLead(params: MetaEventParams): boolean {
  if (!isZarazAvailable()) {
    console.warn('[Tracking] Zaraz not available');
    return false;
  }
  
  const eventParams: Record<string, unknown> = {
    // Meta standard property nevek
    em: params.email.trim().toLowerCase(),
  };
  
  // Telefon csak ha van és értelmes hosszúságú
  if (params.phone && params.phone.length >= 8) {
    eventParams.ph = params.phone.replace(/[^\d+]/g, '');
  }
  
  if (params.value && params.value > 0) {
    eventParams.value = params.value;
    eventParams.currency = params.currency || 'GBP';
  }
  
  if (params.contentName) {
    eventParams.content_name = params.contentName;
  }
  
  window.zaraz!.track('Lead', eventParams);
  return true;
}

/**
 * Meta PageView
 * Zaraz általában automatikusan küldi, de manuálisan is hívható
 */
export function trackMetaPageView(): boolean {
  if (!isZarazAvailable()) return false;
  window.zaraz!.track('PageView', {});
  return true;
}

/**
 * Meta ViewContent (kalkulátor lépéseknél hasznos)
 */
export function trackMetaViewContent(contentName: string): boolean {
  if (!isZarazAvailable()) return false;
  window.zaraz!.track('ViewContent', {
    content_name: contentName,
  });
  return true;
}
