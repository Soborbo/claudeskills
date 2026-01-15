/**
 * Zero-Cost Tracking v2 - Session Management
 *
 * localStorage-based session with 30-minute inactivity timeout.
 * Same session across tabs, new session after timeout.
 */

import { STORAGE_KEYS, TIMING } from './constants';
import { getStoredJson, setStoredJson } from './storage';

// =============================================================================
// Types
// =============================================================================

interface StoredSession {
  id: string;
  lastActivity: number;
}

// =============================================================================
// Session Management
// =============================================================================

/**
 * Generate a new session ID
 */
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `sess_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Get or create session ID
 *
 * - Returns existing session if within 30-minute timeout
 * - Creates new session if expired or missing
 * - Extends session on each call (updates lastActivity)
 */
export function getOrCreateSessionId(): string {
  const stored = getStoredJson<StoredSession>(STORAGE_KEYS.SESSION);
  const now = Date.now();

  if (stored) {
    const timeSinceActivity = now - stored.lastActivity;

    if (timeSinceActivity < TIMING.SESSION_TIMEOUT_MS) {
      // Session still valid - extend it
      setStoredJson(STORAGE_KEYS.SESSION, {
        id: stored.id,
        lastActivity: now,
      });
      return stored.id;
    }
  }

  // Create new session
  const newId = generateSessionId();
  setStoredJson(STORAGE_KEYS.SESSION, {
    id: newId,
    lastActivity: now,
  });

  return newId;
}

/**
 * Get current session ID without extending
 * Returns null if no valid session
 */
export function getCurrentSessionId(): string | null {
  const stored = getStoredJson<StoredSession>(STORAGE_KEYS.SESSION);

  if (!stored) return null;

  const timeSinceActivity = Date.now() - stored.lastActivity;
  if (timeSinceActivity >= TIMING.SESSION_TIMEOUT_MS) {
    return null;
  }

  return stored.id;
}

/**
 * Check if there's an active session
 */
export function hasActiveSession(): boolean {
  return getCurrentSessionId() !== null;
}

/**
 * Force new session (for testing)
 */
export function forceNewSession(): string {
  const newId = generateSessionId();
  setStoredJson(STORAGE_KEYS.SESSION, {
    id: newId,
    lastActivity: Date.now(),
  });
  return newId;
}
