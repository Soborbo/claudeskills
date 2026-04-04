/**
 * @leadgen/calculator - Type Definitions
 *
 * Config-driven multi-step calculator types.
 */

// =============================================================================
// Step Types
// =============================================================================

/** Base step configuration */
export interface BaseStep {
  /** Unique step identifier */
  id: string;
  /** Step title/question */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Is this step required? */
  required?: boolean;
  /** Auto-advance to next step after selection */
  autoNext?: boolean;
  /** Step icon (emoji or icon name) */
  icon?: string;
  /** Custom validation function name */
  validation?: string;
}

/** Single-select step (radio buttons/cards) */
export interface SingleSelectStep extends BaseStep {
  type: 'single-select';
  options: SelectOption[];
  /** Layout: 'grid' (default) or 'list' */
  layout?: 'grid' | 'list';
  /** Grid columns (2, 3, or 4) */
  columns?: 2 | 3 | 4;
}

/** Multi-select step (checkboxes) */
export interface MultiSelectStep extends BaseStep {
  type: 'multi-select';
  options: SelectOption[];
  /** Minimum selections required */
  minSelect?: number;
  /** Maximum selections allowed */
  maxSelect?: number;
  layout?: 'grid' | 'list';
  columns?: 2 | 3 | 4;
}

/** Number input step */
export interface NumberStep extends BaseStep {
  type: 'number';
  min?: number;
  max?: number;
  default?: number;
  step?: number;
  /** Suffix text (e.g., 'm²', 'db') */
  suffix?: string;
  /** Prefix text (e.g., 'kb.') */
  prefix?: string;
  /** Show +/- buttons */
  showButtons?: boolean;
  /** Pricing per unit */
  pricing?: { perUnit: number };
}

/** Range slider step */
export interface RangeStep extends BaseStep {
  type: 'range';
  min: number;
  max: number;
  default?: number;
  step?: number;
  suffix?: string;
  /** Show value labels */
  showLabels?: boolean;
  /** Custom label formatter */
  labelFormat?: string;
}

/** Text input step */
export interface TextStep extends BaseStep {
  type: 'text';
  placeholder?: string;
  /** Input type: text, email, tel */
  inputType?: 'text' | 'email' | 'tel';
  /** Minimum length */
  minLength?: number;
  /** Maximum length */
  maxLength?: number;
  /** Regex pattern */
  pattern?: string;
}

/** Address/postcode step with city autofill */
export interface AddressStep extends BaseStep {
  type: 'address';
  /** Show city field (autofilled from postcode) */
  showCity?: boolean;
  /** Country code for postcode lookup */
  countryCode?: string;
  /** Placeholder for postcode */
  postcodePlaceholder?: string;
  /** Placeholder for city */
  cityPlaceholder?: string;
}

/** Date picker step */
export interface DateStep extends BaseStep {
  type: 'date';
  /** Minimum date ('today', 'today+N', or ISO date) */
  minDate?: string;
  /** Maximum date */
  maxDate?: string;
  /** Disable weekends */
  disableWeekends?: boolean;
  /** Weekend pricing multiplier */
  weekendPricing?: number;
  /** Disabled dates (ISO strings) */
  disabledDates?: string[];
}

/** Contact form step (always final) */
export interface ContactStep extends BaseStep {
  type: 'contact';
  /** Fields to show */
  fields: Array<'name' | 'email' | 'phone' | 'company' | 'message'>;
  /** Privacy policy URL */
  privacyUrl: string;
  /** Terms URL (optional) */
  termsUrl?: string;
  /** GDPR consent text */
  consentText?: string;
  /** Submit button text */
  submitText?: string;
}

/** Dropdown select step */
export interface DropdownStep extends BaseStep {
  type: 'dropdown';
  options: SelectOption[];
  placeholder?: string;
}

/** All step types union */
export type CalculatorStep =
  | SingleSelectStep
  | MultiSelectStep
  | NumberStep
  | RangeStep
  | TextStep
  | AddressStep
  | DateStep
  | ContactStep
  | DropdownStep;

// =============================================================================
// Options
// =============================================================================

/** Option for single/multi select */
export interface SelectOption {
  /** Option value (stored in answers) */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon/emoji */
  icon?: string;
  /** Optional image URL */
  image?: string;
  /** Optional description */
  description?: string;
  /** Price to add */
  price?: number;
  /** Multiplier for base price */
  multiplier?: number;
  /** Is this option disabled? */
  disabled?: boolean;
}

// =============================================================================
// Pricing
// =============================================================================

/** Price breakdown line item */
export interface PriceBreakdownItem {
  key: string;
  label: string;
  amount: number;
  type: 'base' | 'multiplier' | 'addon' | 'discount' | 'distance';
}

/** Price calculation result */
export interface PriceResult {
  total: number;
  currency: string;
  breakdown: PriceBreakdownItem[];
  formatted: string;
  /** Min/max range if using variance */
  range?: {
    min: number;
    max: number;
    formatted: string;
  };
}

/** Pricing configuration */
export interface PricingConfig {
  /** Base price */
  base: number;
  /** Currency code */
  currency?: string;
  /** Price per km (for distance calculations) */
  distancePerKm?: number;
  /** Variance for price range (e.g., 0.15 = ±15%) */
  variance?: number;
  /** Custom formula function */
  formula?: (data: PricingData) => number;
}

/** Data passed to pricing formula */
export interface PricingData {
  base: number;
  currency: string;
  distancePerKm: number;
  distance?: number;
  steps: Record<string, StepAnswer>;
  answers: Record<string, unknown>;
}

/** Answer for a step (including metadata) */
export interface StepAnswer {
  value: unknown;
  option?: SelectOption;
  options?: SelectOption[];
  multiplier?: number;
  price?: number;
  pricing?: { perUnit: number };
  isWeekend?: boolean;
}

// =============================================================================
// Result Configuration
// =============================================================================

/** Result page configuration */
export interface ResultConfig {
  /** Show price breakdown */
  showBreakdown?: boolean;
  /** Show "from X" pricing instead of exact */
  showRange?: boolean;
  /** CTA button text */
  ctaText?: string;
  /** CTA button URL */
  ctaUrl?: string;
  /** Secondary CTA text */
  secondaryCtaText?: string;
  /** Secondary CTA URL */
  secondaryCtaUrl?: string;
  /** Disclaimer text */
  disclaimer?: string;
  /** Show social proof on result */
  showSocialProof?: boolean;
}

// =============================================================================
// Calculator Configuration
// =============================================================================

/** Complete calculator configuration */
export interface CalculatorConfig {
  /** Unique calculator ID */
  id: string;
  /** Calculator title */
  title: string;
  /** Calculator description */
  description?: string;
  /** Currency code (default: HUF) */
  currency?: string;
  /** Locale for formatting (default: hu-HU) */
  locale?: string;
  /** Steps configuration */
  steps: CalculatorStep[];
  /** Pricing configuration */
  pricing?: PricingConfig;
  /** Result page configuration */
  result?: ResultConfig;
  /** Form submission endpoint */
  submitEndpoint?: string;
  /** Thank you page URL */
  thankYouUrl?: string;
  /** Enable debug mode */
  debug?: boolean;
}

// =============================================================================
// State
// =============================================================================

/** Calculator runtime state */
export interface CalculatorState {
  /** Current step index */
  currentStep: number;
  /** All answers keyed by step ID */
  answers: Record<string, unknown>;
  /** Calculated price (if pricing enabled) */
  price?: PriceResult;
  /** Generated quote ID */
  quoteId?: string;
  /** Timestamp when started */
  startedAt: number;
  /** Is submitting */
  isSubmitting?: boolean;
  /** Submission error */
  error?: string;
}

// =============================================================================
// Events
// =============================================================================

/** GTM event types */
export type CalculatorEventType =
  | 'calculator_start'
  | 'calculator_step'
  | 'calculator_option'
  | 'calculator_submit'
  | 'calculator_value'
  | 'calculator_complete';

/** GTM event data */
export interface CalculatorEvent {
  event: CalculatorEventType;
  calculator_name: string;
  step?: string;
  step_index?: number;
  value?: string | number;
  quote_id?: string;
  currency?: string;
}

// =============================================================================
// Validation
// =============================================================================

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/** Validation limits from skill */
export const CALCULATOR_LIMITS = {
  maxSteps: 7,
  maxFieldsPerStep: 4,
  maxOptionsPerQuestion: 6,
} as const;
