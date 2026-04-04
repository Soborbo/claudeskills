# Automation & Form Handling Reference

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

## Environment Variables

```env
# Zapier/Make
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxx/xxx
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/xxx

# Generic CRM
CRM_WEBHOOK_URL=https://your-crm-endpoint.com/webhook
```
