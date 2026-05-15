import { expect, test } from '@playwright/test';

test.describe('consent granted', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.google_tag_data = {
        ics: {
          entries: {
            ad_storage: { update: 'granted' },
            ad_user_data: { update: 'granted' },
            ad_personalization: { update: 'granted' },
            analytics_storage: { update: 'granted' },
          },
        },
      };
    });
  });

  test('phone click after primary completion: upgrade flow + Meta CAPI hit + no PII leak', async ({
    page,
  }) => {
    const capiCalls: Array<Record<string, unknown>> = [];
    await page.route('**/api/meta/capi', async (route) => {
      const body = await route.request().postDataJSON();
      capiCalls.push(body);
      return route.fulfill({ status: 204 });
    });

    await page.goto('/');

    // Fill + submit to mark primary completion.
    await page.fill('#email-field', 'alice@example.com');
    await page.fill('#phone-field', '+447700900123');
    await page.click('#submit-btn');

    // Click phone to upgrade.
    await page.click('#tel-link');

    const phoneEvents = await page.evaluate(() =>
      (window.dataLayer || []).filter((e: { event?: string }) => e.event === 'phone_conversion'),
    );
    expect(phoneEvents).toHaveLength(1);
    expect(phoneEvents[0]).toMatchObject({
      source: 'after_primary',
      value: 49.99,
      currency: 'EUR',
    });

    // Meta CAPI was hit, payload carries consent_state=granted.
    expect(capiCalls.length).toBeGreaterThanOrEqual(1);
    const lead = capiCalls.find((c) => c.event_name === 'Lead' || c.event_name === 'Contact');
    expect(lead).toBeDefined();
    expect((lead as { consent_state?: Record<string, string> }).consent_state).toMatchObject({
      ad_storage: 'granted',
      ad_user_data: 'granted',
    });

    // dataLayer carries no raw email or phone.
    const leaks = await page.evaluate(() => window.__piiLeaks);
    expect(leaks).toEqual([]);
  });
});
