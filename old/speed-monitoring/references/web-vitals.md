# Core Web Vitals Monitoring

## Web Vitals Client-Side Tracking

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

## Web Vitals API Endpoint

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

## Performance Tracking System

```typescript
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
