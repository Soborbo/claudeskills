# Webhook Implementation Reference

## Integration Architecture

```
Form Submit
    ↓
Validate (Zod)
    ↓
Save to Google Sheets (Primary backup)
    ↓
Queue CRM webhook (async)
    ↓
Thank you page
    ↓
[Background] CRM webhook with retry
```

## Webhook Payload Standard

```typescript
interface LeadPayload {
  // Core fields
  email: string;
  phone?: string;
  name: string;

  // Source tracking
  source: {
    url: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };

  // Timestamps
  submitted_at: string; // ISO 8601
  timezone: string;

  // Lead details
  form_name: string;
  form_data: Record<string, any>;

  // Optional
  ip_address?: string; // Hashed for GDPR
  user_agent?: string;
  consent_given: boolean;
  consent_timestamp: string;
}
```

## Generic Webhook Function

```typescript
// src/lib/integrations/webhook.ts
interface WebhookConfig {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

interface WebhookResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  retryable: boolean;
}

export async function sendWebhook(
  config: WebhookConfig,
  payload: unknown
): Promise<WebhookResult> {
  const { url, headers = {}, timeout = 10000, retries = 3 } = config;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { success: true, statusCode: response.status, retryable: false };
      }

      // 4xx errors are not retryable (client error)
      if (response.status >= 400 && response.status < 500) {
        return {
          success: false,
          statusCode: response.status,
          error: await response.text(),
          retryable: false,
        };
      }

      // 5xx errors are retryable
      if (attempt === retries) {
        return {
          success: false,
          statusCode: response.status,
          error: 'Max retries reached',
          retryable: true,
        };
      }

      // Exponential backoff
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    } catch (error) {
      if (attempt === retries) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        };
      }
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }

  return { success: false, error: 'Unexpected error', retryable: true };
}
```
