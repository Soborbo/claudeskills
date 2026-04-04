# Synthetic Monitoring

## Automated Lighthouse Cron Job

```typescript
// scripts/synthetic-monitor.ts
// Run via cron job or scheduled function

import Lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';

const URLS = [
  'https://yoursite.com/',
  'https://yoursite.com/services/',
  'https://yoursite.com/contact/'
];

const THRESHOLDS = {
  performance: 90,
  lcp: 2500,
  cls: 0.1
};

async function runSyntheticTest(url: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const result = await Lighthouse(url, {
    port: (new URL(browser.wsEndpoint())).port,
    output: 'json',
    onlyCategories: ['performance']
  });

  await browser.close();

  const lhr = result.lhr;
  const score = lhr.categories.performance.score * 100;
  const lcp = lhr.audits['largest-contentful-paint'].numericValue;
  const cls = lhr.audits['cumulative-layout-shift'].numericValue;

  return { url, score, lcp, cls, timestamp: new Date().toISOString() };
}

async function main() {
  console.log('Running synthetic performance tests...\n');

  for (const url of URLS) {
    const result = await runSyntheticTest(url);

    console.log(`${url}`);
    console.log(`  Score: ${result.score}/100`);
    console.log(`  LCP: ${result.lcp}ms`);
    console.log(`  CLS: ${result.cls}`);

    // Check thresholds and alert
    if (result.score < THRESHOLDS.performance) {
      console.log(`  ⚠️ Performance score below threshold!`);
      // Send alert
    }
    if (result.lcp > THRESHOLDS.lcp) {
      console.log(`  ⚠️ LCP above threshold!`);
    }
    if (result.cls > THRESHOLDS.cls) {
      console.log(`  ⚠️ CLS above threshold!`);
    }

    console.log('');
  }
}

main().catch(console.error);
```

## Scheduled Runs

### GitHub Actions (Scheduled)

```yaml
# .github/workflows/scheduled-perf.yml
name: Scheduled Performance Check

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  synthetic-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run synthetic tests
        run: npm run perf:synthetic
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Vercel Cron

```typescript
// api/cron/performance.ts
export const config = {
  runtime: 'edge',
  // Run every 6 hours
  schedule: '0 */6 * * *'
};

export default async function handler() {
  // Run synthetic tests
  // Store results
  // Send alerts if needed

  return new Response('OK', { status: 200 });
}
```

## Performance Dashboard

```astro
---
// src/pages/admin/performance.astro
// Simple internal dashboard

const mockData = {
  current: { lcp: 2100, fcp: 1200, cls: 0.05, inp: 150 },
  trend: [
    { date: '2024-01-15', lcp: 2200, fcp: 1300, cls: 0.06 },
    { date: '2024-01-16', lcp: 2100, fcp: 1200, cls: 0.05 },
    { date: '2024-01-17', lcp: 2050, fcp: 1150, cls: 0.04 }
  ]
};
---

<div class="dashboard">
  <h1>Performance Dashboard</h1>

  <div class="metrics-grid">
    <div class="metric-card">
      <h3>LCP</h3>
      <p class="value">{mockData.current.lcp}ms</p>
      <p class="status good">Good (&lt;2500ms)</p>
    </div>
    <div class="metric-card">
      <h3>FCP</h3>
      <p class="value">{mockData.current.fcp}ms</p>
      <p class="status good">Good (&lt;1800ms)</p>
    </div>
    <div class="metric-card">
      <h3>CLS</h3>
      <p class="value">{mockData.current.cls}</p>
      <p class="status good">Good (&lt;0.1)</p>
    </div>
    <div class="metric-card">
      <h3>INP</h3>
      <p class="value">{mockData.current.inp}ms</p>
      <p class="status good">Good (&lt;200ms)</p>
    </div>
  </div>
</div>

<style>
  .dashboard {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .metric-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
  }

  .metric-card h3 {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 0.5rem 0;
  }

  .value {
    font-size: 2rem;
    font-weight: 700;
    margin: 0.5rem 0;
  }

  .status {
    font-size: 0.875rem;
    margin: 0;
  }

  .status.good { color: #10b981; }
  .status.warn { color: #f59e0b; }
  .status.poor { color: #ef4444; }
</style>
```

## Monitoring Schedule Recommendations

- **Production sites**: Every 1-2 hours
- **High-traffic sites**: Every 30 minutes
- **During deployments**: Before and after
- **Post-incident**: Every 15 minutes until stable
