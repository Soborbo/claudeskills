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
  /**
   * Marketing/ad-tracking consent (CookieYes `marketing` category), captured
   * from a hidden field the form populates at submit time. Gates whether the
   * CRM lets the initial ad conversion fire (`consent.marketing` → CRM
   * `adAllowed` → gateway). Distinct from `consent` (privacy-policy accept).
   */
  marketingConsent?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  eventId?: string;
  timestamp: string;
  ip?: string;
}
