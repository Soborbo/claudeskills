// src/lib/errors/types.ts
// Teljes típusdefiníció — minden error report erre az alapra épül

export type Severity = 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO';

export interface ErrorCodeDef {
  severity: Severity;
  message: string;
  /** Újrapróbálható-e automatikusan */
  retryable: boolean;
  /** User-re gyakorolt hatás */
  userImpact: 'blocked' | 'degraded' | 'none';
  /** Kötelező context mezők ehhez a kódhoz */
  requiredContext?: string[];
}

/**
 * Context: csak flat key-value, max 10 kulcs, max 500 char/érték.
 * Tilos PII-t belerakni — a sanitizer úgyis törli, de ne is próbáld.
 */
export interface ErrorContext {
  [key: string]: string | number | boolean;
}

/**
 * Teljes error report — ez megy a szerverre.
 * Minden mező determinisztikus, nincs opcionális "majd ha van".
 */
export interface ErrorReport {
  // --- Azonosítás ---
  code: string;
  severity: Severity;
  message: string;
  stack: string;

  // --- Context ---
  context: ErrorContext;

  // --- Hol történt ---
  url: string;
  source: string;          // fájl/modul ahol a hiba keletkezett

  // --- Ki/mi környezetben ---
  sessionId: string;       // tab-session egyedi ID (sessionStorage)
  requestId: string;       // per-report egyedi ID
  journeyId: string;       // calculator/form journey ID (ha van)
  deployId: string;        // CF Pages deploy ID (ha elérhető)
  env: 'production' | 'preview' | 'development';
  siteId: string;

  // --- Böngésző/eszköz ---
  userAgent: string;
  viewport: string;        // pl. "390x844"
  connection: string;      // pl. "4g", "wifi", "offline"

  // --- Idő ---
  timestamp: string;       // ISO 8601
  pageLoadedAgo: number;   // ms óta töltődött be az oldal

  // --- Meta ---
  retryable: boolean;
  userImpact: 'blocked' | 'degraded' | 'none';
  fingerprint: string;     // dedup fingerprint: code + source + messageHash
}

/**
 * Kliens-oldali catcher config
 */
export interface CatcherConfig {
  /** POST endpoint URL */
  endpoint: string;
  /** Site azonosító (pl. 'painless-removals') */
  siteId: string;
  /** CF Pages deploy ID (PUBLIC_DEPLOY_ID env-ből) */
  deployId: string;
  /** Dev mód? */
  isDev: boolean;
  /** Calculator/form journey ID — opcionális, állítsd a journey során */
  journeyId?: string;
}

/**
 * Szerver-oldali error tracking config
 */
export interface ServerTrackerConfig {
  siteId: string;
  deployId: string;
  env: 'production' | 'preview' | 'development';
  sheetsWebhookUrl?: string;
  alertEmailTo?: string;
  alertEmailFrom: string;   // Dedicated, verified email cím — NE SITE_URL-ból!
  resendApiKey?: string;
}
