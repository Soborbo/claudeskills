/**
 * PII sanitization for error context
 * Strips email, phone, names from error reports
 */

const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /[\w.-]+@[\w.-]+\.\w+/g, replacement: '[EMAIL]' },
  { pattern: /\+?\d{10,15}/g, replacement: '[PHONE]' },
  { pattern: /\b[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}\b/gi, replacement: '[POSTCODE]' },
];

export function sanitizeContext(context: Record<string, unknown>, depth = 0): Record<string, unknown> {
  // Prevent infinite recursion
  if (depth > 3) return { _truncated: true };

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    // Skip known PII fields entirely
    if (['email', 'phone', 'name', 'address', 'postcode'].includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    if (typeof value === 'string') {
      let cleaned = value;
      for (const { pattern, replacement } of PII_PATTERNS) {
        cleaned = cleaned.replace(pattern, replacement);
      }
      // Truncate long strings
      sanitized[key] = cleaned.length > 500 ? cleaned.slice(0, 500) + '...' : cleaned;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeContext(value as Record<string, unknown>, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
