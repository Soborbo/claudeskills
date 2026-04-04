export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorCodeDef {
  code: string;
  message: string;
  severity: Severity;
  retryable: boolean;
  userImpact: boolean;
}

export interface ErrorReport {
  code: string;
  message: string;
  severity: Severity;
  source: string;
  url: string;
  timestamp: string;
  context?: Record<string, unknown>;
  stack?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface CatcherConfig {
  endpoint: string;
  maxReportsPerSession?: number;
  dedupeWindowMs?: number;
  offlineQueueMax?: number;
}

export interface ServerTrackerConfig {
  sheetsId?: string;
  alertEmail?: string;
  alertSeverity?: Severity;
}
