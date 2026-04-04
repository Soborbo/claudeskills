/**
 * Canonical types for form submissions.
 * Single source of truth — used by schemas, handler, email, storage.
 */

export type Locale = 'en-GB' | 'hu-HU';

export type FormSubmission = {
  leadId: string;
  formId: string;
  sourcePage: string;
  submittedAt: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  ipHash: string;
  userAgent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
};
