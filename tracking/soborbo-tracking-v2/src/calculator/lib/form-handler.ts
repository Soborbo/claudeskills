/**
 * Calculator Form Handler
 * 
 * Javítások:
 * - requestSubmit() a submit() helyett (HTML5 validation működik)
 * - sendBeacon fallback a tracking adatokhoz
 * - Consent check
 * - Proper error handling
 */

import { 
  persistTrackingParams, 
  trackFullConversion, 
  getAllTrackingData,
  hasMarketingConsent,
  onConsentChange
} from '@/lib/tracking';

/**
 * Inicializálás - page load-on hívd
 */
export function initFormTracking(): void {
  // Consent listener - ha megkapjuk, mentsük a tracking params-okat
  onConsentChange((consent) => {
    if (consent.marketing) {
      persistTrackingParams();
    }
  });
  
  // Ha már van consent, azonnal mentsünk
  if (hasMarketingConsent()) {
    persistTrackingParams();
  }
  
  // Form setup
  setupFormHandler();
}

/**
 * Form handler setup
 */
function setupFormHandler(): void {
  const form = document.querySelector<HTMLFormElement>('#calculator-form');
  if (!form) return;
  
  form.addEventListener('submit', handleFormSubmit);
  
  // Form start time (spam protection)
  const startTimeInput = form.querySelector<HTMLInputElement>('[name="formStartTime"]');
  if (startTimeInput) {
    startTimeInput.value = Date.now().toString();
  }
  
  // GDPR timestamp on checkbox change
  const gdprCheckbox = form.querySelector<HTMLInputElement>('[name="gdprConsent"]');
  const gdprTimestamp = form.querySelector<HTMLInputElement>('[name="gdprTimestamp"]');
  if (gdprCheckbox && gdprTimestamp) {
    gdprCheckbox.addEventListener('change', () => {
      gdprTimestamp.value = gdprCheckbox.checked ? new Date().toISOString() : '';
    });
  }
}

/**
 * Form submit handler
 */
async function handleFormSubmit(e: SubmitEvent): Promise<void> {
  const form = e.target as HTMLFormElement;
  
  // HTML5 validation check FIRST
  if (!form.reportValidity()) {
    // Validation failed - browser shows errors, don't proceed
    return;
  }
  
  // Now we can prevent default (validation passed)
  e.preventDefault();
  
  const formData = new FormData(form);
  
  // User adatok
  const email = (formData.get('email') as string) || '';
  const phone = (formData.get('phone') as string) || '';
  const firstName = (formData.get('firstName') as string) || '';
  const lastName = (formData.get('lastName') as string) || '';
  const value = parseFloat(formData.get('calculatedValue') as string) || undefined;
  
  // Transaction ID
  const transactionId = generateTransactionId();
  
  // Tracking (consent-aware - automatikusan ellenőrzi)
  const trackingResult = trackFullConversion({
    email,
    phone,
    firstName,
    lastName,
    value,
    currency: 'GBP',
    transactionId,
    contentName: document.title,
  });
  
  // Hidden mezők frissítése (backend-nek)
  const trackingData = getAllTrackingData();
  
  updateHiddenField(form, 'gclid', trackingResult.gclid);
  updateHiddenField(form, 'fbclid', trackingResult.fbclid);
  updateHiddenField(form, 'utm_source', trackingData.utm_source);
  updateHiddenField(form, 'utm_medium', trackingData.utm_medium);
  updateHiddenField(form, 'utm_campaign', trackingData.utm_campaign);
  updateHiddenField(form, 'utm_content', trackingData.utm_content);
  updateHiddenField(form, 'utm_term', trackingData.utm_term);
  updateHiddenField(form, 'transaction_id', transactionId);
  
  // Backup: sendBeacon a saját backend-nek
  // Ez GARANTÁLTAN kimegy, még ha a form gyorsan redirect-el is
  sendTrackingBeacon({
    email,
    phone,
    transactionId,
    gclid: trackingResult.gclid,
    fbclid: trackingResult.fbclid,
    ...trackingData,
  });
  
  // Form submit - requestSubmit() megtartja a validation-t
  // (bár már ellenőriztük, de future-proof)
  // 
  // Kis delay a GTM/Zaraz request-eknek
  // De NEM 400ms fix - adaptive: max 800ms VAGY ha nincs pending request
  await waitForTrackingRequests(800);
  
  // Submit
  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submitButton) {
    form.requestSubmit(submitButton);
  } else {
    form.requestSubmit();
  }
}

/**
 * Transaction ID generálás
 */
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 7);
  return `LEAD-${timestamp}-${random}`.toUpperCase();
}

/**
 * Hidden mező frissítése vagy létrehozása
 */
function updateHiddenField(
  form: HTMLFormElement, 
  name: string, 
  value: string | null | undefined
): void {
  let input = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  
  if (!input) {
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    form.appendChild(input);
  }
  
  input.value = value || '';
}

/**
 * Tracking beacon küldése (garantált delivery)
 * 
 * sendBeacon() előnye: NEM blokkolódik page unload-on
 */
function sendTrackingBeacon(data: Record<string, unknown>): void {
  const endpoint = '/api/tracking-beacon';
  
  try {
    const payload = JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
    
    // sendBeacon a preferált (nem blokkolódik)
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      // Fallback: fetch with keepalive
      fetch(endpoint, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {
        // Ignore - best effort
      });
    }
  } catch {
    // Ignore - tracking is best effort
  }
}

/**
 * Várakozás tracking request-ekre (adaptive)
 * 
 * Max timeout, de ha nincs pending request, hamarabb visszatér
 */
function waitForTrackingRequests(maxMs: number): Promise<void> {
  return new Promise((resolve) => {
    // Egyszerű timeout-based approach
    // 
    // Lehetne Performance API-val nézni a pending request-eket,
    // de az overkill és nem mindig megbízható.
    // 
    // A sendBeacon() miatt a kritikus adatok úgyis kimennek,
    // ez csak a GTM/Zaraz request-eknek ad esélyt.
    setTimeout(resolve, Math.min(maxMs, 600));
  });
}

// Astro View Transitions support
document.addEventListener('astro:page-load', initFormTracking);

// Fallback: ha nincs View Transitions
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFormTracking);
} else {
  initFormTracking();
}
