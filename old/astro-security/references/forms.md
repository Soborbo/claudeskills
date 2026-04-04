# Form Security

## Turnstile Integration

```typescript
// src/lib/turnstile.ts
export async function verifyTurnstile(token: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: import.meta.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });
  const data = await res.json();
  return data.success === true;
}
```

```html
<!-- In form -->
<div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY" data-theme="light"></div>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

## Honeypot Field

```html
<!-- Hidden from humans, bots fill it -->
<div class="hidden" aria-hidden="true">
  <label for="website">Website</label>
  <input type="text" name="website" id="website" tabindex="-1" autocomplete="off">
</div>
```

```css
.hidden {
  position: absolute;
  left: -9999px;
  opacity: 0;
  height: 0;
  pointer-events: none;
}
```

```typescript
// Server-side check
if (formData.get('website')) {
  return new Response('OK', { status: 200 }); // Silent fail
}
```

## Rate Limiting

```typescript
// Using Cloudflare KV or simple Map
const submissions = new Map<string, number[]>();

function isRateLimited(ip: string, limit = 5, windowMs = 3600000): boolean {
  const now = Date.now();
  const timestamps = submissions.get(ip) || [];
  const recent = timestamps.filter(t => now - t < windowMs);
  
  if (recent.length >= limit) return true;
  
  recent.push(now);
  submissions.set(ip, recent);
  return false;
}
```

## Server-Side Validation

```typescript
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string()
    .min(2, 'Name too short')
    .max(100, 'Name too long')
    .trim()
    .transform(s => s.replace(/<[^>]*>/g, '')), // Strip HTML
    
  email: z.string()
    .email('Invalid email')
    .toLowerCase()
    .max(254),
    
  phone: z.string()
    .regex(/^[\d\s\+\-\(\)]{7,20}$/, 'Invalid phone')
    .optional()
    .transform(s => s?.replace(/\s/g, '')),
    
  message: z.string()
    .max(2000, 'Message too long')
    .trim()
    .transform(s => s.replace(/<[^>]*>/g, '')),
    
  consent: z.literal(true, { errorMap: () => ({ message: 'Consent required' }) }),
});
```

## Complete Form Handler

```typescript
export async function POST({ request, clientAddress }) {
  // 1. Rate limit
  if (isRateLimited(clientAddress)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), { 
      status: 429 
    });
  }

  const formData = await request.formData();
  
  // 2. Honeypot
  if (formData.get('website')) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }
  
  // 3. Turnstile
  const token = formData.get('cf-turnstile-response');
  if (!token || !(await verifyTurnstile(token))) {
    return new Response(JSON.stringify({ error: 'Verification failed' }), { 
      status: 400 
    });
  }
  
  // 4. Validate
  const result = ContactSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return new Response(JSON.stringify({ errors: result.error.flatten() }), { 
      status: 400 
    });
  }
  
  // 5. Process (email, sheets, etc.)
  await sendEmail(result.data);
  
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
```
