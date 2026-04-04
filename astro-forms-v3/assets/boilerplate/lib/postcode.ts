/**
 * Postcode Lookup with Debounce — CLIENT-SIDE ONLY
 *
 * Auto-fills city field based on postcode.
 * Locale determines validation length (HU: 4 digits, UK: 5+ chars).
 *
 * ⚠️  This file uses browser APIs (DOM, fetch to relative URL).
 * Import it only from client-side code (<script> tags, Astro client components).
 * Do NOT import from server-side API routes or Workers — it will crash.
 */

type Locale = 'en-GB' | 'hu-HU';

const DEBOUNCE_MS = 300;
let debounceTimer: ReturnType<typeof setTimeout>;

/**
 * Initialise postcode lookup on an input field.
 *
 * @param postcodeInput - The postcode input element
 * @param cityInput - The city input element to auto-fill
 * @param locale - 'en-GB' or 'hu-HU'
 * @param loadingEl - Optional loading indicator element
 */
export function initPostcodeLookup(
  postcodeInput: HTMLInputElement,
  cityInput: HTMLInputElement,
  locale: Locale = 'en-GB',
  loadingEl?: HTMLElement | null
): void {
  // HU postcodes: 4 digits. UK postcodes: variable, trigger at 5+ chars.
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
 * Lookup postcode and fill city.
 */
async function lookupAndFill(
  postcode: string,
  cityInput: HTMLInputElement,
  loadingEl?: HTMLElement | null
): Promise<void> {
  // Don't overwrite if user already typed a city
  if (cityInput.value.trim()) return;

  loadingEl?.classList.remove('hidden');

  try {
    const response = await fetch(
      `/api/postcode?code=${encodeURIComponent(postcode)}`
    );
    const data = await response.json();

    if (data.city) {
      fillCityWithAnimation(cityInput, data.city);
    }
  } catch (error) {
    console.error('Postcode lookup failed:', error);
  } finally {
    loadingEl?.classList.add('hidden');
  }
}

/**
 * Fill city input with a brief green flash to confirm autofill.
 */
function fillCityWithAnimation(input: HTMLInputElement, city: string): void {
  input.value = city;
  input.classList.add('bg-green-50', 'transition-colors');

  setTimeout(() => {
    input.classList.remove('bg-green-50');
  }, 1000);
}

/**
 * Synchronous lookup from a preloaded postcode→city map.
 * Optional optimisation for Hungarian postcodes (finite, small dataset).
 */
export function lookupCitySync(
  postcode: string,
  postcodeData: Record<string, string>
): string | null {
  return postcodeData[postcode] || null;
}
