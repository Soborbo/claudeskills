/**
 * @leadgen/conversion-tracking - Event Schema Validation (Dev Only)
 *
 * Validates event data in development mode.
 */

import { log } from './constants';

// =============================================================================
// Validation Rules
// =============================================================================

interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'url';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

interface ValidationSchema {
  [eventType: string]: ValidationRule[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/;
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

// Default schemas for built-in events
const defaultSchemas: ValidationSchema = {
  quote_request: [
    { field: 'email', type: 'email', required: true },
    { field: 'phone', type: 'phone', required: false },
    { field: 'value', type: 'number', required: false, min: 0 },
    { field: 'currency', type: 'string', required: false, minLength: 3, maxLength: 3 },
  ],
  callback_request: [
    { field: 'email', type: 'email', required: true },
    { field: 'phone', type: 'phone', required: false },
    { field: 'value', type: 'number', required: false, min: 0 },
  ],
  contact_form: [
    { field: 'email', type: 'email', required: true },
    { field: 'phone', type: 'phone', required: false },
  ],
  phone_click: [
    { field: 'phone', type: 'phone', required: false },
    { field: 'value', type: 'number', required: false, min: 0 },
  ],
  calculator_step: [
    { field: 'step', type: 'number', required: true, min: 1 },
  ],
  calculator_option: [
    { field: 'field', type: 'string', required: true, minLength: 1 },
    { field: 'value', type: 'string', required: true },
  ],
  form_abandon: [
    { field: 'form_id', type: 'string', required: true },
    { field: 'last_field', type: 'string', required: false },
  ],
};

// Custom schemas added at runtime
const customSchemas: ValidationSchema = {};

// =============================================================================
// Validation Logic
// =============================================================================

export interface ValidationError {
  field: string;
  message: string;
  value: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

function validateField(
  value: unknown,
  rule: ValidationRule
): ValidationError | null {
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return {
      field: rule.field,
      message: `${rule.field} is required`,
      value,
    };
  }

  // Skip validation if not required and empty
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return null;
  }

  // Type validation
  switch (rule.type) {
    case 'string':
      if (typeof value !== 'string') {
        return { field: rule.field, message: `${rule.field} must be a string`, value };
      }
      if (rule.minLength && value.length < rule.minLength) {
        return { field: rule.field, message: `${rule.field} must be at least ${rule.minLength} characters`, value };
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return { field: rule.field, message: `${rule.field} must be at most ${rule.maxLength} characters`, value };
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return { field: rule.field, message: `${rule.field} has invalid format`, value };
      }
      break;

    case 'number':
      const num = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(num)) {
        return { field: rule.field, message: `${rule.field} must be a number`, value };
      }
      if (rule.min !== undefined && num < rule.min) {
        return { field: rule.field, message: `${rule.field} must be at least ${rule.min}`, value };
      }
      if (rule.max !== undefined && num > rule.max) {
        return { field: rule.field, message: `${rule.field} must be at most ${rule.max}`, value };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return { field: rule.field, message: `${rule.field} must be a boolean`, value };
      }
      break;

    case 'email':
      if (typeof value !== 'string' || !EMAIL_REGEX.test(value)) {
        return { field: rule.field, message: `${rule.field} must be a valid email`, value };
      }
      break;

    case 'phone':
      if (typeof value !== 'string' || !PHONE_REGEX.test(value)) {
        return { field: rule.field, message: `${rule.field} must be a valid phone number`, value };
      }
      break;

    case 'url':
      if (typeof value !== 'string' || !URL_REGEX.test(value)) {
        return { field: rule.field, message: `${rule.field} must be a valid URL`, value };
      }
      break;
  }

  return null;
}

/**
 * Validate event data against schema
 */
export function validateEvent(
  eventType: string,
  data: Record<string, unknown>
): ValidationResult {
  const schema = customSchemas[eventType] || defaultSchemas[eventType];

  if (!schema) {
    // No schema defined - pass validation
    return { valid: true, errors: [] };
  }

  const errors: ValidationError[] = [];

  for (const rule of schema) {
    const error = validateField(data[rule.field], rule);
    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate and log warnings in dev mode
 */
export function validateAndWarn(
  eventType: string,
  data: Record<string, unknown>
): boolean {
  // Only validate in dev mode
  if (typeof import.meta !== 'undefined' && !import.meta.env?.DEV) {
    return true;
  }

  const result = validateEvent(eventType, data);

  if (!result.valid) {
    console.warn(
      `[Tracking Validation] Event "${eventType}" has validation errors:`,
      result.errors
    );
    log('Validation errors:', result.errors);
  }

  return result.valid;
}

// =============================================================================
// Schema Management
// =============================================================================

/**
 * Register a custom validation schema
 */
export function registerSchema(eventType: string, rules: ValidationRule[]): void {
  customSchemas[eventType] = rules;
  log(`Schema registered for: ${eventType}`);
}

/**
 * Get schema for an event type
 */
export function getSchema(eventType: string): ValidationRule[] | undefined {
  return customSchemas[eventType] || defaultSchemas[eventType];
}

/**
 * Remove a custom schema
 */
export function unregisterSchema(eventType: string): boolean {
  if (customSchemas[eventType]) {
    delete customSchemas[eventType];
    return true;
  }
  return false;
}

/**
 * List all registered schemas
 */
export function listSchemas(): string[] {
  return [...Object.keys(defaultSchemas), ...Object.keys(customSchemas)];
}
