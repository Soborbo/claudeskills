import { expect, test } from '@playwright/test';

/**
 * Negative-control test for the PII scanner itself: we INJECT a known
 * PII-shaped push and assert the scanner catches it. If this test fails,
 * the scanner is broken and every "no PII" assertion in other specs is
 * lying.
 */
test('PII scanner catches an injected email + phone push (self-test)', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.dataLayer.push({ event: 'leak_test', user_email: 'leak@example.com' });
    window.dataLayer.push({ event: 'leak_test', user_phone: '+447700900123' });
  });

  const leaks = await page.evaluate(() => window.__piiLeaks);
  expect(leaks.length).toBeGreaterThanOrEqual(2);
});

/**
 * Positive control: a clean session that does NOT leak anything.
 */
test('Default flow leaves dataLayer free of PII', async ({ page }) => {
  await page.goto('/');
  await page.fill('#email-field', 'alice@example.com');
  await page.fill('#phone-field', '+447700900123');
  await page.click('#step-1');
  await page.click('#submit-btn');

  const leaks = await page.evaluate(() => window.__piiLeaks);
  expect(leaks).toEqual([]);
});
