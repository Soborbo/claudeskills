/**
 * Persistence — localStorage, attribution, sessions, normalization
 *
 * Storage rules:
 *   localStorage  → only after marketing consent
 *   sessionStorage → only after analytics consent
 *   memory         → always (lost on reload, that's fine)
 */

import { hasMarketingConsent, hasAnalyticsConsent } from './consent';

const TRACKING_KEY = 'sb_tracking';
const FIRST_TOUCH_KEY = 'sb_first_touch';
const SESSION_KEY = 'sb_session';
const EXPIRY_DAYS = 90;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// ── Types ──────────────────────────────────────────────────────────

export interface TrackingData {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  timestamp: number;
  landingPage: string;
}

export interface AttributionData {
  first_utm_source?: string;
  first_utm_medium?: string;
  first_utm_campaign?: string;
  first_gclid?: string;
  last_utm_source?: string;
  last_utm_medium?: string;
  last_utm_campaign?: string;
  last_gclid?: string;
}

interface SessionData { id: string; lastActivity: number; }

// ── Safe storage ───────────────────────────────────────────────────

function lsGet(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k: string, v: string): void { try { localStorage.setItem(k, v); } catch { /* */ } }
function lsRm(k: string): void { try { localStorage.removeItem(k); } catch { /* */ } }
function ssGet(k: string): string | null { try { return sessionStorage.getItem(k); } catch { return null; } }
function ssSet(k: string, v: string): void { try { sessionStorage.setItem(k, v); } catch { /* */ } }
function ssRm(k: string): void { try { sessionStorage.removeItem(k); } catch { /* */ } }

// ── Canonical normalizers (ONE source of truth) ────────────────────

/** Normalize email: lowercase, trim, max 254 chars. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 254);
}

/**
 * Normalize phone to E.164-ish format for consistent hashing.
 * Strips formatting, applies UK/HU country code if missing.
 * Used everywhere: dataLayer, hidden fields, Meta CAPI, Sheets.
 */
export function normalizePhone(raw: string): string {
  let p = raw.replace(/[\s\-(). ]/g, '');
  // UK: 07xxx → +447xxx
  if (p.startsWith('07') && p.length === 11) p = '+44' + p.slice(1);
  // HU: 06xxx → +36xxx
  else if (p.startsWith('06') && p.length === 11) p = '+36' + p.slice(1);
  return p.replace(/[^\d+]/g, '').slice(0, 20);
}

/** Trim and limit name length. */
export function sanitizeName(name: string): string {
  return name.trim().slice(0, 100);
}

// ── Session ────────────────────────────────────────────────────────

let memorySession: SessionData | null = null;

function newSessionId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? `sess_${crypto.randomUUID().slice(0, 12)}`
    : `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getSession(): SessionData {
  const now = Date.now();

  // With analytics consent: use sessionStorage (survives page reload)
  if (hasAnalyticsConsent()) {
    const raw = ssGet(SESSION_KEY);
    if (raw) {
      try {
        const s: SessionData = JSON.parse(raw);
        if (now - s.lastActivity < SESSION_TIMEOUT_MS) {
          s.lastActivity = now;
          ssSet(SESSION_KEY, JSON.stringify(s));
          return s;
        }
      } catch { /* corrupted */ }
    }
    const s: SessionData = { id: newSessionId(), lastActivity: now };
    ssSet(SESSION_KEY, JSON.stringify(s));
    return s;
  }

  // No consent: memory only (lost on reload — intentional)
  if (memorySession && now - memorySession.lastActivity < SESSION_TIMEOUT_MS) {
    memorySession.lastActivity = now;
    return memorySession;
  }
  memorySession = { id: newSessionId(), lastActivity: now };
  return memorySession;
}

export function getSessionId(): string { return getSession().id; }

// ── Attribution ────────────────────────────────────────────────────

function urlTrackingParams(): Partial<TrackingData> | null {
  const u = new URLSearchParams(window.location.search);
  const p: Partial<TrackingData> = {};
  let any = false;
  for (const k of ['gclid','gbraid','wbraid','fbclid','utm_source','utm_medium','utm_campaign','utm_content','utm_term'] as const) {
    const v = u.get(k);
    if (v) { (p as Record<string,string>)[k] = v; any = true; }
  }
  return any ? p : null;
}

/** In-memory capture of URL params on page load (before consent). */
let capturedParams: Partial<TrackingData> | null = null;

export function captureUrlParams(): void {
  capturedParams = urlTrackingParams();
}

function persistFirstTouch(params: Partial<TrackingData>): void {
  if (lsGet(FIRST_TOUCH_KEY)) return;
  lsSet(FIRST_TOUCH_KEY, JSON.stringify({
    utm_source: params.utm_source, utm_medium: params.utm_medium,
    utm_campaign: params.utm_campaign, gclid: params.gclid,
    timestamp: Date.now(),
  }));
}

/** Persist captured params to localStorage. ONLY after marketing consent. */
export function persistTrackingParams(): void {
  if (!hasMarketingConsent()) return;
  const fresh = capturedParams || urlTrackingParams();
  if (!fresh) return;
  persistFirstTouch(fresh);
  const stored = getStoredData();
  lsSet(TRACKING_KEY, JSON.stringify({
    ...stored, ...fresh,
    timestamp: Date.now(),
    landingPage: stored?.landingPage || window.location.pathname,
  } satisfies TrackingData));
  capturedParams = null;
}

export function getAttribution(): AttributionData {
  const r: AttributionData = {};
  const fr = lsGet(FIRST_TOUCH_KEY);
  if (fr) {
    try {
      const f = JSON.parse(fr);
      r.first_utm_source = f.utm_source; r.first_utm_medium = f.utm_medium;
      r.first_utm_campaign = f.utm_campaign; r.first_gclid = f.gclid;
    } catch { /* */ }
  }
  const s = getStoredData();
  if (s) {
    r.last_utm_source = s.utm_source; r.last_utm_medium = s.utm_medium;
    r.last_utm_campaign = s.utm_campaign; r.last_gclid = s.gclid;
  }
  return r;
}

export function getSourceType(): 'paid'|'organic'|'social'|'referral'|'direct' {
  const d = getStoredData();
  if (!d) return 'direct';
  if (d.gclid || d.gbraid || d.wbraid) return 'paid';
  if (d.fbclid) return 'social';
  if (d.utm_medium === 'cpc' || d.utm_medium === 'ppc') return 'paid';
  if (d.utm_medium === 'organic') return 'organic';
  if (d.utm_medium === 'social') return 'social';
  if (d.utm_medium === 'referral') return 'referral';
  if (d.utm_source) return 'referral';
  return 'direct';
}

// ── Data access ────────────────────────────────────────────────────

export function getStoredData(): TrackingData | null {
  const raw = lsGet(TRACKING_KEY);
  if (!raw) return null;
  try {
    const d: TrackingData = JSON.parse(raw);
    if (Date.now() - d.timestamp > EXPIRY_DAYS * 86_400_000) { lsRm(TRACKING_KEY); return null; }
    return d;
  } catch { lsRm(TRACKING_KEY); return null; }
}

export function getGclid(): string | null {
  return new URLSearchParams(window.location.search).get('gclid') || getStoredData()?.gclid || null;
}
export function getFbclid(): string | null {
  return new URLSearchParams(window.location.search).get('fbclid') || getStoredData()?.fbclid || null;
}

export function getAllTrackingData(): Partial<TrackingData> {
  const s = getStoredData(); const u = new URLSearchParams(window.location.search);
  return {
    gclid: u.get('gclid') || s?.gclid, gbraid: u.get('gbraid') || s?.gbraid,
    wbraid: u.get('wbraid') || s?.wbraid, fbclid: u.get('fbclid') || s?.fbclid,
    utm_source: u.get('utm_source') || s?.utm_source, utm_medium: u.get('utm_medium') || s?.utm_medium,
    utm_campaign: u.get('utm_campaign') || s?.utm_campaign, utm_content: u.get('utm_content') || s?.utm_content,
    utm_term: u.get('utm_term') || s?.utm_term,
  };
}

export function getFbp(): string | null {
  return typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)_fbp=([^;]*)/)?.[1] || null : null;
}
export function getFbc(): string | null {
  return typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/)?.[1] || null : null;
}

export function getPageUrl(): string {
  return window.location.origin + window.location.pathname;
}
export function getDevice(): 'mobile'|'tablet'|'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  return w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
}

export function clearTrackingData(): void {
  lsRm(TRACKING_KEY); lsRm(FIRST_TOUCH_KEY); ssRm(SESSION_KEY);
  memorySession = null;
}
