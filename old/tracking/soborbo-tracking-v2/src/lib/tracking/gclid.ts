/**
 * GCLID & UTM Persistence
 * Safari ITP megkerülése localStorage-dzsal
 * 
 * FONTOS: Csak consent után hívd a persistTrackingParams()-t!
 */

const STORAGE_KEY = 'soborbo_tracking';
const EXPIRY_DAYS = 90;

export interface TrackingData {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  timestamp: number;
  landingPage: string;
}

/**
 * localStorage safe wrapper - Safari private mode / blocked storage kezelés
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // localStorage disabled (Safari private mode, etc.)
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    // localStorage disabled
    console.warn('[Tracking] localStorage not available');
    return false;
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

/**
 * URL paraméterek kinyerése és mentése
 * 
 * ⚠️ CONSENT REQUIRED: Csak marketing consent után hívd!
 */
export function persistTrackingParams(): void {
  const urlParams = new URLSearchParams(window.location.search);
  
  const newData: Partial<TrackingData> = {};
  
  // Click ID-k
  const gclid = urlParams.get('gclid');
  const gbraid = urlParams.get('gbraid');
  const wbraid = urlParams.get('wbraid');
  const fbclid = urlParams.get('fbclid');
  
  if (gclid) newData.gclid = gclid;
  if (gbraid) newData.gbraid = gbraid;
  if (wbraid) newData.wbraid = wbraid;
  if (fbclid) newData.fbclid = fbclid;
  
  // UTM paraméterek
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
  utmParams.forEach(param => {
    const value = urlParams.get(param);
    if (value) newData[param] = value;
  });
  
  // Ha van új adat, mentsd
  if (Object.keys(newData).length > 0) {
    const stored = getStoredData();
    const merged: TrackingData = {
      ...stored,
      ...newData,
      timestamp: Date.now(),
      landingPage: stored?.landingPage || window.location.pathname
    };
    
    safeSetItem(STORAGE_KEY, JSON.stringify(merged));
  }
}

/**
 * Tárolt adatok lekérése
 * Ellenőrzi a 90 napos lejáratot
 */
export function getStoredData(): TrackingData | null {
  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) return null;
  
  try {
    const data: TrackingData = JSON.parse(raw);
    
    // 90 napos lejárat ellenőrzése
    const maxAge = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > maxAge) {
      safeRemoveItem(STORAGE_KEY);
      return null;
    }
    
    return data;
  } catch {
    // Corrupted data
    safeRemoveItem(STORAGE_KEY);
    return null;
  }
}

/**
 * GCLID lekérése (URL > localStorage)
 * Cookie fallback KIKERÜLT - nem megbízható Safari-n
 */
export function getGclid(): string | null {
  // 1. Friss URL paraméter
  const urlParams = new URLSearchParams(window.location.search);
  const fromUrl = urlParams.get('gclid');
  if (fromUrl) return fromUrl;
  
  // 2. localStorage (90 napig él)
  const stored = getStoredData();
  return stored?.gclid || null;
}

/**
 * Facebook Click ID lekérése
 */
export function getFbclid(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const fromUrl = urlParams.get('fbclid');
  if (fromUrl) return fromUrl;
  
  const stored = getStoredData();
  return stored?.fbclid || null;
}

/**
 * Összes tracking adat lekérése (form submission-höz)
 */
export function getAllTrackingData(): Partial<TrackingData> {
  const stored = getStoredData();
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    gclid: urlParams.get('gclid') || stored?.gclid || undefined,
    gbraid: urlParams.get('gbraid') || stored?.gbraid || undefined,
    wbraid: urlParams.get('wbraid') || stored?.wbraid || undefined,
    fbclid: urlParams.get('fbclid') || stored?.fbclid || undefined,
    utm_source: urlParams.get('utm_source') || stored?.utm_source || undefined,
    utm_medium: urlParams.get('utm_medium') || stored?.utm_medium || undefined,
    utm_campaign: urlParams.get('utm_campaign') || stored?.utm_campaign || undefined,
    utm_content: urlParams.get('utm_content') || stored?.utm_content || undefined,
    utm_term: urlParams.get('utm_term') || stored?.utm_term || undefined,
  };
}

/**
 * Tracking adatok törlése (GDPR: user kérésre)
 */
export function clearTrackingData(): void {
  safeRemoveItem(STORAGE_KEY);
}
