export type Locale = 'en-GB' | 'hu-HU';

export interface FormSubmission {
  leadId: string;
  formId: string;
  sourcePage: string;
  name: string;
  email: string;
  phone: string;
  postcode?: string;
  message?: string;
  consent: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  eventId?: string;
  timestamp: string;
  ip?: string;
}
