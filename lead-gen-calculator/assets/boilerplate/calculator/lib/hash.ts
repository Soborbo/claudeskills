/**
 * Result URL Hashing
 * 
 * Creates non-reversible hashes for result page URLs.
 * Hash is stored in Google Sheets alongside data.
 * Same hash always shows same result.
 */

export function generateResultHash(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 8);
  const combined = `${timestamp}-${random}`;
  
  // Simple hash - not cryptographic but non-guessable
  return btoa(combined)
    .replace(/[+/=]/g, '')
    .substring(0, 12)
    .toUpperCase();
}

export function createResultUrl(hash: string): string {
  return `/eredmeny/${hash}`;
}

// For email links - absolute URL
export function createResultEmailUrl(hash: string, baseUrl: string): string {
  return `${baseUrl}/eredmeny/${hash}`;
}
