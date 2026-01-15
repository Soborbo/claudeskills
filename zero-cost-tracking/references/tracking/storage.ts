/**
 * Zero-Cost Tracking v2 - Storage
 *
 * Safari-safe localStorage wrapper with try/catch for private mode.
 */

// =============================================================================
// Safe localStorage Operations
// =============================================================================

/**
 * Safely read from localStorage
 * Returns null if localStorage is unavailable (Safari private mode)
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely write to localStorage
 * Returns false if localStorage is unavailable
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    console.warn('[Tracking] localStorage not available');
    return false;
  }
}

/**
 * Safely remove from localStorage
 * Returns false if localStorage is unavailable
 */
export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// JSON Storage Helpers
// =============================================================================

/**
 * Read and parse JSON from localStorage
 */
export function getStoredJson<T>(key: string): T | null {
  const stored = safeGetItem(key);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as T;
  } catch {
    // Invalid JSON - clean up
    safeRemoveItem(key);
    return null;
  }
}

/**
 * Stringify and store JSON to localStorage
 */
export function setStoredJson<T>(key: string, value: T): boolean {
  try {
    return safeSetItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
