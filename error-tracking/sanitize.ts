// src/lib/errors/sanitize.ts
// PII stripping + context size enforcement

import type { ErrorContext } from './types';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
const UK_POSTCODE_RE = /[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/gi;

const PII_FIELD_NAMES = new Set([
  'email', 'phone', 'name', 'firstname', 'lastname',
  'address', 'fullname', 'mobile', 'tel', 'postcode',
]);

/** Max context mezők száma */
const MAX_CONTEXT_KEYS = 10;
/** Max context érték méret (karakter) */
const MAX_VALUE_LENGTH = 500;
/** Max teljes context méret JSON-ben (byte) */
const MAX_CONTEXT_BYTES = 4096;

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***.***';
  const parts = domain.split('.');
  const tld = parts.pop() || '';
  return `${local[0]}***@${parts[0]?.[0] || '*'}***.${tld}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-3)}`;
}

function maskPostcode(postcode: string): string {
  const parts = postcode.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ***` : `${postcode.substring(0, 3)}***`;
}

function sanitizeValue(value: string): string {
  return value
    .replace(EMAIL_RE, (m) => maskEmail(m))
    .replace(PHONE_RE, (m) => maskPhone(m))
    .replace(UK_POSTCODE_RE, (m) => maskPostcode(m));
}

/**
 * Sanitize + enforce context limits.
 * - Max 10 keys
 * - Max 500 char/value
 * - Max 4KB total JSON size
 * - PII field names → [REDACTED]
 * - Email/phone/postcode patterns → masked
 */
export function sanitizeContext(context: ErrorContext): ErrorContext {
  const sanitized: ErrorContext = {};
  let keyCount = 0;

  for (const [key, value] of Object.entries(context)) {
    if (keyCount >= MAX_CONTEXT_KEYS) break;

    // Skip PII field names
    if (PII_FIELD_NAMES.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
      keyCount++;
      continue;
    }

    // Enforce value limits
    if (typeof value === 'string') {
      const truncated = value.length > MAX_VALUE_LENGTH
        ? value.substring(0, MAX_VALUE_LENGTH) + '…'
        : value;
      sanitized[key] = sanitizeValue(truncated);
    } else {
      sanitized[key] = value;
    }
    keyCount++;
  }

  // Final size check
  const json = JSON.stringify(sanitized);
  if (json.length > MAX_CONTEXT_BYTES) {
    // Drastic fallback: keep only first 3 keys
    const keys = Object.keys(sanitized).slice(0, 3);
    const trimmed: ErrorContext = {};
    for (const k of keys) trimmed[k] = sanitized[k];
    trimmed._truncated = true;
    return trimmed;
  }

  return sanitized;
}
