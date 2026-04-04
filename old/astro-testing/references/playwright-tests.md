# Playwright E2E Tests

## Setup

```bash
npm init playwright@latest
```

## Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Desktop Safari', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Critical Path Tests

```typescript
// tests/critical-paths.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Critical Paths', () => {
  test('1. homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/./);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('2. primary CTA works', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /quote|contact/i }).first();
    await cta.click();
    await expect(page.locator('form')).toBeVisible();
  });

  test('3-5. form submission flow', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '07123456789');
    await page.fill('textarea[name="message"]', 'Test message');
    await page.check('input[name="privacyConsent"]');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/thank-you|success/);
  });

  test('8. phone link works', async ({ page }) => {
    await page.goto('/');
    const phoneLink = page.locator('a[href^="tel:"]').first();
    const href = await phoneLink.getAttribute('href');
    expect(href).toMatch(/^tel:\+?[\d\s-]+$/);
  });

  test('9. mobile menu works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const menuButton = page.getByRole('button', { name: /menu/i });
    await menuButton.click();
    
    await expect(page.locator('nav')).toBeVisible();
  });

  test('10. 404 page exists', async ({ page }) => {
    const response = await page.goto('/nonexistent-page-xyz');
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText(/not found|404/i);
  });
});
```

## Negative Tests (False Positive Guard)

```typescript
// tests/negative.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Negative Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('empty form shows error', async ({ page }) => {
    await page.click('button[type="submit"]');
    const error = page.locator('[data-error], .error, [aria-invalid="true"]');
    await expect(error.first()).toBeVisible();
  });

  test('invalid email shows error', async ({ page }) => {
    await page.fill('input[name="email"]', 'not-an-email');
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/thank-you/);
  });

  test('honeypot blocks spam', async ({ page }) => {
    await page.fill('input[name="website"]', 'spam', { force: true });
    await page.fill('input[name="name"]', 'Test');
    await page.fill('input[name="email"]', 'test@test.com');
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/thank-you/);
  });

  test('missing consent blocks submit', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test');
    await page.fill('input[name="email"]', 'test@test.com');
    // Don't check privacy consent
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/thank-you/);
  });
});
```

## Data Integrity Tests

```typescript
// tests/data-integrity.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Data Integrity', () => {
  test('form data reaches backend', async ({ page, request }) => {
    await page.goto('/');
    
    const testEmail = `test-${Date.now()}@example.com`;
    
    await page.fill('input[name="name"]', 'Data Test');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="phone"]', '07123456789');
    await page.check('input[name="privacyConsent"]');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/thank-you/);
    
    // Verify in backend (adjust endpoint)
    // const response = await request.get(`/api/leads?email=${testEmail}`);
    // expect(response.ok()).toBeTruthy();
  });
});
```

## Accessibility Tests

```typescript
// tests/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage passes a11y', async ({ page }) => {
    await page.goto('/');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    const critical = results.violations.filter(v => v.impact === 'critical');
    const serious = results.violations.filter(v => v.impact === 'serious');
    const moderate = results.violations.filter(v => v.impact === 'moderate');
    
    expect(critical).toHaveLength(0);
    expect(serious).toHaveLength(0);
    expect(moderate.length).toBeLessThanOrEqual(2);
  });

  test('form is accessible', async ({ page }) => {
    await page.goto('/');
    
    const results = await new AxeBuilder({ page })
      .include('form')
      .analyze();
    
    expect(results.violations).toHaveLength(0);
  });
});
```

## Running Tests

```bash
# All tests
npx playwright test

# Specific file
npx playwright test tests/critical-paths.spec.ts

# With UI
npx playwright test --ui

# Headed
npx playwright test --headed

# Specific browser
npx playwright test --project="Mobile Chrome"
```

## CI Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```
