/**
 * Validation Utilities
 *
 * Form validation helpers optimized for Hungarian formats.
 *
 * @example
 * import { validateEmail, validatePhone, validateForm } from '@leadgen/utils/validation';
 *
 * // Validate individual fields
 * if (!validateEmail('test@example.com')) {
 *   console.error('Invalid email');
 * }
 *
 * // Validate Hungarian phone
 * if (!validatePhone('+36 20 123 4567')) {
 *   console.error('Invalid phone');
 * }
 */

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  // RFC 5322 simplified
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Hungarian phone number validation
 * Accepts: +36, 06, or no prefix
 * Formats: +36 20 123 4567, 06201234567, 20-123-4567, etc.
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;

  // Remove all spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Hungarian mobile/landline patterns
  const patterns = [
    /^\+36[0-9]{9}$/,           // +36 + 9 digits
    /^06[0-9]{9}$/,             // 06 + 9 digits
    /^[0-9]{9}$/,               // 9 digits only
    /^\+36[0-9]{1,2}[0-9]{6,7}$/, // +36 + area + number
    /^06[0-9]{1,2}[0-9]{6,7}$/,   // 06 + area + number
  ];

  return patterns.some((pattern) => pattern.test(cleaned));
}

/**
 * Validate name (minimum length, no numbers)
 */
export function validateName(name: string, minLength = 2): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  // At least minLength chars, no numbers
  return trimmed.length >= minLength && !/\d/.test(trimmed);
}

/**
 * Validate Hungarian tax number (adószám)
 * Format: 12345678-1-23
 */
export function validateTaxNumber(taxNumber: string): boolean {
  if (!taxNumber) return false;
  const cleaned = taxNumber.replace(/[\s\-]/g, '');
  return /^[0-9]{8}[0-9][0-9]{2}$/.test(cleaned);
}

/**
 * Validate Hungarian postal code
 * Format: 4 digits, starts with 1-9
 */
export function validatePostalCode(postalCode: string): boolean {
  if (!postalCode) return false;
  const cleaned = postalCode.replace(/\s/g, '');
  return /^[1-9][0-9]{3}$/.test(cleaned);
}

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if value is empty (null, undefined, empty string, whitespace only)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Field validator configuration
 */
export interface FieldValidator {
  required?: boolean;
  requiredMessage?: string;
  validate?: (value: unknown) => boolean;
  validateMessage?: string;
  minLength?: number;
  minLengthMessage?: string;
  maxLength?: number;
  maxLengthMessage?: string;
  pattern?: RegExp;
  patternMessage?: string;
}

/**
 * Validate form data against schema
 */
export function validateForm(
  data: Record<string, unknown>,
  schema: Record<string, FieldValidator>
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const strValue = typeof value === 'string' ? value : String(value || '');

    // Required check
    if (rules.required && isEmpty(value)) {
      errors[field] = rules.requiredMessage || `${field} kötelező`;
      continue;
    }

    // Skip other validations if empty and not required
    if (isEmpty(value)) continue;

    // Min length
    if (rules.minLength && strValue.length < rules.minLength) {
      errors[field] = rules.minLengthMessage || `Minimum ${rules.minLength} karakter szükséges`;
      continue;
    }

    // Max length
    if (rules.maxLength && strValue.length > rules.maxLength) {
      errors[field] = rules.maxLengthMessage || `Maximum ${rules.maxLength} karakter engedélyezett`;
      continue;
    }

    // Pattern
    if (rules.pattern && !rules.pattern.test(strValue)) {
      errors[field] = rules.patternMessage || `Érvénytelen formátum`;
      continue;
    }

    // Custom validation
    if (rules.validate && !rules.validate(value)) {
      errors[field] = rules.validateMessage || `Érvénytelen érték`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Common validation schemas
 */
export const commonValidators = {
  name: {
    required: true,
    requiredMessage: 'Név kötelező',
    minLength: 2,
    minLengthMessage: 'A név legalább 2 karakter legyen',
    validate: validateName,
    validateMessage: 'Érvénytelen név',
  },
  email: {
    required: true,
    requiredMessage: 'Email cím kötelező',
    validate: validateEmail,
    validateMessage: 'Érvénytelen email cím',
  },
  phone: {
    required: true,
    requiredMessage: 'Telefonszám kötelező',
    validate: validatePhone,
    validateMessage: 'Érvénytelen telefonszám',
  },
  message: {
    required: false,
    maxLength: 2000,
    maxLengthMessage: 'Az üzenet maximum 2000 karakter lehet',
  },
  gdprConsent: {
    required: true,
    requiredMessage: 'Az adatvédelmi szabályzat elfogadása kötelező',
    validate: (v: unknown) => v === true || v === 'true',
    validateMessage: 'Az adatvédelmi szabályzat elfogadása kötelező',
  },
} as const;
