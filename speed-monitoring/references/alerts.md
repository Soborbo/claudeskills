# Performance Regression Alerts

## Alert Configuration

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

## Threshold Guidelines

### LCP (Largest Contentful Paint)
- Good: < 2500ms
- Needs Improvement: 2500-4000ms
- Poor: > 4000ms

### FCP (First Contentful Paint)
- Good: < 1800ms
- Needs Improvement: 1800-3000ms
- Poor: > 3000ms

### CLS (Cumulative Layout Shift)
- Good: < 0.1
- Needs Improvement: 0.1-0.25
- Poor: > 0.25

### INP (Interaction to Next Paint)
- Good: < 200ms
- Needs Improvement: 200-500ms
- Poor: > 500ms

### TBT (Total Blocking Time)
- Good: < 200ms
- Needs Improvement: 200-600ms
- Poor: > 600ms

## Alert Channel Setup

### Slack
Set `SLACK_WEBHOOK_URL` environment variable with your webhook URL.

### PagerDuty
Set `PAGERDUTY_INTEGRATION_KEY` for critical alerts only.

### Email
Configure SMTP settings or use a service like SendGrid/Mailgun for email notifications.
