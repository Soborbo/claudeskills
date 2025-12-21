---
name: crm-integrations
description: CRM and automation integration patterns for lead gen sites. Webhooks, Zapier, Make, HubSpot, Pipedrive. Use for connecting forms to business systems.
---

# CRM Integrations Skill

## Purpose

Connects lead generation forms to CRM systems and automation tools. Ensures no leads are lost.

## Core Rules

1. **Always have backup** — If CRM fails, data must be saved elsewhere
2. **Async processing** — Don't block form submission on CRM
3. **Retry failed sends** — Queue and retry integration failures
4. **Log everything** — Track all integration attempts
5. **Validate before send** — Ensure data format matches CRM

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

## HubSpot Integration

```typescript
// src/lib/integrations/hubspot.ts
interface HubSpotConfig {
  accessToken: string;
}

interface HubSpotContact {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  company?: string;
  [key: string]: string | undefined;
}

export async function createHubSpotContact(
  config: HubSpotConfig,
  contact: HubSpotContact
): Promise<{ success: boolean; id?: string; error?: string }> {
  const properties = Object.entries(contact)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => ({ property: key, value }));

  const response = await fetch(
    'https://api.hubapi.com/contacts/v1/contact',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    }
  );

  if (response.ok) {
    const data = await response.json();
    return { success: true, id: data.vid };
  }

  // Handle duplicate
  if (response.status === 409) {
    return { success: true, error: 'Contact already exists' };
  }

  return {
    success: false,
    error: `HubSpot error: ${response.status}`,
  };
}
```

## Pipedrive Integration

```typescript
// src/lib/integrations/pipedrive.ts
interface PipedriveConfig {
  apiToken: string;
  domain: string; // e.g., 'yourcompany'
}

interface PipedrivePerson {
  name: string;
  email?: string[];
  phone?: string[];
  org_id?: number;
}

export async function createPipedrivePerson(
  config: PipedriveConfig,
  person: PipedrivePerson
): Promise<{ success: boolean; id?: number; error?: string }> {
  const response = await fetch(
    `https://${config.domain}.pipedrive.com/api/v1/persons?api_token=${config.apiToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(person),
    }
  );

  const data = await response.json();

  if (data.success) {
    return { success: true, id: data.data.id };
  }

  return { success: false, error: data.error };
}

export async function createPipedriveDeal(
  config: PipedriveConfig,
  deal: {
    title: string;
    person_id: number;
    value?: number;
    currency?: string;
    pipeline_id?: number;
    stage_id?: number;
  }
): Promise<{ success: boolean; id?: number; error?: string }> {
  const response = await fetch(
    `https://${config.domain}.pipedrive.com/api/v1/deals?api_token=${config.apiToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deal),
    }
  );

  const data = await response.json();

  if (data.success) {
    return { success: true, id: data.data.id };
  }

  return { success: false, error: data.error };
}
```

## Zapier/Make Webhook

```typescript
// src/lib/integrations/zapier.ts
export async function sendToZapier(
  webhookUrl: string,
  data: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
      }),
    });

    return { success: response.ok };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

## Form Handler with CRM

```typescript
// src/pages/api/submit.ts
import { sendWebhook } from '@/lib/integrations/webhook';
import { appendToSheet } from '@/lib/sheets';
import { sendEmail } from '@/lib/email/send';

export async function POST({ request }) {
  const data = await request.json();

  // 1. Validate
  const result = schema.safeParse(data);
  if (!result.success) {
    return new Response(JSON.stringify({ errors: result.error.flatten() }), {
      status: 400,
    });
  }

  const lead = result.data;

  // 2. Always save to Google Sheets first (backup)
  await appendToSheet({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    timestamp: new Date().toISOString(),
    crm_synced: false, // Will update after CRM success
  });

  // 3. Send to CRM (async, don't block response)
  const crmPromise = sendWebhook(
    {
      url: import.meta.env.CRM_WEBHOOK_URL,
      retries: 3,
    },
    lead
  ).then((result) => {
    if (!result.success) {
      // Log for manual retry
      console.error('CRM sync failed:', result.error);
    }
  });

  // 4. Send emails
  await Promise.all([
    sendEmail({ type: 'lead-notification', data: lead }),
    sendEmail({ type: 'customer-confirmation', data: lead }),
  ]);

  // Don't await CRM - return success to user
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
```

## Environment Variables

```env
# HubSpot
HUBSPOT_ACCESS_TOKEN=pat-xxx

# Pipedrive
PIPEDRIVE_API_TOKEN=xxx
PIPEDRIVE_DOMAIN=yourcompany

# Zapier/Make
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxx/xxx
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/xxx

# Generic CRM
CRM_WEBHOOK_URL=https://your-crm-endpoint.com/webhook
```

## Failure Handling

```typescript
// src/lib/integrations/failed-queue.ts
// Store failed integrations for retry

interface FailedIntegration {
  id: string;
  type: 'hubspot' | 'pipedrive' | 'webhook';
  payload: unknown;
  error: string;
  attempts: number;
  lastAttempt: string;
  nextRetry: string;
}

// In production, use a proper queue (Redis, SQS, etc.)
// For simple sites, log to Google Sheets "Failed Integrations" tab
export async function queueFailedIntegration(
  integration: Omit<FailedIntegration, 'id'>
): Promise<void> {
  await appendToSheet({
    ...integration,
    id: crypto.randomUUID(),
  }, 'Failed Integrations');
}
```

## Forbidden

- ❌ Blocking form response on CRM
- ❌ No backup storage
- ❌ Exposing API tokens to client
- ❌ Sending PII without consent
- ❌ No retry logic for failures
- ❌ Ignoring failed integrations

## Definition of Done

- [ ] Webhook function with retry
- [ ] Google Sheets as backup
- [ ] CRM integration async
- [ ] Failed integrations logged
- [ ] Environment variables set
- [ ] GDPR consent checked before send
- [ ] Email notifications working
