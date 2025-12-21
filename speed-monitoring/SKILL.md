---
name: speed-monitoring
description: Performance monitoring and regression prevention. Lighthouse CI, performance budgets, Core Web Vitals monitoring, alerting. Keep sites fast over time.
---

# Speed Monitoring Skill

## Purpose

Provides patterns for continuous performance monitoring to prevent speed regressions and maintain Core Web Vitals scores.

## Core Rules

1. **Budget before build** — Set performance budgets upfront
2. **Monitor real users** — Lab data ≠ field data
3. **Alert on regression** — Catch issues before users do
4. **Block bad deploys** — CI fails on performance regression
5. **Track over time** — Trends matter more than snapshots

## Performance Budgets

```javascript
// budget.json - Lighthouse CI budget file
[
  {
    "path": "/*",
    "timings": [
      { "metric": "first-contentful-paint", "budget": 1800 },
      { "metric": "largest-contentful-paint", "budget": 2500 },
      { "metric": "interactive", "budget": 3800 },
      { "metric": "total-blocking-time", "budget": 200 },
      { "metric": "cumulative-layout-shift", "budget": 0.1 },
      { "metric": "speed-index", "budget": 3400 }
    ],
    "resourceSizes": [
      { "resourceType": "document", "budget": 50 },
      { "resourceType": "script", "budget": 200 },
      { "resourceType": "stylesheet", "budget": 50 },
      { "resourceType": "image", "budget": 500 },
      { "resourceType": "font", "budget": 100 },
      { "resourceType": "total", "budget": 800 }
    ],
    "resourceCounts": [
      { "resourceType": "script", "budget": 10 },
      { "resourceType": "stylesheet", "budget": 3 },
      { "resourceType": "font", "budget": 4 },
      { "resourceType": "third-party", "budget": 5 }
    ]
  },
  {
    "path": "/",
    "timings": [
      { "metric": "largest-contentful-paint", "budget": 2000 }
    ]
  }
]
```

## Lighthouse CI Setup

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Start server
        run: npm run preview &

      - name: Wait for server
        run: npx wait-on http://localhost:4321

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v11
        with:
          configPath: ./lighthouserc.json
          uploadArtifacts: true
          temporaryPublicStorage: true
```

### Lighthouse CI Config

```javascript
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:4321/",
        "http://localhost:4321/services/",
        "http://localhost:4321/contact/",
        "http://localhost:4321/quote/"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "throttling": {
          "cpuSlowdownMultiplier": 1
        }
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

## Core Web Vitals Monitoring

```typescript
// src/lib/performance/web-vitals.ts
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

interface VitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

function sendToAnalytics(metric: VitalsMetric): void {
  // Send to GA4
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Send to custom endpoint
  const body = JSON.stringify({
    ...metric,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });

  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', body);
  } else {
    fetch('/api/vitals', {
      method: 'POST',
      body,
      keepalive: true
    });
  }
}

export function initWebVitals(): void {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

### Web Vitals API Endpoint

```typescript
// src/pages/api/vitals.ts
import type { APIRoute } from 'astro';

interface VitalsData {
  name: string;
  value: number;
  rating: string;
  url: string;
  userAgent: string;
  timestamp: string;
}

export const POST: APIRoute = async ({ request }) => {
  const data: VitalsData = await request.json();

  // Store in database or send to monitoring service
  // Example: Send to a time-series database like InfluxDB
  // Or to a service like Datadog, New Relic, etc.

  console.log('Web Vital:', {
    metric: data.name,
    value: data.value,
    rating: data.rating,
    page: new URL(data.url).pathname,
    timestamp: data.timestamp
  });

  // Alert on poor scores
  if (data.rating === 'poor') {
    await sendAlert({
      metric: data.name,
      value: data.value,
      url: data.url,
      timestamp: data.timestamp
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200
  });
};

async function sendAlert(data: any): Promise<void> {
  // Send to Slack, PagerDuty, email, etc.
  if (process.env.SLACK_WEBHOOK_URL) {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `⚠️ Poor Web Vital detected!\n*${data.metric}*: ${data.value}\nPage: ${data.url}`
      })
    });
  }
}
```

## Bundle Size Monitoring

```javascript
// scripts/bundle-stats.js
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { globSync } from 'glob';
import { gzipSync } from 'zlib';

const BUDGET = {
  js: 200 * 1024,      // 200KB
  css: 50 * 1024,      // 50KB
  total: 800 * 1024    // 800KB
};

function getFileSize(filePath) {
  const content = readFileSync(filePath);
  return {
    raw: content.length,
    gzip: gzipSync(content).length
  };
}

function analyzeBundles() {
  const jsFiles = globSync('dist/**/*.js');
  const cssFiles = globSync('dist/**/*.css');

  let totalJs = 0;
  let totalCss = 0;

  console.log('\n📦 Bundle Analysis\n');
  console.log('JavaScript:');
  jsFiles.forEach(file => {
    const size = getFileSize(file);
    totalJs += size.gzip;
    console.log(`  ${file}: ${(size.gzip / 1024).toFixed(2)}KB (gzip)`);
  });

  console.log('\nCSS:');
  cssFiles.forEach(file => {
    const size = getFileSize(file);
    totalCss += size.gzip;
    console.log(`  ${file}: ${(size.gzip / 1024).toFixed(2)}KB (gzip)`);
  });

  console.log('\n📊 Summary:');
  console.log(`  Total JS: ${(totalJs / 1024).toFixed(2)}KB / ${(BUDGET.js / 1024)}KB budget`);
  console.log(`  Total CSS: ${(totalCss / 1024).toFixed(2)}KB / ${(BUDGET.css / 1024)}KB budget`);
  console.log(`  Total: ${((totalJs + totalCss) / 1024).toFixed(2)}KB / ${(BUDGET.total / 1024)}KB budget`);

  // Check budgets
  const errors = [];
  if (totalJs > BUDGET.js) errors.push(`JS over budget by ${((totalJs - BUDGET.js) / 1024).toFixed(2)}KB`);
  if (totalCss > BUDGET.css) errors.push(`CSS over budget by ${((totalCss - BUDGET.css) / 1024).toFixed(2)}KB`);

  if (errors.length > 0) {
    console.log('\n❌ Budget exceeded:');
    errors.forEach(e => console.log(`  - ${e}`));
    process.exit(1);
  }

  console.log('\n✅ All budgets passed!');

  // Save for comparison
  const stats = {
    timestamp: new Date().toISOString(),
    js: totalJs,
    css: totalCss,
    total: totalJs + totalCss
  };

  writeFileSync('.bundle-stats.json', JSON.stringify(stats, null, 2));
}

analyzeBundles();
```

### Bundle Size CI Check

```yaml
# Add to .github/workflows/lighthouse.yml
      - name: Build and analyze bundle
        run: |
          npm run build
          node scripts/bundle-stats.js

      - name: Compare bundle size
        run: |
          if [ -f ".bundle-stats-main.json" ]; then
            node scripts/compare-bundles.js
          fi
```

## Real User Monitoring (RUM)

```typescript
// src/lib/performance/rum.ts
interface PerformanceMetrics {
  // Navigation timing
  dns: number;
  tcp: number;
  ttfb: number;
  download: number;
  domInteractive: number;
  domComplete: number;
  loadComplete: number;

  // Resource timing
  resourceCount: number;
  resourceSize: number;

  // Paint timing
  fp: number | null;
  fcp: number | null;

  // Memory (Chrome only)
  jsHeapSize?: number;
}

export function collectPerformanceMetrics(): PerformanceMetrics | null {
  if (typeof window === 'undefined') return null;

  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!nav) return null;

  const paint = performance.getEntriesByType('paint');
  const fp = paint.find(p => p.name === 'first-paint');
  const fcp = paint.find(p => p.name === 'first-contentful-paint');

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const resourceSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

  const metrics: PerformanceMetrics = {
    dns: nav.domainLookupEnd - nav.domainLookupStart,
    tcp: nav.connectEnd - nav.connectStart,
    ttfb: nav.responseStart - nav.requestStart,
    download: nav.responseEnd - nav.responseStart,
    domInteractive: nav.domInteractive - nav.fetchStart,
    domComplete: nav.domComplete - nav.fetchStart,
    loadComplete: nav.loadEventEnd - nav.fetchStart,
    resourceCount: resources.length,
    resourceSize,
    fp: fp ? fp.startTime : null,
    fcp: fcp ? fcp.startTime : null
  };

  // Chrome memory API
  if ((performance as any).memory) {
    metrics.jsHeapSize = (performance as any).memory.usedJSHeapSize;
  }

  return metrics;
}

// Collect and send on page load
window.addEventListener('load', () => {
  // Wait for LCP to be likely captured
  setTimeout(() => {
    const metrics = collectPerformanceMetrics();
    if (metrics) {
      navigator.sendBeacon('/api/rum', JSON.stringify({
        type: 'navigation',
        url: window.location.href,
        metrics,
        timestamp: new Date().toISOString(),
        connection: (navigator as any).connection?.effectiveType
      }));
    }
  }, 3000);
});
```

## Performance Regression Alerts

```typescript
// src/lib/performance/alerts.ts
interface PerformanceThresholds {
  lcp: { warn: number; critical: number };
  fcp: { warn: number; critical: number };
  cls: { warn: number; critical: number };
  inp: { warn: number; critical: number };
}

const THRESHOLDS: PerformanceThresholds = {
  lcp: { warn: 2500, critical: 4000 },
  fcp: { warn: 1800, critical: 3000 },
  cls: { warn: 0.1, critical: 0.25 },
  inp: { warn: 200, critical: 500 }
};

interface AlertConfig {
  slackWebhook?: string;
  pagerdutyKey?: string;
  emailTo?: string;
}

export async function checkAndAlert(
  metric: string,
  value: number,
  config: AlertConfig
): Promise<void> {
  const threshold = THRESHOLDS[metric as keyof PerformanceThresholds];
  if (!threshold) return;

  let severity: 'ok' | 'warn' | 'critical' = 'ok';
  if (value >= threshold.critical) {
    severity = 'critical';
  } else if (value >= threshold.warn) {
    severity = 'warn';
  }

  if (severity === 'ok') return;

  const message = {
    metric,
    value,
    threshold: threshold[severity],
    severity,
    timestamp: new Date().toISOString()
  };

  // Send alerts based on severity
  if (config.slackWebhook) {
    await sendSlackAlert(config.slackWebhook, message);
  }

  if (severity === 'critical' && config.pagerdutyKey) {
    await sendPagerDutyAlert(config.pagerdutyKey, message);
  }
}

async function sendSlackAlert(webhook: string, data: any): Promise<void> {
  const emoji = data.severity === 'critical' ? '🚨' : '⚠️';
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `${emoji} Performance ${data.severity.toUpperCase()}: ${data.metric} = ${data.value} (threshold: ${data.threshold})`
    })
  });
}

async function sendPagerDutyAlert(key: string, data: any): Promise<void> {
  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routing_key: key,
      event_action: 'trigger',
      payload: {
        summary: `Performance critical: ${data.metric} = ${data.value}`,
        severity: 'critical',
        source: 'web-vitals-monitor',
        custom_details: data
      }
    })
  });
}
```

## SpeedCurve / Calibre Alternative

```typescript
// Simple self-hosted performance tracking
// src/lib/performance/tracker.ts

interface PerformanceRecord {
  url: string;
  timestamp: string;
  device: 'mobile' | 'desktop';
  metrics: {
    lcp: number;
    fcp: number;
    cls: number;
    ttfb: number;
    inp?: number;
  };
  metadata: {
    connection?: string;
    country?: string;
    browser?: string;
  };
}

// Store in your database of choice
export async function storePerformanceRecord(record: PerformanceRecord): Promise<void> {
  // Example: Store in Supabase
  // await supabase.from('performance_metrics').insert(record);

  // Example: Store in Google Sheets via API
  // await appendToSheet('Performance', record);

  // Example: Send to InfluxDB
  // await influx.writePoint('web_vitals', record);
}

// Query for dashboards
export async function getPerformanceTrend(
  url: string,
  days: number = 30
): Promise<{ date: string; lcp: number; cls: number }[]> {
  // Query your database for daily averages
  return [];
}

// Compare to baseline
export async function compareToBaseline(
  url: string,
  currentMetrics: PerformanceRecord['metrics']
): Promise<{ metric: string; change: number; significant: boolean }[]> {
  const baseline = await getPerformanceTrend(url, 7);
  if (baseline.length === 0) return [];

  const avgBaseline = {
    lcp: baseline.reduce((sum, d) => sum + d.lcp, 0) / baseline.length,
    cls: baseline.reduce((sum, d) => sum + d.cls, 0) / baseline.length
  };

  return [
    {
      metric: 'lcp',
      change: ((currentMetrics.lcp - avgBaseline.lcp) / avgBaseline.lcp) * 100,
      significant: Math.abs(currentMetrics.lcp - avgBaseline.lcp) > 500
    },
    {
      metric: 'cls',
      change: ((currentMetrics.cls - avgBaseline.cls) / avgBaseline.cls) * 100,
      significant: Math.abs(currentMetrics.cls - avgBaseline.cls) > 0.05
    }
  ];
}
```

## Synthetic Monitoring Cron

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
```

## Forbidden

- ❌ No performance monitoring in production
- ❌ Ignoring field data (RUM)
- ❌ No CI performance checks
- ❌ Undefined performance budgets
- ❌ Manual-only Lighthouse runs
- ❌ Silencing performance alerts

## Definition of Done

- [ ] Performance budgets defined
- [ ] Lighthouse CI in GitHub Actions
- [ ] CI fails on performance regression
- [ ] Web Vitals tracked in production
- [ ] Bundle size monitoring
- [ ] Alerts configured for poor scores
- [ ] Weekly performance review scheduled
- [ ] Performance dashboard accessible
