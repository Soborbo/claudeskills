/**
 * @leadgen/tracking-v2 - Session Management
 *
 * localStorage-based session with configurable timeout.
 * Same session across tabs, new session after inactivity.
 */

import type { SessionData } from '../types';
import { STORAGE_KEYS, getSessionTimeoutMs, log } from './constants';
import { getStoredJson, setStoredJson } from './storage';

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `sess_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function getOrCreateSessionId(): string {
  const stored = getStoredJson<SessionData>(STORAGE_KEYS.SESSION);
  const now = Date.now();
  const timeout = getSessionTimeoutMs();

  if (stored && now - stored.lastActivity < timeout) {
    // Extend session
    setStoredJson(STORAGE_KEYS.SESSION, { id: stored.id, lastActivity: now });
    return stored.id;
  }

  // New session
  const newId = generateSessionId();
  setStoredJson(STORAGE_KEYS.SESSION, { id: newId, lastActivity: now });
  log('New session created:', newId);
  return newId;
}

export function getCurrentSessionId(): string | null {
  const stored = getStoredJson<SessionData>(STORAGE_KEYS.SESSION);
  if (!stored) return null;

  const timeout = getSessionTimeoutMs();
  if (Date.now() - stored.lastActivity >= timeout) return null;

  return stored.id;
}

export function hasActiveSession(): boolean {
  return getCurrentSessionId() !== null;
}
