/**
 * Google Sheets API Integration
 * Direct API calls with service account authentication.
 * Workers-compatible: uses Web Crypto API for JWT signing.
 */

interface SheetsEnv {
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  GOOGLE_SHEET_ID: string;
}

interface SheetData {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Append a row to the configured Google Sheet.
 *
 * @param data - Key-value pairs. Keys must match column headers in row 1.
 * @param env - Service account credentials from env binding.
 * @param sheetName - Tab name, defaults to 'Leads'.
 */
export async function saveToSheets(
  data: SheetData,
  env: SheetsEnv,
  sheetName = 'Leads'
): Promise<{ success: boolean; error?: string }> {
  if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY || !env.GOOGLE_SHEET_ID) {
    console.warn('Google Sheets API not configured — missing env vars');
    return { success: false, error: 'Sheets not configured' };
  }

  try {
    const token = await getAccessToken(env);

    // 1. Read headers from row 1
    const headers = await getHeaders(env.GOOGLE_SHEET_ID, sheetName, token);
    if (!headers.length) {
      return { success: false, error: 'Sheet has no headers in row 1' };
    }

    // 2. Map data to row in header order
    const row = headers.map((h) => {
      const val = data[h];
      return val != null ? String(val) : '';
    });

    // 3. Append row
    const range = `${sheetName}!A:${columnLetter(headers.length)}`;
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}` +
      `/values/${encodeURIComponent(range)}:append` +
      `?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Sheets API error:', err);
      return { success: false, error: err };
    }

    return { success: true };
  } catch (error) {
    console.error('Sheets save error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Non-blocking save — use with ctx.waitUntil() in Workers.
 */
export function saveToSheetsAsync(
  data: SheetData,
  env: SheetsEnv,
  sheetName?: string
): Promise<{ success: boolean; error?: string }> {
  return saveToSheets(data, env, sheetName).catch((err) => {
    console.error('Async sheets save failed:', err);
    return { success: false, error: String(err) };
  });
}

// ─── Google Auth (JWT → Access Token) ─────────────────────

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(env: SheetsEnv): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if still valid (with 60s buffer)
  if (tokenCache && tokenCache.expiresAt > now + 60) {
    return tokenCache.token;
  }

  const jwt = await createSignedJwt(
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    env.GOOGLE_PRIVATE_KEY,
    now
  );

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const result = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  tokenCache = {
    token: result.access_token,
    expiresAt: now + result.expires_in,
  };

  return result.access_token;
}

async function createSignedJwt(
  email: string,
  privateKeyPem: string,
  nowSeconds: number
): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const unsigned = `${headerB64}.${payloadB64}`;

  const key = await importPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned)
  );

  return `${unsigned}.${base64urlFromBuffer(signature)}`;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const cleaned = pem
    .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (RSA )?PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\s/g, '');

  const binary = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'pkcs8',
    binary,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

// ─── Sheets Helpers ───────────────────────────────────────

async function getHeaders(
  sheetId: string,
  sheetName: string,
  token: string
): Promise<string[]> {
  const range = `${sheetName}!1:1`;
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}` +
    `/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to read sheet headers: ${await response.text()}`);
  }

  const result = (await response.json()) as { values?: string[][] };
  return result.values?.[0] || [];
}

function columnLetter(n: number): string {
  let s = '';
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

// ─── Base64url ────────────────────────────────────────────

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlFromBuffer(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
