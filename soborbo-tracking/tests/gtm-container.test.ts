import { describe, it, expect } from 'vitest';
// Importing the JSON proves it parses (resolveJsonModule) and runs in jsdom
// without node:fs. It must also cover the canonical browser side.
import container from '../gtm/container.json';

describe('gtm/container.json — importable export', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = container as any;
  const cv = c.containerVersion;

  it('has the GTM export schema shape', () => {
    expect(c.exportFormatVersion).toBe(2);
    expect(cv.container.usageContext).toContain('WEB');
    expect(Array.isArray(cv.tag)).toBe(true);
    expect(Array.isArray(cv.trigger)).toBe(true);
    expect(Array.isArray(cv.variable)).toBe(true);
  });

  it('emits every canonical GA4 event name (CANONICAL-EVENTS.md)', () => {
    const ga4Names = cv.tag
      .filter((t: { type: string }) => t.type === 'gaawe')
      .map((t: { parameter: { key: string; value: string }[] }) =>
        t.parameter.find((p) => p.key === 'eventName')?.value);
    for (const name of [
      'contact_form_submit', 'callback_conversion', 'phone_conversion',
      'email_conversion', 'whatsapp_conversion', 'quote_calculator_conversion',
    ]) {
      expect(ga4Names).toContain(name);
    }
  });

  it('has a Custom Event trigger per canonical dataLayer event', () => {
    const events = cv.trigger
      .filter((t: { type: string }) => t.type === 'CUSTOM_EVENT')
      .map((t: { customEventFilter: { parameter: { key: string; value: string }[] }[] }) =>
        t.customEventFilter[0].parameter.find((p) => p.key === 'arg1')?.value);
    for (const name of [
      'lead_submit', 'contact_submit', 'callback_click', 'phone_click',
      'email_click', 'whatsapp_click', 'calculator_complete',
    ]) {
      expect(events).toContain(name);
    }
  });

  it('Meta Pixel tags use the shared event_id for dedup', () => {
    const pixelTags = cv.tag.filter((t: { name: string }) => t.name.startsWith('Meta Pixel - '));
    const lead = pixelTags.find((t: { name: string }) => t.name.endsWith('Lead'));
    const html = lead.parameter.find((p: { key: string }) => p.key === 'html').value as string;
    expect(html).toContain('{{DLV - event_id}}');
  });

  it('User-Provided Data variable reads the side-channel, NOT a Data Layer Variable', () => {
    const upd = cv.variable.find((v: { name: string }) => v.name === 'CJS - User Provided Data');
    expect(upd.type).toBe('jsm');
    const js = upd.parameter.find((p: { key: string }) => p.key === 'javascript').value as string;
    expect(js).toContain('window.__sbUserData');
  });

  it('ad-platform tags gate on ad consent; GA4 tags on analytics consent', () => {
    const ads = cv.tag.find((t: { type: string }) => t.type === 'awct');
    const adTypes = ads.consentSettings.consentType.list.map((x: { value: string }) => x.value);
    expect(adTypes).toContain('ad_storage');
    expect(adTypes).toContain('ad_user_data');

    const ga4 = cv.tag.find((t: { name: string }) => t.name === 'GA4 - contact_form_submit');
    const anTypes = ga4.consentSettings.consentType.list.map((x: { value: string }) => x.value);
    expect(anTypes).toContain('analytics_storage');
  });
});
