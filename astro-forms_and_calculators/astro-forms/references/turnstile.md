# Cloudflare Turnstile Reference

Invisible CAPTCHA - Cloudflare-native, better UX than reCAPTCHA.

## Setup

1. Get keys from Cloudflare Dashboard → Turnstile
2. Add to `.env`

## Client-Side

```html
<!-- Add to form -->
<div class="cf-turnstile" data-sitekey="{{TURNSTILE_SITE_KEY}}" data-callback="onTurnstileSuccess"></div>

<!-- Load script -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<!-- Hidden input for token -->
<input type="hidden" name="cf-turnstile-response" id="cf-turnstile-response" />

<script>
  function onTurnstileSuccess(token) {
    document.getElementById('cf-turnstile-response').value = token;
  }
</script>
```

## Server-Side Verification

```typescript
// src/lib/forms/turnstile.ts

const TURNSTILE_SECRET = import.meta.env.TURNSTILE_SECRET_KEY;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileResult {
  success: boolean;
  error?: string;
}

export async function verifyTurnstile(
  token: string,
  ip?: string
): Promise<TurnstileResult> {
  if (!TURNSTILE_SECRET) {
    console.warn('TURNSTILE_SECRET_KEY not configured');
    return { success: true }; // Skip in dev
  }
  
  if (!token) {
    return { success: false, error: 'Missing Turnstile token' };
  }
  
  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET,
        response: token,
        ...(ip && { remoteip: ip }),
      }),
    });
    
    const result = await response.json();
    
    return {
      success: result.success === true,
      error: result['error-codes']?.join(', '),
    };
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return { success: false, error: 'Verification failed' };
  }
}
```

## Usage in API Endpoint

```typescript
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const body = await request.json();
  
  // Verify Turnstile BEFORE other processing
  const turnstile = await verifyTurnstile(
    body['cf-turnstile-response'],
    clientAddress
  );
  
  if (!turnstile.success) {
    return new Response(
      JSON.stringify({ error: 'Captcha verification failed' }),
      { status: 400 }
    );
  }
  
  // Continue with form processing...
};
```

## Zod Schema

```typescript
// Add to form schema
'cf-turnstile-response': z.string().min(1, 'Captcha szükséges'),
```

## Invisible Mode

For invisible Turnstile (no widget shown):

```html
<div 
  class="cf-turnstile" 
  data-sitekey="{{TURNSTILE_SITE_KEY}}"
  data-size="invisible"
  data-callback="onTurnstileSuccess"
></div>
```

## Error Handling

Common error codes:
- `missing-input-secret` - Secret key missing
- `invalid-input-secret` - Secret key invalid
- `missing-input-response` - Token missing
- `invalid-input-response` - Token invalid/expired
- `timeout-or-duplicate` - Token already used

## Testing

Use these test keys in development:
- Site key: `1x00000000000000000000AA` (always passes)
- Site key: `2x00000000000000000000AB` (always fails)
- Secret key: `1x0000000000000000000000000000000AA` (always passes)
