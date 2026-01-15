/**
 * Zero-Cost Tracking v2 - Idempotency
 *
 * Client-side idempotency key generation for Sheets submissions.
 * Server validates to prevent duplicate leads within 24h window.
 */

// =============================================================================
// Lead ID Generation
// =============================================================================

/**
 * Generate unique lead ID
 * Format: LD-YYYY-MM-DD-xxxxx
 */
export function generateLeadId(): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const random = Math.random().toString(36).slice(2, 7); // 5 chars
  return `LD-${date}-${random}`;
}

// =============================================================================
// Idempotency Key Generation
// =============================================================================

/**
 * Generate idempotency key for Sheets submission
 *
 * Based on: email + event_type + date (YYYY-MM-DD)
 * Same user submitting same form type on same day = same key
 *
 * @param email - User email (normalized)
 * @param eventType - Event type (quote_request, callback_request, contact_form)
 */
export function generateIdempotencyKey(email: string, eventType: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const normalized = email.trim().toLowerCase();

  // Simple hash (not crypto-secure, just for deduplication)
  const input = `${normalized}:${eventType}:${date}`;
  return simpleHash(input);
}

/**
 * Simple string hash (djb2 algorithm)
 * Not cryptographically secure - just for deduplication key
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // Convert to positive hex string
  return (hash >>> 0).toString(16);
}

// =============================================================================
// Phone Click Deduplication
// =============================================================================

const firedPhoneClicks = new Set<string>();

/**
 * Check if phone click already fired this session
 * Returns true if should fire, false if duplicate
 */
export function shouldFirePhoneClick(sessionId: string): boolean {
  const key = `phone:${sessionId}`;

  if (firedPhoneClicks.has(key)) {
    console.debug('[Tracking] Phone click already fired this session');
    return false;
  }

  firedPhoneClicks.add(key);
  return true;
}

/**
 * Reset phone click tracking (for testing)
 */
export function resetPhoneClickTracking(): void {
  firedPhoneClicks.clear();
}
