# Pipedrive Integration Reference

## Pipedrive Person Creation

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
```

## Pipedrive Deal Creation

```typescript
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

## Environment Variables

```env
# Pipedrive
PIPEDRIVE_API_TOKEN=xxx
PIPEDRIVE_DOMAIN=yourcompany
```
