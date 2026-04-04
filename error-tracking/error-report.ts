// src/pages/api/error-report.ts
// CF Worker — error report fogadó
//
// Hardened:
// - Strict payload validation (code format, field lengths, context limits)
// - Per-IP + per-session rate limiting
// - Max body size enforcement
// - Context key whitelist pattern
// - Abuse fingerprinting

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { ALL_CODES } from '@/lib/errors/codes';
import { sanitizeContext } from '@/lib/errors/sanitize';
import type { Severity } from '@/lib/errors/types';

// --- Constraints ---
const CODE_PATTERN = /^[A-Z]{2,6}-[A-Z]{2,8}-\d{3}$/;
const MAX_BODY_BYTES = 8192;           // 8KB max payload
const MAX_STRING_FIELD = 500;          // Leghosszabb string mező
const MAX_CONTEXT_KEYS = 10;
const MAX_CONTEXT_VALUE_LEN = 500;
const RATE_LIMIT_PER_IP = 30;         // /perc
const CONTEXT_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,49}$/;

// --- IP hash ---
function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i);
    hash = hash & hash;
  }
  return `ip_${Math.abs(hash).toString(36)}`;
}

// --- Truncate helper ---
function trunc(val: unknown, max: number): string {
  const s = String(val || '');
  return s.length > max ? s.substring(0, max) : s;
}

export const POST: APIRoute = async ({ request }) => {
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    // env is imported from 'cloudflare:workers' at module level

    // --- 1. Body size check ---
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    if (contentLength > MAX_BODY_BYTES) {
      return json({ ok: false, reason: 'body_too_large' }, 413);
    }

    // --- 2. Rate limit (IP) ---
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const ipHash = hashIP(ip);

    if (env.RATE_LIMIT_KV) {
      try {
        const ipKey = `err:ip:${ipHash}`;
        const ipCount = parseInt(await env.RATE_LIMIT_KV.get(ipKey) || '0');
        if (ipCount > RATE_LIMIT_PER_IP) {
          return json({ ok: false, reason: 'rate_limited_ip' }, 429);
        }
        await env.RATE_LIMIT_KV.put(ipKey, String(ipCount + 1), { expirationTtl: 60 });
      } catch {
        // KV fail → don't block
      }
    }

    // --- 3. Parse ---
    let body: Record<string, unknown>;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY_BYTES) {
        return json({ ok: false, reason: 'body_too_large' }, 413);
      }
      body = JSON.parse(text);
    } catch {
      return json({ ok: false, reason: 'invalid_json' }, 400);
    }

    if (!body || typeof body !== 'object') {
      return json({ ok: false, reason: 'invalid_payload' }, 400);
    }

    // --- 4. Strict field validation ---
    const code = String(body.code || '');
    if (!code || !CODE_PATTERN.test(code)) {
      return json({ ok: false, reason: 'invalid_code' }, 400);
    }

    const url = trunc(body.url, MAX_STRING_FIELD);
    const siteId = trunc(body.siteId, 50);
    if (!url || !siteId) {
      return json({ ok: false, reason: 'missing_required' }, 400);
    }

    // --- 5. Validate + sanitize context ---
    let context: Record<string, string | number | boolean> = {};
    if (body.context && typeof body.context === 'object') {
      const raw = body.context as Record<string, unknown>;
      let keyCount = 0;
      for (const [k, v] of Object.entries(raw)) {
        if (keyCount >= MAX_CONTEXT_KEYS) break;
        if (!CONTEXT_KEY_PATTERN.test(k)) continue;
        const type = typeof v;
        if (type === 'string') {
          context[k] = String(v).substring(0, MAX_CONTEXT_VALUE_LEN);
        } else if (type === 'number' || type === 'boolean') {
          context[k] = v as number | boolean;
        }
        keyCount++;
      }
    }
    context = sanitizeContext(context);

    // --- 6. Resolve severity ---
    const codeDef = ALL_CODES[code];
    const severity: Severity = codeDef?.severity || 'ERROR';

    // --- 7. Build sanitized row ---
    const row = {
      timestamp: trunc(body.timestamp, 30) || new Date().toISOString(),
      siteId,
      deployId: trunc(body.deployId, 50),
      env: trunc(body.env, 20),
      code,
      severity,
      message: trunc(body.message || codeDef?.message || 'Unknown', MAX_STRING_FIELD),
      url,
      source: trunc(body.source, 200),
      sessionId: trunc(body.sessionId, 20),
      requestId: trunc(body.requestId, 20),
      journeyId: trunc(body.journeyId, 50),
      context: JSON.stringify(context),
      stack: trunc(body.stack, 1000),
      viewport: trunc(body.viewport, 20),
      connection: trunc(body.connection, 20),
      userAgent: trunc(body.userAgent, 200),
      fingerprint: trunc(body.fingerprint, 100),
      retryable: codeDef?.retryable ?? false,
      userImpact: codeDef?.userImpact ?? 'degraded',
      ip: ipHash,
    };

    // --- 8. Log to Sheets ---
    if (env.ERROR_SHEETS_WEBHOOK_URL && severity !== 'INFO') {
      try {
        const resp = await fetch(env.ERROR_SHEETS_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row),
        });
        if (!resp.ok) {
          console.error(`SHEETS_NON_OK: status=${resp.status}, body=${await resp.text().catch(() => 'n/a')}`);
        }
      } catch (e) {
        console.error('SHEETS_FAILED', e);
      }
    } else if (!env.ERROR_SHEETS_WEBHOOK_URL) {
      // FIX: jelezzük ha nincs beállítva, hogy ne keressd a hibát órákig
      console.warn('[error-report] ERROR_SHEETS_WEBHOOK_URL is not set — skipping Sheets log');
    }

    // --- 9. CRITICAL → email ---
    if (severity === 'CRITICAL' && env.ERROR_ALERT_FROM && env.ERROR_EMAIL_TO && env.RESEND_API_KEY) {
      const subject = `🚨 [${row.siteId}] ${row.code}: ${row.message.substring(0, 60)}`;
      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:600px;">
          <h2 style="color:#dc2626;">Critical Error</h2>
          <table style="border-collapse:collapse;width:100%;">
            ${(['code','severity','message','url','source','siteId','deployId','env','sessionId','context','stack'] as const).map(k =>
              `<tr>
                <td style="padding:6px 12px;font-weight:bold;border-bottom:1px solid #eee;vertical-align:top;">${k}</td>
                <td style="padding:6px 12px;border-bottom:1px solid #eee;word-break:break-all;">${
                  k === 'severity' ? `<span style="color:#dc2626;font-weight:bold;">${row[k]}</span>` : row[k]
                }</td>
              </tr>`
            ).join('')}
          </table>
        </div>
      `;

      try {
        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: env.ERROR_ALERT_FROM,
            to: [env.ERROR_EMAIL_TO],
            subject,
            html,
          }),
        });
        if (!emailResp.ok) {
          console.error(`ALERT_EMAIL_NON_OK: status=${emailResp.status}`);
        }
      } catch (e) {
        console.error('ALERT_EMAIL_FAILED', code, e);
      }
    }

    return json({ ok: true }, 200);

  } catch (e) {
    console.error('ERROR_ENDPOINT_CRASHED', e);
    return json({ ok: false }, 500);
  }
};
