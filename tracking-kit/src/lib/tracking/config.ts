/**
 * Tracking constants. Anything that's a magic number, a brittle endpoint
 * URL, or a project-specific identifier belongs here.
 *
 * To adapt the kit for a new project, edit THIS FILE — every other module
 * imports from here and is otherwise reusable as-is.
 */

// ---------------------------------------------------------------------------
// Per-project identity (CHANGE THESE)
// ---------------------------------------------------------------------------

/** Used as a prefix for all localStorage keys, BroadcastChannel name, and
 *  the hidden DOM element id, so two co-hosted properties can't collide. */
export const STORAGE_PREFIX = 'tk' as const;

/** Default currency for conversion events that don't pass one explicitly. */
export const DEFAULT_CURRENCY = 'EUR' as const;

/** Default country for E.164 phone normalization. Add the country code to
 *  COUNTRY_DIAL_CODES below if it isn't already there. */
export const DEFAULT_COUNTRY: CountryCode = 'GB';

/** Map of supported countries to their international dial code. Extend
 *  freely; the codes themselves are forwarded to Meta CAPI as-is. */
export const COUNTRY_DIAL_CODES = {
  GB: '+44',
  HU: '+36',
  DE: '+49',
  US: '+1',
  AT: '+43',
  RO: '+40',
} as const;

export type CountryCode = keyof typeof COUNTRY_DIAL_CODES;

// ---------------------------------------------------------------------------
// Upgrade-window timings — only relevant if you use conversion-state.ts
// ---------------------------------------------------------------------------

/** Window during which a primary completion (e.g. quote, free trial,
 *  account-create) can be "upgraded" by a higher-intent action (phone
 *  click, callback form). After this elapses without an upgrade, we fire
 *  the late conversion. */
export const UPGRADE_WINDOW_MS = 60 * 60 * 1000;

/** Grace window after `UPGRADE_WINDOW_MS` during which a returning user
 *  still gets the late-conversion fired on next page-load. Beyond this,
 *  the state is dropped entirely. */
export const LATE_CATCHUP_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Form abandonment
// ---------------------------------------------------------------------------

/** Minimum dwell time before a `form_abandonment` ping is allowed. Below
 *  this we assume bot / accidental focus and skip. */
export const ABANDONMENT_MIN_DWELL_MS = 10 * 1000;

// ---------------------------------------------------------------------------
// PII retention
// ---------------------------------------------------------------------------

/** PII (email/phone/name/address) on the side-channel `localStorage` blob
 *  expires after this. On every page-load `restoreUserDataFromStorage()`
 *  enforces the TTL. Set short enough that an unattended browser session
 *  doesn't leave PII recoverable indefinitely; long enough that a returning
 *  user inside the upgrade window still has hashed identifiers for CAPI. */
export const USER_DATA_TTL_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Server-side rate limit (best-effort, in-memory per isolate)
// ---------------------------------------------------------------------------

/** Sliding window length for the per-IP request limiter. */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;
/** Max requests per IP per window for the abandonment beacon. */
export const RATE_LIMIT_ABANDONMENT_MAX = 60;
/** Max requests per IP per window for the Meta CAPI mirror — tighter
 *  because each accepted hit forwards a real conversion to Meta. */
export const RATE_LIMIT_CAPI_MAX = 20;

// ---------------------------------------------------------------------------
// Meta Graph API version
// ---------------------------------------------------------------------------

/** Pinned Meta Graph API version for CAPI calls. Bump in one place when
 *  Meta deprecates a version (they support each version for ~2 years). */
export const META_GRAPH_API_VERSION = 'v22.0';

// ---------------------------------------------------------------------------
// Storage keys & DOM ids — derived from STORAGE_PREFIX so you almost never
// need to touch them directly.
// ---------------------------------------------------------------------------

export const CONVERSION_STATE_KEY = `${STORAGE_PREFIX}_conversion_state`;
export const USER_DATA_STORAGE_KEY = `${STORAGE_PREFIX}_user_data`;
export const USER_DATA_ELEMENT_ID = `__${STORAGE_PREFIX}_user_data__`;
export const CONVERSION_STATE_CHANNEL = `${STORAGE_PREFIX}_conversion_state_v1`;
/** Standalone flag — survives `deleteState()` on the conversion state so
 *  Meta `ViewContent` only fires once per browser EVER, not once per
 *  upgrade window. */
export const VIEW_CONTENT_FIRED_KEY = `${STORAGE_PREFIX}_view_content_fired`;

// ---------------------------------------------------------------------------
// Endpoints — the paths your server-side handlers will be mounted at.
// ---------------------------------------------------------------------------

export const ABANDONMENT_BEACON_URL = '/api/track/abandonment';
export const META_CAPI_ENDPOINT = '/api/meta/capi';

// ---------------------------------------------------------------------------
// Internal-event → Meta-event name map
// ---------------------------------------------------------------------------

/** When an internal event name appears here, the client mirror will POST
 *  to /api/meta/capi with the corresponding Meta event name. Add or remove
 *  rows as your funnel changes. */
export const META_EVENT_NAMES: Record<string, string> = {
  primary_conversion: 'Lead',
  callback_conversion: 'Lead',
  contact_form_submit: 'Contact',
  phone_conversion: 'Contact',
  email_conversion: 'Contact',
  whatsapp_conversion: 'Contact',
  primary_first_view: 'ViewContent',
};
