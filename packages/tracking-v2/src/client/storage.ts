/**
 * @leadgen/tracking-v2 - Safari-safe localStorage
 */

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function getStoredJson<T>(key: string): T | null {
  const stored = safeGetItem(key);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as T;
  } catch {
    safeRemoveItem(key);
    return null;
  }
}

export function setStoredJson<T>(key: string, value: T): boolean {
  try {
    return safeSetItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
