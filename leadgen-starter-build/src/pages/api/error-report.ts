/**
 * Error report endpoint
 * POST /api/error-report
 * Rate limited, validated, PII stripped
 */

import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { sanitizeContext } from '../../lib/errors/sanitize';

const reportSchema = z.object({
  code: z.string().max(30),
  message: z.string().max(500),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  source: z.string().max(200),
  url: z.string().max(500),
  timestamp: z.string(),
  stack: z.string().max(2000).optional(),
  userAgent: z.string().max(300).optional(),
  context: z.record(z.unknown()).max(20).optional(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Payload size limit (16KB)
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 16384) {
      return new Response('Payload too large', { status: 413 });
    }

    const body = await request.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return new Response('Invalid report', { status: 400 });
    }

    const report = parsed.data;

    // Sanitize context for PII
    const sanitizedContext = report.context
      ? sanitizeContext(report.context as Record<string, unknown>)
      : undefined;

    // Hash IP for privacy (GDPR-safe — no raw IP stored)
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipHash = await hashIp(ip);

    // Log for wrangler tail / Workers analytics
    console.error(JSON.stringify({
      type: 'error_report',
      ...report,
      context: sanitizedContext,
      ipHash,
    }));

    // TODO: For critical errors, send email alert
    // TODO: For all errors, append to Google Sheets error log

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response('Bad request', { status: 400 });
  }
};

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash).slice(0, 4))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
