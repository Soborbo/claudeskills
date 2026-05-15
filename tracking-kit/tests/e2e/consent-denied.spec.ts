import { expect, test } from '@playwright/test';

test.describe('consent denied', () => {
  test('phone click pushes phone_conversion BUT no Meta CAPI hit', async ({ page }) => {
    const capiHits: unknown[] = [];
    await page.route('**/api/meta/capi', (route) => {
      capiHits.push(route.request().postData());
      return route.fulfill({ status: 204 });
    });

    // Default consent is denied (set in fixtures/index.html).
    await page.goto('/');

    // Fill the form (no consent → no localStorage persistence).
    await page.fill('#email-field', 'denied@example.com');
    await page.fill('#phone-field', '+447700900123');

    // Click the phone link to fire a standalone phone_conversion.
    await page.click('#tel-link');

    const phoneEvents = await page.evaluate(() =>
      (window.dataLayer || []).filter((e: { event?: string }) => e.event === 'phone_conversion'),
    );
    expect(phoneEvents).toHaveLength(1);

    // Meta CAPI must not have been hit (consent denied).
    expect(capiHits).toHaveLength(0);

    // localStorage user data blob must be empty (no ad_storage consent).
    const stored = await page.evaluate(() => localStorage.getItem('tk_user_data'));
    expect(stored).toBeNull();

    // No PII in dataLayer.
    const leaks = await page.evaluate(() => window.__piiLeaks);
    expect(leaks).toEqual([]);
  });
});
