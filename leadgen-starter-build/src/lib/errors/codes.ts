import type { ErrorCodeDef } from './types';

export const ERROR_CODES: Record<string, ErrorCodeDef> = {
  // HTTP errors
  'HTTP-404': { code: 'HTTP-404', message: 'Page not found', severity: 'low', retryable: false, userImpact: true },
  'HTTP-500': { code: 'HTTP-500', message: 'Server error', severity: 'critical', retryable: true, userImpact: true },

  // Server errors
  'SRV-ENV-001': { code: 'SRV-ENV-001', message: 'Missing environment variable', severity: 'critical', retryable: false, userImpact: true },
  'SRV-KV-001': { code: 'SRV-KV-001', message: 'KV store unavailable', severity: 'high', retryable: true, userImpact: true },

  // Email errors
  'EMAIL-RESEND-001': { code: 'EMAIL-RESEND-001', message: 'Resend API failure', severity: 'high', retryable: true, userImpact: false },
  'EMAIL-BREVO-001': { code: 'EMAIL-BREVO-001', message: 'Brevo API failure', severity: 'high', retryable: true, userImpact: false },
  'EMAIL-BOTH-001': { code: 'EMAIL-BOTH-001', message: 'Both email providers failed', severity: 'critical', retryable: false, userImpact: true },

  // Form errors
  'FORM-VALIDATION-001': { code: 'FORM-VALIDATION-001', message: 'Form validation failed', severity: 'low', retryable: false, userImpact: true },
  'FORM-SPAM-001': { code: 'FORM-SPAM-001', message: 'Spam detected', severity: 'low', retryable: false, userImpact: false },
  'FORM-RATE-001': { code: 'FORM-RATE-001', message: 'Rate limit exceeded', severity: 'medium', retryable: true, userImpact: true },
  'FORM-DUPE-001': { code: 'FORM-DUPE-001', message: 'Duplicate submission', severity: 'low', retryable: false, userImpact: false },
  'FORM-TURNSTILE-001': { code: 'FORM-TURNSTILE-001', message: 'Turnstile verification failed', severity: 'medium', retryable: true, userImpact: true },
  'FORM-SHEETS-001': { code: 'FORM-SHEETS-001', message: 'Google Sheets write failed', severity: 'high', retryable: true, userImpact: false },

  // Client JS errors
  'JS-RUNTIME-001': { code: 'JS-RUNTIME-001', message: 'JavaScript runtime error', severity: 'medium', retryable: false, userImpact: true },
  'JS-PROMISE-001': { code: 'JS-PROMISE-001', message: 'Unhandled promise rejection', severity: 'medium', retryable: false, userImpact: true },

  // Network errors
  'NET-OFFLINE-001': { code: 'NET-OFFLINE-001', message: 'User went offline', severity: 'low', retryable: true, userImpact: true },
  'NET-FETCH-001': { code: 'NET-FETCH-001', message: 'Fetch request failed', severity: 'medium', retryable: true, userImpact: true },

  // Image errors
  'IMG-LOAD-001': { code: 'IMG-LOAD-001', message: 'Image failed to load', severity: 'low', retryable: true, userImpact: true },

  // Web Vitals
  'PERF-LCP-001': { code: 'PERF-LCP-001', message: 'LCP exceeded 2.5s', severity: 'medium', retryable: false, userImpact: true },
  'PERF-CLS-001': { code: 'PERF-CLS-001', message: 'CLS exceeded 0.1', severity: 'medium', retryable: false, userImpact: true },
  'PERF-INP-001': { code: 'PERF-INP-001', message: 'INP exceeded 200ms', severity: 'medium', retryable: false, userImpact: true },
};
