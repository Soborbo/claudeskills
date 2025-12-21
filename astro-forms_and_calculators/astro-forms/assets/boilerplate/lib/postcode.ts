/**
 * Postcode Lookup with Debounce
 * Auto-fills city field based on postcode
 */

import { siteConfig } from '../config/site';

const DEBOUNCE_MS = 300;

let debounceTimer: ReturnType<typeof setTimeout>;

/**
 * Initialize postcode lookup on input
 */
export function initPostcodeLookup(
  postcodeInput: HTMLInputElement,
  cityInput: HTMLInputElement,
  loadingEl?: HTMLElement | null
): void {
  const locale = siteConfig.locale;
  const triggerLength = locale === 'hu-HU' ? 4 : 5;
  
  postcodeInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    
    const value = postcodeInput.value.trim();
    
    if (value.length >= triggerLength) {
      debounceTimer = setTimeout(async () => {
        await lookupAndFill(value, cityInput, loadingEl);
      }, DEBOUNCE_MS);
    }
  });
}

/**
 * Lookup postcode and fill city
 */
async function lookupAndFill(
  postcode: string,
  cityInput: HTMLInputElement,
  loadingEl?: HTMLElement | null
): Promise<void> {
  // Don't overwrite if user already filled city
  if (cityInput.value.trim()) return;
  
  // Show loading
  loadingEl?.classList.remove('hidden');
  
  try {
    const response = await fetch(
      `/api/calculator/postcode?code=${encodeURIComponent(postcode)}`
    );
    const data = await response.json();
    
    if (data.city) {
      fillCityWithAnimation(cityInput, data.city);
    }
  } catch (error) {
    console.error('Postcode lookup failed:', error);
  } finally {
    // Hide loading
    loadingEl?.classList.add('hidden');
  }
}

/**
 * Fill city input with green flash animation
 */
function fillCityWithAnimation(input: HTMLInputElement, city: string): void {
  input.value = city;
  
  // Green flash animation
  input.classList.add('bg-green-50', 'transition-colors');
  
  setTimeout(() => {
    input.classList.remove('bg-green-50');
  }, 1000);
}

/**
 * Sync lookup for Hungarian postcodes (optional optimization)
 * Can be used with imported JSON data
 */
export function lookupCitySync(
  postcode: string,
  postcodeData: Record<string, string>
): string | null {
  return postcodeData[postcode] || null;
}
