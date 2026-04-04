# HubSpot Integration Reference

## HubSpot Contact Creation

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

## Environment Variables

```env
# HubSpot
HUBSPOT_ACCESS_TOKEN=pat-xxx
```
