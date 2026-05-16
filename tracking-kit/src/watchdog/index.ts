/**
 * Conversion-volume watchdog.
 *
 * Daily cron Worker that queries the GA4 Data API for each KEY_EVENT
 * over the previous UTC day, compares to a 7-day trailing baseline
 * (excluding the previous day), and emails the operator if any event
 * drops below ALERT_RATIO.
 *
 * This is your safety net for the failure mode where a tracking change
 * silently breaks attribution — the kind that's invisible in code
 * review because the call site still exists, but the event no longer
 * reaches GA4 / Ads / Meta. The watchdog catches it within 24h instead
 * of the 2.5 weeks it took without one.
 *
 * Adapt `KEY_EVENTS` to match the conversion-relevant events in your
 * `EVENTS.md`. The defaults below match the kit's lead-gen taxonomy;
 * e-commerce projects should swap in `purchase`, `add_to_cart`,
 * `begin_checkout` as appropriate.
 *
 * Auth: Google service-account JWT bearer flow. The SA must be granted
 * the Viewer role on the GA4 property.
 *
 * Deploy: Cloudflare Worker with a daily cron trigger. See MONITORING.md
 * for the wrangler.toml shape and secret setup.
 */

interface Env {
  GA4_PROPERTY_ID: string;
  GA_SA_EMAIL: string;
  GA_SA_PRIVATE_KEY: string;
  RESEND_API_KEY: string;
  ADMIN_EMAIL: string;
  /** Optional: override the From address; must be a verified Resend sender. */
  ALERT_FROM?: string;
}

/**
 * Events the watchdog tracks. Keep aligned with the conversion events
 * in your EVENTS.md — engagement-only events (`form_start`, `scroll_*`)
 * don't belong here, they're noisy and not actionable.
 */
const KEY_EVENTS = [
  'primary_conversion',
  'callback_conversion',
  'phone_conversion',
  'email_conversion',
  'whatsapp_conversion',
  'contact_form_submit',
];

/** Alert if yesterday's count < this fraction of the 7-day daily average. */
const ALERT_RATIO = 0.6;
const BASELINE_DAYS = 7;
/** Skip events whose baseline daily average is below this — too noisy to alert on. */
const MIN_BASELINE_PER_DAY = 5;

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(check(env));
  },
};

async function check(env: Env): Promise<void> {
  const token = await ga4Token(env);
  const now = new Date();

  const yesterday = isoDate(now, -1);
  const baselineStart = isoDate(now, -1 - BASELINE_DAYS);
  const baselineEnd = isoDate(now, -2);

  const [current, baseline] = await Promise.all([
    runReport(env, token, yesterday, yesterday),
    runReport(env, token, baselineStart, baselineEnd),
  ]);

  const drops: Array<{ event: string; current: number; baselineAvg: number; ratio: number }> = [];
  for (const event of KEY_EVENTS) {
    const cur = current.get(event) ?? 0;
    const baseTotal = baseline.get(event) ?? 0;
    const baseAvg = baseTotal / BASELINE_DAYS;
    if (baseAvg < MIN_BASELINE_PER_DAY) continue;
    const ratio = cur / baseAvg;
    if (ratio < ALERT_RATIO) {
      drops.push({ event, current: cur, baselineAvg: baseAvg, ratio });
    }
  }

  if (drops.length === 0) return;
  await sendAlert(env, drops, {
    current: { start: yesterday, end: yesterday },
    baseline: { start: baselineStart, end: baselineEnd },
  });
}

async function runReport(
  env: Env,
  token: string,
  startDate: string,
  endDate: string,
): Promise<Map<string, number>> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${env.GA4_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: { values: KEY_EVENTS },
          },
        },
        limit: 100,
      }),
    },
  );
  if (!res.ok) throw new Error(`GA4 Data API ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const data = (await res.json()) as {
    rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>;
  };
  const out = new Map<string, number>();
  for (const r of data.rows ?? []) {
    out.set(r.dimensionValues[0].value, Number(r.metricValues[0].value));
  }
  return out;
}

async function ga4Token(env: Env): Promise<string> {
  const header = base64urlString(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64urlString(
    JSON.stringify({
      iss: env.GA_SA_EMAIL,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }),
  );
  const toSign = `${header}.${payload}`;
  const pem = env.GA_SA_PRIVATE_KEY.replace(/\\n/g, '\n');
  const der = Uint8Array.from(
    atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')),
    (c) => c.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(toSign)),
  );
  const jwt = `${toSign}.${base64urlBytes(sig)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`OAuth token ${res.status}: ${(await res.text()).slice(0, 500)}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

function base64urlString(s: string): string {
  return base64urlBytes(new TextEncoder().encode(s));
}

function base64urlBytes(b: Uint8Array): string {
  let s = '';
  for (const byte of b) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function isoDate(base: Date, dayOffset: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

async function sendAlert(
  env: Env,
  drops: Array<{ event: string; current: number; baselineAvg: number; ratio: number }>,
  windows: { current: { start: string; end: string }; baseline: { start: string; end: string } },
): Promise<void> {
  const rows = drops
    .map(
      (d) => `<tr>
    <td style="padding:6px 12px"><code>${escapeHtml(d.event)}</code></td>
    <td style="padding:6px 12px;text-align:right">${d.current.toFixed(0)}</td>
    <td style="padding:6px 12px;text-align:right">${d.baselineAvg.toFixed(1)}/day</td>
    <td style="padding:6px 12px;text-align:right;color:#dc2626;font-weight:700">${(d.ratio * 100).toFixed(0)}%</td>
  </tr>`,
    )
    .join('');

  const html = `<h2 style="margin:0 0 12px">Tracking volume alert</h2>
<p style="margin:0 0 12px">One or more GA4 key events dropped below
<b>${Math.round(ALERT_RATIO * 100)}%</b> of their ${BASELINE_DAYS}-day baseline.</p>
<p style="margin:0 0 16px">
  <b>Yesterday:</b> ${windows.current.start}<br>
  <b>Baseline:</b> ${windows.baseline.start} → ${windows.baseline.end}
</p>
<table style="border-collapse:collapse">
  <thead><tr style="border-bottom:1px solid #ccc">
    <th style="padding:6px 12px;text-align:left">Event</th>
    <th style="padding:6px 12px;text-align:right">Yesterday</th>
    <th style="padding:6px 12px;text-align:right">Baseline</th>
    <th style="padding:6px 12px;text-align:right">Ratio</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<p style="margin:20px 0 0;color:#6b7280;font-size:13px">
  First suspect: the most recent deploy touching tracking. Check GA4
  DebugView and the GTM container.
</p>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.ALERT_FROM ?? 'tracking-watchdog@example.com',
      to: env.ADMIN_EMAIL,
      subject: `[Tracking] ${drops.length} key event(s) below threshold`,
      html,
    }),
  });
  if (!res.ok) {
    console.error('Alert email failed:', res.status, (await res.text()).slice(0, 500));
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
