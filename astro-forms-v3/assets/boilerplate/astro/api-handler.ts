/**
 * Astro v6 SSR API route template — adapt per endpoint.
 *
 * Deploy target: `src/pages/api/<name>.ts` in an Astro project using
 * `@astrojs/cloudflare` adapter. For raw Worker handlers, see `../lib/submit.ts`.
 *
 * Key differences vs. raw Worker handler:
 *  - `import { env } from 'cloudflare:workers'` (Astro v6 removed `locals.runtime.env`)
 *  - Top-level try/catch is mandatory — without it, uncaught exceptions are a
 *    bare 500 with no diagnostic info. See references/astro-v6-runtime.md
 *  - Handler signature is `APIRoute` with destructured context, not `fetch(request, env, ctx)`.
 *
 * Replace <FORM_ID> and <SCHEMA> with your form-specific values.
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { errorResponse, logCode } from '../../lib/errors';
// import { <SCHEMA> } from '../../lib/forms/schemas';
// import { verifyTurnstile } from '../../lib/forms/turnstile';
// import { checkRateLimit } from '../../lib/forms/rate-limit';
// import { isDuplicate } from '../../lib/forms/dedupe';
// import { saveToSheets } from '../../lib/forms/sheets';
// import { sendEmail } from '../../lib/forms/email/send';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const ip = clientAddress || 'unknown';

    // 1. Parse JSON body
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return errorResponse('SRV-PARSE-001', 'Invalid request', 400, {
        context: { contentType: request.headers.get('content-type') ?? '', endpoint: '/api/<FORM_ID>' },
      });
    }

    // 2. Zod validation
    // const parsed = <SCHEMA>.safeParse(raw);
    // if (!parsed.success) {
    //   const firstField = Object.keys(parsed.error.flatten().fieldErrors)[0] ?? 'unknown';
    //   return errorResponse('FORM-ZOD-002', 'Missing or invalid fields', 400, {
    //     context: { formId: '<FORM_ID>', fieldName: firstField },
    //     extraBody: { details: parsed.error.flatten() },
    //   });
    // }
    // const data = parsed.data;

    // 3. Spam checks — honeypot, time-gate, Turnstile
    //    (use runSpamChecks helper if importing the forms lib)

    // 4. Rate limit
    // const allowed = await checkRateLimit(env.RATE_LIMIT_KV, 'submit', ip);
    // if (!allowed) return errorResponse('HTTP-429-001', 'Too many attempts', 429, {
    //   context: { endpoint: '/api/<FORM_ID>' },
    // });

    // 5. Duplicate check
    // if (await isDuplicate(env.RATE_LIMIT_KV, { formId: '<FORM_ID>', email: data.email })) {
    //   return json({ success: true }); // silent success
    // }

    // 6. Side effects (parallel, Promise.allSettled so one failure doesn't block others)
    // const submission = { ...data, leadId: crypto.randomUUID(), ipHash: await hashIp(ip, env.IP_HASH_SALT), submittedAt: new Date().toISOString() };
    // await Promise.allSettled([
    //   sendEmail({ to: BUSINESS_EMAIL, ... }, env),
    //   saveToSheets(submission, env),
    //   sendEmail({ to: data.email, ... }, env),
    // ]);

    return json({ success: true });
  } catch (err) {
    // CRITICAL: without this try/catch, uncaught exceptions (including the
    // Astro v6 `locals.runtime.env has been removed` error) become a bare
    // 500 with no body and a generic Observability log. SRV-FUNC-001 ensures
    // the actual error message + stack land in Cloudflare Logs for debugging.
    return errorResponse('SRV-FUNC-001', 'Server error, please try again later', 500, {
      context: {
        functionPath: '/api/<FORM_ID>',
        errorMessage: err instanceof Error ? err.message : String(err),
      },
      extra: err,
    });
  }
};
