/**
 * @leadgen/tracking-v2 - User Identity Stitching
 *
 * Connect anonymous sessions to known users after identification.
 * Enables cross-device tracking and user journey analysis.
 */

import { getDataLayer } from './dataLayer';
import { getOrCreateSessionId, getCurrentSessionId } from './session';
import { getFirstTouch, getLastTouch } from './params';
import { safeGetItem, safeSetItem, safeRemoveItem } from './storage';
import { setZarazUserData } from './zaraz';
import { TRACKING_VERSION, log } from './constants';

// =============================================================================
// Types
// =============================================================================

export interface UserIdentity {
  /** Hashed email (SHA-256) */
  emailHash: string;
  /** Original email (for Zaraz/Enhanced Conversions) */
  email: string;
  /** Hashed phone (SHA-256) */
  phoneHash?: string;
  /** Original phone */
  phone?: string;
  /** First name for Enhanced Conversions */
  firstName?: string;
  /** Last name for Enhanced Conversions */
  lastName?: string;
  /** Custom user ID from your system */
  userId?: string;
  /** When identity was established */
  identifiedAt: number;
  /** Sessions associated with this identity */
  sessions: string[];
}

export interface IdentifyParams {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
}

const STORAGE_KEY = 'lg_user_identity';
const ANONYMOUS_SESSIONS_KEY = 'lg_anonymous_sessions';

// =============================================================================
// Hashing
// =============================================================================

/**
 * Hash a string using SHA-256 (for privacy)
 */
async function sha256(str: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Fallback for older browsers - simple hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  const msgBuffer = new TextEncoder().encode(str.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalize email for consistent hashing
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Normalize phone for consistent hashing
 */
function normalizePhone(phone: string): string {
  // Remove all non-digit characters except leading +
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

// =============================================================================
// Storage
// =============================================================================

function getStoredIdentity(): UserIdentity | null {
  const data = safeGetItem(STORAGE_KEY);
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function saveIdentity(identity: UserIdentity): void {
  safeSetItem(STORAGE_KEY, JSON.stringify(identity));
}

function getAnonymousSessions(): string[] {
  const data = safeGetItem(ANONYMOUS_SESSIONS_KEY);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function addAnonymousSession(sessionId: string): void {
  const sessions = getAnonymousSessions();
  if (!sessions.includes(sessionId)) {
    sessions.push(sessionId);
    safeSetItem(ANONYMOUS_SESSIONS_KEY, JSON.stringify(sessions));
  }
}

function clearAnonymousSessions(): void {
  safeRemoveItem(ANONYMOUS_SESSIONS_KEY);
}

// =============================================================================
// Identity Management
// =============================================================================

/**
 * Check if user is identified
 */
export function isIdentified(): boolean {
  return getStoredIdentity() !== null;
}

/**
 * Get current user identity
 */
export function getUserIdentity(): UserIdentity | null {
  return getStoredIdentity();
}

/**
 * Get hashed email for the current user
 */
export function getUserEmailHash(): string | null {
  const identity = getStoredIdentity();
  return identity?.emailHash || null;
}

/**
 * Identify a user and stitch their sessions
 *
 * @example
 * // After form submission
 * await identifyUser({
 *   email: 'john@example.com',
 *   phone: '+447123456789',
 *   firstName: 'John',
 *   lastName: 'Smith',
 * });
 */
export async function identifyUser(params: IdentifyParams): Promise<UserIdentity> {
  const normalizedEmail = normalizeEmail(params.email);
  const emailHash = await sha256(normalizedEmail);

  let phoneHash: string | undefined;
  let normalizedPhone: string | undefined;
  if (params.phone) {
    normalizedPhone = normalizePhone(params.phone);
    phoneHash = await sha256(normalizedPhone);
  }

  const currentSession = getOrCreateSessionId();
  const anonymousSessions = getAnonymousSessions();

  // Merge anonymous sessions
  const allSessions = [...new Set([...anonymousSessions, currentSession])];

  const identity: UserIdentity = {
    emailHash,
    email: normalizedEmail,
    phoneHash,
    phone: normalizedPhone,
    firstName: params.firstName,
    lastName: params.lastName,
    userId: params.userId,
    identifiedAt: Date.now(),
    sessions: allSessions,
  };

  // Save identity
  saveIdentity(identity);
  clearAnonymousSessions();

  // Push to dataLayer for GA4 User-ID
  pushIdentityToDataLayer(identity);

  // Set Zaraz user data for Meta
  setZarazUserData(normalizedEmail, normalizedPhone);

  log('User identified:', { emailHash, sessions: allSessions.length });

  return identity;
}

/**
 * Track current session as anonymous (call on page load if not identified)
 */
export function trackAnonymousSession(): void {
  if (isIdentified()) return;

  const sessionId = getOrCreateSessionId();
  addAnonymousSession(sessionId);
  log('Anonymous session tracked:', sessionId);
}

/**
 * Merge a previous identity with current session
 * Use when user returns and you recognize them (e.g., from cookie, login)
 */
export async function mergeIdentity(email: string): Promise<UserIdentity | null> {
  const normalizedEmail = normalizeEmail(email);
  const emailHash = await sha256(normalizedEmail);

  const existing = getStoredIdentity();

  if (existing && existing.emailHash === emailHash) {
    // Same user - add current session
    const currentSession = getOrCreateSessionId();
    if (!existing.sessions.includes(currentSession)) {
      existing.sessions.push(currentSession);
      saveIdentity(existing);
      pushIdentityToDataLayer(existing);
      log('Session merged with existing identity');
    }
    return existing;
  }

  // Different user or no existing identity
  return null;
}

/**
 * Clear user identity (for logout or GDPR)
 */
export function clearIdentity(): void {
  safeRemoveItem(STORAGE_KEY);
  clearAnonymousSessions();

  // Clear from dataLayer
  const dataLayer = getDataLayer();
  if (dataLayer) {
    dataLayer.push({
      event: 'user_logout',
      user_id: undefined,
      user_email_hash: undefined,
    });
  }

  log('User identity cleared');
}

// =============================================================================
// DataLayer Integration
// =============================================================================

function pushIdentityToDataLayer(identity: UserIdentity): void {
  const dataLayer = getDataLayer();
  if (!dataLayer) return;

  // Push user identification event
  dataLayer.push({
    event: 'user_identified',
    user_id: identity.userId || identity.emailHash.slice(0, 16),
    user_email_hash: identity.emailHash,
    user_phone_hash: identity.phoneHash,
    sessions_merged: identity.sessions.length,
    tracking_version: TRACKING_VERSION,
  });

  // Set user properties for GA4
  dataLayer.push({
    user_id: identity.userId || identity.emailHash.slice(0, 16),
  });
}

/**
 * Push user data for Enhanced Conversions
 * Call this before conversion events for better matching
 */
export function pushUserDataForConversions(identity?: UserIdentity): void {
  const user = identity || getStoredIdentity();
  if (!user) return;

  const dataLayer = getDataLayer();
  if (!dataLayer) return;

  // Enhanced Conversions user data format
  dataLayer.push({
    event: 'set_user_data',
    user_data: {
      email: user.email,
      phone_number: user.phone,
      address: {
        first_name: user.firstName,
        last_name: user.lastName,
      },
    },
  });

  log('User data pushed for Enhanced Conversions');
}

/**
 * Get user journey across sessions
 */
export function getUserJourney(): {
  sessions: string[];
  firstTouch: ReturnType<typeof getFirstTouch>;
  lastTouch: ReturnType<typeof getLastTouch>;
  isIdentified: boolean;
  identifiedAt: number | null;
} {
  const identity = getStoredIdentity();

  return {
    sessions: identity?.sessions || getAnonymousSessions(),
    firstTouch: getFirstTouch(),
    lastTouch: getLastTouch(),
    isIdentified: !!identity,
    identifiedAt: identity?.identifiedAt || null,
  };
}

// =============================================================================
// Auto-initialization
// =============================================================================

/**
 * Initialize identity tracking
 * Call on page load to track anonymous sessions
 */
export function initIdentityTracking(): void {
  if (typeof window === 'undefined') return;

  // Track as anonymous if not identified
  trackAnonymousSession();

  // If already identified, push to dataLayer
  const identity = getStoredIdentity();
  if (identity) {
    pushIdentityToDataLayer(identity);
  }
}
