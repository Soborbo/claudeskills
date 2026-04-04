// src/lib/errors/codes.ts
// Teljes hibakód-regiszter — 290 kód, TypeScript-ben
//
// Minden kód FIXÁLT severity + retryable + userImpact.
// requiredContext: ezek a context mezők KÖTELEZŐEK ehhez a kódhoz.
// Ha trackError()-t hívsz ezek nélkül, dev módban warning-ot kapsz.

import type { ErrorCodeDef } from './types';

// ============================================================
// 1. HTTP — HTTP Status Hibák (25 kód)
// ============================================================

export const HTTP_CODES: Record<string, ErrorCodeDef> = {
  'HTTP-400-001': { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: '400 Bad Request — hibás request body', requiredContext: ['endpoint', 'method'] },
  'HTTP-400-002': { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: '400 — hiányzó required paraméter', requiredContext: ['endpoint', 'missingParam'] },
  'HTTP-401-001': { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: '401 Unauthorized — auth hiányzik', requiredContext: ['endpoint'] },
  'HTTP-401-002': { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: '401 — auth lejárt/érvénytelen', requiredContext: ['endpoint', 'keyPrefix'] },
  'HTTP-403-001': { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: '403 Forbidden — jogosultság', requiredContext: ['endpoint', 'origin'] },
  'HTTP-403-002': { severity: 'WARN',     retryable: false, userImpact: 'blocked',  message: '403 — Cloudflare WAF blokkolta', requiredContext: ['cfRay'] },
  'HTTP-404-001': { severity: 'INFO',     retryable: false, userImpact: 'degraded', message: '404 — oldal nem található', requiredContext: ['requestedUrl', 'referrer'] },
  'HTTP-404-002': { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: '404 — API endpoint nem található', requiredContext: ['endpoint', 'method'] },
  'HTTP-404-003': { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: '404 — statikus asset hiányzik', requiredContext: ['assetUrl', 'referrerPage'] },
  'HTTP-404-004': { severity: 'INFO',     retryable: false, userImpact: 'none',     message: '404 — bot/crawler kér nem létező URL-t', requiredContext: ['requestedUrl', 'userAgent'] },
  'HTTP-405-001': { severity: 'WARN',     retryable: false, userImpact: 'blocked',  message: '405 Method Not Allowed', requiredContext: ['endpoint', 'method'] },
  'HTTP-408-001': { severity: 'WARN',     retryable: true,  userImpact: 'degraded', message: '408 Request Timeout', requiredContext: ['endpoint', 'durationMs'] },
  'HTTP-413-001': { severity: 'WARN',     retryable: false, userImpact: 'blocked',  message: '413 Payload Too Large', requiredContext: ['endpoint', 'bodySize'] },
  'HTTP-429-001': { severity: 'WARN',     retryable: true,  userImpact: 'degraded', message: '429 Too Many Requests — saját rate limit', requiredContext: ['endpoint', 'ip'] },
  'HTTP-429-002': { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: '429 — külső API rate limit', requiredContext: ['apiName', 'retryAfter'] },
  'HTTP-500-001': { severity: 'CRITICAL', retryable: true,  userImpact: 'blocked',  message: '500 Internal Server Error — saját endpoint', requiredContext: ['endpoint', 'errorMessage'] },
  'HTTP-500-002': { severity: 'CRITICAL', retryable: true,  userImpact: 'blocked',  message: '500 — dependency threw', requiredContext: ['endpoint', 'dependency', 'depError'] },
  'HTTP-502-001': { severity: 'ERROR',    retryable: true,  userImpact: 'blocked',  message: '502 Bad Gateway', requiredContext: ['endpoint', 'cfRay'] },
  'HTTP-503-001': { severity: 'ERROR',    retryable: true,  userImpact: 'blocked',  message: '503 Service Unavailable — szerver túlterhelt', requiredContext: ['endpoint', 'cfRay'] },
  'HTTP-503-002': { severity: 'WARN',     retryable: true,  userImpact: 'degraded', message: '503 — külső API maintenance', requiredContext: ['apiName'] },
  'HTTP-504-001': { severity: 'ERROR',    retryable: true,  userImpact: 'blocked',  message: '504 Gateway Timeout', requiredContext: ['endpoint', 'durationMs'] },
  'HTTP-520-001': { severity: 'ERROR',    retryable: true,  userImpact: 'blocked',  message: '520 CF Unknown Error', requiredContext: ['cfRay'] },
  'HTTP-521-001': { severity: 'CRITICAL', retryable: true,  userImpact: 'blocked',  message: '521 Web Server Is Down', requiredContext: ['cfRay'] },
  'HTTP-522-001': { severity: 'CRITICAL', retryable: true,  userImpact: 'blocked',  message: '522 Connection Timed Out', requiredContext: ['cfRay', 'durationMs'] },
  'HTTP-524-001': { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: '524 A Timeout Occurred — CF 30s limit', requiredContext: ['cfRay', 'endpoint'] },
};

// ============================================================
// 2. SRV — Server / CF Worker Hibák (23 kód)
// ============================================================

export const SRV_CODES: Record<string, ErrorCodeDef> = {
  'SRV-FUNC-001':    { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'Worker unhandled exception', requiredContext: ['functionPath', 'errorMessage'] },
  'SRV-FUNC-002':    { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'Worker timeout (>30s)', requiredContext: ['functionPath', 'durationMs', 'lastStep'] },
  'SRV-FUNC-003':    { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Worker memory limit', requiredContext: ['functionPath'] },
  'SRV-FUNC-004':    { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Worker cold start >2s', requiredContext: ['functionPath', 'coldStartMs'] },
  'SRV-FUNC-005':    { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Worker CPU limit', requiredContext: ['functionPath', 'cpuMs'] },
  'SRV-PARSE-001':   { severity: 'WARN',     retryable: false, userImpact: 'blocked',  message: 'Request JSON parse hiba', requiredContext: ['contentType'] },
  'SRV-PARSE-002':   { severity: 'WARN',     retryable: false, userImpact: 'blocked',  message: 'Request body üres', requiredContext: ['endpoint', 'method'] },
  'SRV-PARSE-003':   { severity: 'WARN',     retryable: false, userImpact: 'blocked',  message: 'Request body encoding hiba', requiredContext: ['endpoint'] },
  'SRV-HEADER-001':  { severity: 'WARN',     retryable: false, userImpact: 'blocked',  message: 'Kötelező request header hiányzik', requiredContext: ['endpoint', 'missingHeader'] },
  'SRV-HEADER-002':  { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'Response header beállítás hiba', requiredContext: ['headerName'] },
  'SRV-ENV-001':     { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'Runtime env var nem elérhető', requiredContext: ['varName', 'functionPath'] },
  'SRV-ENV-002':     { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Runtime env var üres string', requiredContext: ['varName'] },
  'SRV-CORS-001':    { severity: 'WARN',     retryable: false, userImpact: 'blocked',  message: 'CORS preflight kezelés hiba', requiredContext: ['origin', 'endpoint'] },
  'SRV-CORS-002':    { severity: 'WARN',     retryable: false, userImpact: 'blocked',  message: 'CORS origin nem engedélyezett', requiredContext: ['origin'] },
  'SRV-JSON-001':    { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Response JSON serialization hiba', requiredContext: ['endpoint'] },
  'SRV-JSON-002':    { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Response JSON túl nagy (>10MB)', requiredContext: ['endpoint', 'responseSize'] },
  'SRV-STREAM-001':  { severity: 'ERROR',    retryable: true,  userImpact: 'blocked',  message: 'Response stream hiba', requiredContext: ['endpoint'] },
  'SRV-REDIR-001':   { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Server-side redirect loop', requiredContext: ['from', 'to', 'hopCount'] },
  'SRV-REDIR-002':   { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Redirect cél nem létezik', requiredContext: ['from', 'to'] },
  'SRV-MW-001':      { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'Middleware threw', requiredContext: ['errorMessage'] },
  'SRV-MW-002':      { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'Middleware timeout', requiredContext: ['durationMs'] },
  'SRV-CONC-001':    { severity: 'WARN',     retryable: true,  userImpact: 'degraded', message: 'Túl sok egyidejű request', requiredContext: ['concurrentRequests'] },
  'SRV-DEPLOY-001':  { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'Deploy után function nem működik', requiredContext: ['deployId', 'functionPath'] },
};

// ============================================================
// 3. RESEND — Resend Email API (20 kód)
// ============================================================

export const RESEND_CODES: Record<string, ErrorCodeDef> = {
  'RESEND-AUTH-001':  { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'API kulcs elutasítva (401)', requiredContext: ['statusCode', 'keyPrefix'] },
  'RESEND-AUTH-002':  { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'API kulcs formátum hibás', requiredContext: ['keyLength'] },
  'RESEND-RATE-001':  { severity: 'WARN',     retryable: true,  userImpact: 'degraded', message: 'Rate limit (429)', requiredContext: ['statusCode', 'retryAfter'] },
  'RESEND-RATE-002':  { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Napi küldési limit elérve', requiredContext: ['dailySent'] },
  'RESEND-DOM-001':   { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'From domain nem verified (403)', requiredContext: ['fromDomain', 'statusCode'] },
  'RESEND-DOM-002':   { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'From email formátum hibás', requiredContext: ['fromAddress'] },
  'RESEND-TO-001':    { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'Címzett bounced (hard bounce)', requiredContext: ['toMasked', 'bounceType'] },
  'RESEND-TO-002':    { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'Címzett format hibás', requiredContext: ['toMasked'] },
  'RESEND-TMPL-001':  { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'HTML template túl nagy (>50KB)', requiredContext: ['templateSize', 'formId'] },
  'RESEND-TMPL-002':  { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'HTML template renderelés hiba', requiredContext: ['templateName'] },
  'RESEND-NET-001':   { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'Resend API nem elérhető (network)', requiredContext: ['errorMessage'] },
  'RESEND-NET-002':   { severity: 'WARN',     retryable: true,  userImpact: 'degraded', message: 'Resend API timeout (>5s)', requiredContext: ['durationMs'] },
  'RESEND-SRV-001':   { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'Resend 500 szerver hiba', requiredContext: ['statusCode'] },
  'RESEND-SRV-002':   { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'Resend 503 service unavailable', requiredContext: ['statusCode'] },
  'RESEND-PAY-001':   { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Resend 400 — hibás payload', requiredContext: ['statusCode', 'errorBody'] },
  'RESEND-PAY-002':   { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Attachment túl nagy (>40MB)', requiredContext: ['attachmentSize'] },
  'RESEND-HEAD-001':  { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Reply-to cím hibás', requiredContext: ['replyTo'] },
  'RESEND-HEAD-002':  { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Authorization header hiányzik', requiredContext: ['hasAuthHeader'] },
  'RESEND-RESP-001':  { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'Resend válasz nem JSON', requiredContext: ['contentType'] },
  'RESEND-RESP-002':  { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'Resend válasz JSON parse hiba', requiredContext: ['bodyLength'] },
};

// ============================================================
// 4. BREVO + EMAIL — Brevo & Mindkét Provider (12 kód)
// ============================================================

export const BREVO_CODES: Record<string, ErrorCodeDef> = {
  'BREVO-AUTH-001':   { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'API kulcs elutasítva', requiredContext: ['statusCode', 'keyPrefix'] },
  'BREVO-RATE-001':   { severity: 'WARN',     retryable: true,  userImpact: 'degraded', message: 'Rate limit elérve', requiredContext: ['statusCode', 'retryAfter'] },
  'BREVO-DOM-001':    { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Sender nem verified', requiredContext: ['fromAddress'] },
  'BREVO-NET-001':    { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'Brevo API nem elérhető', requiredContext: ['errorMessage'] },
  'BREVO-NET-002':    { severity: 'WARN',     retryable: true,  userImpact: 'degraded', message: 'Brevo API timeout', requiredContext: ['durationMs'] },
  'BREVO-SRV-001':    { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'Brevo 500 szerver hiba', requiredContext: ['statusCode'] },
  'BREVO-PAY-001':    { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Brevo 400 — payload hibás', requiredContext: ['statusCode', 'errorBody'] },
  'BREVO-TO-001':     { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'Címzett blocklisted', requiredContext: ['toMasked'] },
  'BREVO-RESP-001':   { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'Brevo válasz nem JSON', requiredContext: ['contentType'] },
  'BREVO-ACCT-001':   { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'Brevo fiók suspended', requiredContext: ['statusCode'] },
  'EMAIL-BOTH-001':   { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'Resend ÉS Brevo is failed — LEAD ELVESZHET', requiredContext: ['resendError', 'brevoError', 'formId'] },
  'EMAIL-CFG-001':    { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'Egyik email provider API key sincs beállítva', requiredContext: ['hasResendKey', 'hasBrevoKey'] },
};

// ============================================================
// 5. SHEETS — Google Sheets API & Webhook (28 kód)
// ============================================================

export const SHEETS_CODES: Record<string, ErrorCodeDef> = {
  'SHEETS-NET-001':     { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'Webhook nem elérhető (network)', requiredContext: ['webhookUrlPrefix'] },
  'SHEETS-NET-002':     { severity: 'WARN',     retryable: true,  userImpact: 'degraded', message: 'Webhook timeout (>10s)', requiredContext: ['durationMs'] },
  'SHEETS-AUTH-001':    { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Webhook 401/403 — jogosultság', requiredContext: ['statusCode'] },
  'SHEETS-AUTH-002':    { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'Google OAuth token lejárt', requiredContext: ['statusCode'] },
  'SHEETS-QUOTA-001':   { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Apps Script napi execution quota (6 perc)', requiredContext: ['statusCode'] },
  'SHEETS-QUOTA-002':   { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'Apps Script trigger quota (20/nap)', requiredContext: ['triggerCount'] },
  'SHEETS-QUOTA-003':   { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'Sheets API rate limit (100 req/100s)', requiredContext: ['requestsLastMinute'] },
  'SHEETS-QUOTA-004':   { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'Sheet 10M cella limit közelít', requiredContext: ['cellCount'] },
  'SHEETS-QUOTA-005':   { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'Apps Script URL fetch quota (20k/nap)', requiredContext: ['dailyFetchCount'] },
  'SHEETS-API-001':     { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Sheets API 400 — invalid request', requiredContext: ['statusCode', 'errorMessage'] },
  'SHEETS-API-002':     { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Sheets API 403 — no access', requiredContext: ['statusCode', 'sheetId'] },
  'SHEETS-API-003':     { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Sheets API 404 — spreadsheet nem létezik', requiredContext: ['statusCode', 'sheetId'] },
  'SHEETS-API-004':     { severity: 'WARN',     retryable: true,  userImpact: 'degraded', message: 'Sheets API 429 — rate limited', requiredContext: ['statusCode', 'retryAfter'] },
  'SHEETS-API-005':     { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'Sheets API 500 — Google szerver hiba', requiredContext: ['statusCode'] },
  'SHEETS-API-006':     { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'Sheets API 503 — service unavailable', requiredContext: ['statusCode'] },
  'SHEETS-WRITE-001':   { severity: 'ERROR',    retryable: true,  userImpact: 'degraded', message: 'appendRow() hiba', requiredContext: ['sheetName'] },
  'SHEETS-WRITE-002':   { severity: 'CRITICAL', retryable: false, userImpact: 'degraded', message: 'Sor nem íródott ki (silent failure)', requiredContext: ['sheetName'] },
  'SHEETS-WRITE-003':   { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'Rossz tab-ra írt', requiredContext: ['targetTab', 'actualTab'] },
  'SHEETS-COL-001':     { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Oszlop mismatch — kevesebb adat mint header', requiredContext: ['expectedCols', 'receivedCols'] },
  'SHEETS-COL-002':     { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Oszlop mismatch — több adat mint header', requiredContext: ['expectedCols', 'receivedCols'] },
  'SHEETS-PARSE-001':   { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Apps Script JSON parse hiba', requiredContext: ['bodyPreview'] },
  'SHEETS-PARSE-002':   { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'Apps Script response JSON hiba', requiredContext: ['scriptResponse'] },
  'SHEETS-DUP-001':     { severity: 'INFO',     retryable: false, userImpact: 'none',     message: 'Duplikált submission (<5s)', requiredContext: ['requestId', 'timeSinceLast'] },
  'SHEETS-PERM-001':    { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Sheet sharing permission megváltozott', requiredContext: ['sheetId'] },
  'SHEETS-DEL-001':     { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'Sheet vagy tab törölve', requiredContext: ['sheetName'] },
  'SHEETS-URL-001':     { severity: 'CRITICAL', retryable: false, userImpact: 'degraded', message: 'Webhook URL nincs beállítva', requiredContext: ['envVarName'] },
  'SHEETS-URL-002':     { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Webhook URL formátum hibás', requiredContext: ['urlPrefix'] },
  'SHEETS-DEPLOY-001':  { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Apps Script deploy outdated', requiredContext: ['scriptVersion'] },
};

// ============================================================
// 6. TURN — Cloudflare Turnstile (13 kód)
// ============================================================

export const TURN_CODES: Record<string, ErrorCodeDef> = {
  'TURN-LOAD-001':    { severity: 'ERROR',    retryable: true,  userImpact: 'blocked',  message: 'Widget JS nem töltött be', requiredContext: ['page'] },
  'TURN-LOAD-002':    { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Widget renderelés hiba', requiredContext: ['containerId'] },
  'TURN-TOKEN-001':   { severity: 'WARN',     retryable: true,  userImpact: 'degraded', message: 'Widget nem adott tokent', requiredContext: ['waitedMs'] },
  'TURN-TOKEN-002':   { severity: 'ERROR',    retryable: true,  userImpact: 'blocked',  message: 'Token üres string', requiredContext: ['widgetState'] },
  'TURN-VERIFY-001':  { severity: 'WARN',     retryable: true,  userImpact: 'degraded', message: 'Server verification failed', requiredContext: ['errorCodes'] },
  'TURN-VERIFY-002':  { severity: 'WARN',     retryable: true,  userImpact: 'degraded', message: 'Token expired (>300s)', requiredContext: ['tokenAge', 'formId'] },
  'TURN-VERIFY-003':  { severity: 'ERROR',    retryable: true,  userImpact: 'blocked',  message: 'Verification API nem elérhető', requiredContext: ['errorMessage'] },
  'TURN-VERIFY-004':  { severity: 'WARN',     retryable: true,  userImpact: 'degraded', message: 'Verification API timeout', requiredContext: ['durationMs'] },
  'TURN-KEY-001':     { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Site key hibás/lejárt', requiredContext: ['keyPrefix'] },
  'TURN-KEY-002':     { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Secret key hibás', requiredContext: ['statusCode'] },
  'TURN-KEY-003':     { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Site key ↔ domain mismatch', requiredContext: ['currentDomain'] },
  'TURN-CSP-001':     { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'CSP blokkolja a Turnstile JS-t', requiredContext: ['cspHeader'] },
  'TURN-INVIS-001':   { severity: 'INFO',     retryable: false, userImpact: 'none',     message: 'Invisible → interactive fallback', requiredContext: ['challengeType'] },
};

// ============================================================
// 7. KV — Cloudflare KV (14 kód)
// ============================================================

export const KV_CODES: Record<string, ErrorCodeDef> = {
  'KV-READ-001':   { severity: 'ERROR', retryable: true,  userImpact: 'degraded', message: 'KV.get() threw', requiredContext: ['key', 'errorMessage'] },
  'KV-READ-002':   { severity: 'WARN',  retryable: true,  userImpact: 'degraded', message: 'KV.get() timeout', requiredContext: ['durationMs', 'key'] },
  'KV-READ-003':   { severity: 'WARN',  retryable: false, userImpact: 'degraded', message: 'KV.get() unexpected value', requiredContext: ['key', 'valueType'] },
  'KV-WRITE-001':  { severity: 'ERROR', retryable: true,  userImpact: 'degraded', message: 'KV.put() threw', requiredContext: ['key', 'errorMessage'] },
  'KV-WRITE-002':  { severity: 'WARN',  retryable: true,  userImpact: 'degraded', message: 'KV.put() timeout', requiredContext: ['durationMs', 'key'] },
  'KV-WRITE-003':  { severity: 'WARN',  retryable: false, userImpact: 'none',     message: 'KV value túl nagy', requiredContext: ['valueSize'] },
  'KV-DEL-001':    { severity: 'WARN',  retryable: true,  userImpact: 'none',     message: 'KV.delete() threw', requiredContext: ['key', 'errorMessage'] },
  'KV-BIND-001':   { severity: 'CRITICAL', retryable: false, userImpact: 'blocked', message: 'KV namespace binding hiányzik', requiredContext: ['expectedBinding'] },
  'KV-BIND-002':   { severity: 'ERROR', retryable: false, userImpact: 'blocked',  message: 'KV namespace ID hibás', requiredContext: ['namespaceId'] },
  'KV-QUOTA-001':  { severity: 'WARN',  retryable: false, userImpact: 'degraded', message: 'KV napi read limit (100k)', requiredContext: ['dailyReads'] },
  'KV-QUOTA-002':  { severity: 'WARN',  retryable: false, userImpact: 'degraded', message: 'KV napi write limit (1k)', requiredContext: ['dailyWrites'] },
  'KV-TTL-001':    { severity: 'WARN',  retryable: false, userImpact: 'none',     message: 'TTL <60s (CF minimum)', requiredContext: ['attemptedTtl'] },
  'KV-RATE-001':   { severity: 'ERROR', retryable: false, userImpact: 'degraded', message: 'Rate limit logic threw', requiredContext: ['ip', 'endpoint'] },
  'KV-RATE-002':   { severity: 'WARN',  retryable: false, userImpact: 'none',     message: 'KV unavailable → rate limit bypass', requiredContext: ['ip', 'endpoint'] },
};

// ============================================================
// 8. FORM — Form Handling (30 kód)
// ============================================================

export const FORM_CODES: Record<string, ErrorCodeDef> = {
  'FORM-ZOD-001':      { severity: 'ERROR', retryable: false, userImpact: 'blocked',  message: 'Zod schema definíciós hiba', requiredContext: ['schemaName'] },
  'FORM-ZOD-002':      { severity: 'WARN',  retryable: false, userImpact: 'degraded', message: 'Validation — required field hiányzik', requiredContext: ['fieldName', 'formId'] },
  'FORM-ZOD-003':      { severity: 'WARN',  retryable: false, userImpact: 'degraded', message: 'Validation — formátum (email/phone)', requiredContext: ['fieldName', 'fieldType'] },
  'FORM-ZOD-004':      { severity: 'WARN',  retryable: false, userImpact: 'degraded', message: 'Validation — custom refinement', requiredContext: ['refinementName'] },
  'FORM-BODY-001':     { severity: 'WARN',  retryable: false, userImpact: 'blocked',  message: 'Request body parse hiba', requiredContext: ['contentType'] },
  'FORM-BODY-002':     { severity: 'WARN',  retryable: false, userImpact: 'blocked',  message: 'Request body túl nagy (>1MB)', requiredContext: ['bodySize'] },
  'FORM-BODY-003':     { severity: 'WARN',  retryable: false, userImpact: 'blocked',  message: 'Request body üres', requiredContext: ['contentLength'] },
  'FORM-HONEY-001':    { severity: 'INFO',  retryable: false, userImpact: 'none',     message: 'Honeypot kitöltve — bot', requiredContext: ['fieldValue'] },
  'FORM-TIME-001':     { severity: 'INFO',  retryable: false, userImpact: 'none',     message: '<3s kitöltés — bot', requiredContext: ['fillTimeMs'] },
  'FORM-GDPR-001':     { severity: 'INFO',  retryable: false, userImpact: 'none',     message: 'GDPR checkbox nem jelölt', requiredContext: ['formId'] },
  'FORM-GDPR-002':     { severity: 'WARN',  retryable: false, userImpact: 'none',     message: 'GDPR timestamp invalid', requiredContext: ['timestampValue'] },
  'FORM-SUBMIT-001':   { severity: 'CRITICAL', retryable: false, userImpact: 'blocked', message: 'Handler top-level exception', requiredContext: ['formId', 'errorMessage'] },
  'FORM-SUBMIT-002':   { severity: 'CRITICAL', retryable: false, userImpact: 'blocked', message: 'Handler timeout (CF 30s)', requiredContext: ['formId', 'durationMs'] },
  'FORM-SUBMIT-003':   { severity: 'WARN',  retryable: false, userImpact: 'none',     message: 'Dupla submit (<2s)', requiredContext: ['formId', 'timeSinceLast'] },
  'FORM-FETCH-001':    { severity: 'ERROR', retryable: true,  userImpact: 'blocked',  message: 'Client fetch endpoint-ra failed', requiredContext: ['endpoint'] },
  'FORM-FETCH-002':    { severity: 'ERROR', retryable: false, userImpact: 'blocked',  message: 'Client fetch — non-JSON response', requiredContext: ['statusCode', 'contentType'] },
  'FORM-FETCH-003':    { severity: 'WARN',  retryable: true,  userImpact: 'degraded', message: 'Client fetch timeout', requiredContext: ['durationMs', 'endpoint'] },
  'FORM-ID-001':       { severity: 'WARN',  retryable: false, userImpact: 'none',     message: 'requestId generálás hiba', requiredContext: ['fallbackUsed'] },
  'FORM-STATE-001':    { severity: 'WARN',  retryable: false, userImpact: 'degraded', message: 'Form state restoration hiba', requiredContext: ['stateKeys'] },
  'FORM-TYPO-001':     { severity: 'INFO',  retryable: false, userImpact: 'none',     message: 'Email typo detection crash', requiredContext: ['inputLength'] },
  'FORM-POST-001':     { severity: 'WARN',  retryable: true,  userImpact: 'degraded', message: 'Postcode lookup API nem elérhető', requiredContext: ['statusCode'] },
  'FORM-POST-002':     { severity: 'INFO',  retryable: false, userImpact: 'none',     message: 'Postcode érvénytelen', requiredContext: ['postcodePrefix'] },
  'FORM-POST-003':     { severity: 'WARN',  retryable: true,  userImpact: 'degraded', message: 'Postcode lookup timeout', requiredContext: ['durationMs'] },
  'FORM-POST-004':     { severity: 'ERROR', retryable: false, userImpact: 'degraded', message: 'HU postcode JSON betöltés hiba', requiredContext: ['errorMessage'] },
  'FORM-ANIM-001':     { severity: 'INFO',  retryable: false, userImpact: 'none',     message: 'City autofill animáció JS error', requiredContext: ['errorMessage'] },
  'FORM-CORS-001':     { severity: 'ERROR', retryable: false, userImpact: 'blocked',  message: 'CORS hiba form submit-nél', requiredContext: ['origin', 'endpoint'] },
  'FORM-METHOD-001':   { severity: 'WARN',  retryable: false, userImpact: 'blocked',  message: 'Rossz HTTP method', requiredContext: ['method', 'endpoint'] },
  'FORM-ENCODE-001':   { severity: 'WARN',  retryable: false, userImpact: 'degraded', message: 'Form data encoding hiba', requiredContext: ['charset'] },
  'FORM-DISABLED-001': { severity: 'WARN',  retryable: false, userImpact: 'blocked',  message: 'Submit button disabled maradt', requiredContext: ['formId'] },
  'FORM-FOCUS-001':    { severity: 'INFO',  retryable: false, userImpact: 'none',     message: 'Auto-focus hibás mezőre ugrott', requiredContext: ['targetField'] },
};

// ============================================================
// 9. CALC — Calculator (30 kód)
// ============================================================

export const CALC_CODES: Record<string, ErrorCodeDef> = {
  'CALC-PRICE-001':    { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'Pricing function throw', requiredContext: ['answers', 'errorMessage'] },
  'CALC-PRICE-002':    { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'NaN eredmény', requiredContext: ['answers'] },
  'CALC-PRICE-003':    { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Negatív eredmény', requiredContext: ['answers', 'result'] },
  'CALC-PRICE-004':    { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Irreálisan magas (sanity fail)', requiredContext: ['result', 'maxExpected'] },
  'CALC-PRICE-005':    { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Breakdown ≠ total', requiredContext: ['total', 'breakdownSum'] },
  'CALC-STEP-001':     { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Érvénytelen step', requiredContext: ['fromStep', 'toStep'] },
  'CALC-STEP-002':     { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Step kihagyás', requiredContext: ['fromStep', 'toStep'] },
  'CALC-STEP-003':     { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Eredmény oldal answer-ök nélkül', requiredContext: ['missingSteps'] },
  'CALC-STEP-004':     { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Step config betöltés hiba', requiredContext: ['stepId'] },
  'CALC-OPT-001':      { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Option config hiányzik', requiredContext: ['stepId'] },
  'CALC-OPT-002':      { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Opció nem létezik config-ban', requiredContext: ['stepId', 'optionValue'] },
  'CALC-LS-001':       { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'localStorage.setItem() threw', requiredContext: ['key'] },
  'CALC-LS-002':       { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'localStorage invalid JSON', requiredContext: ['key'] },
  'CALC-LS-003':       { severity: 'INFO',     retryable: false, userImpact: 'degraded', message: 'localStorage SecurityError', requiredContext: ['errorMessage'] },
  'CALC-HASH-001':     { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Hash generálás failed', requiredContext: ['inputLength'] },
  'CALC-HASH-002':     { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Hash URL létrehozás hiba', requiredContext: ['hash'] },
  'CALC-HASH-003':     { severity: 'WARN',     retryable: false, userImpact: 'blocked',  message: 'Hash visszafejtés hiba', requiredContext: ['hashFromUrl'] },
  'CALC-GTM-001':      { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'dataLayer.push() threw', requiredContext: ['event'] },
  'CALC-GTM-002':      { severity: 'INFO',     retryable: false, userImpact: 'none',     message: 'dataLayer undefined', requiredContext: ['page'] },
  'CALC-RADIO-001':    { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Radio card click handler hiba', requiredContext: ['stepId'] },
  'CALC-CHECK-001':    { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Checkbox state kezelés hiba', requiredContext: ['stepId'] },
  'CALC-DROP-001':     { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'Dropdown select hiba', requiredContext: ['stepId'] },
  'CALC-AUTO-001':     { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Auto-advance nem triggerelődött', requiredContext: ['stepId'] },
  'CALC-AUTO-002':     { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'Auto-advance túl korán', requiredContext: ['stepId', 'delayMs'] },
  'CALC-BACK-001':     { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'popstate handler hiba', requiredContext: ['errorMessage'] },
  'CALC-BACK-002':     { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'history.pushState() threw', requiredContext: ['stateSize'] },
  'CALC-PROOF-001':    { severity: 'INFO',     retryable: false, userImpact: 'none',     message: 'Social proof config hiányzik', requiredContext: ['stepId'] },
  'CALC-SKEL-001':     { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Loading skeleton nem tűnt el', requiredContext: ['stepId', 'waitedMs'] },
  'CALC-MOB-001':      { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'StickyMobileCTA hiba', requiredContext: ['viewportWidth'] },
  'CALC-PREFETCH-001': { severity: 'INFO',     retryable: true,  userImpact: 'none',     message: 'Next step prefetch failed', requiredContext: ['targetUrl'] },
};

// ============================================================
// 10. SEO (45 kód)
// ============================================================

export const SEO_CODES: Record<string, ErrorCodeDef> = {
  // Schema
  'SEO-SCHEMA-001':  { severity: 'ERROR',    retryable: false, userImpact: 'none', message: 'JSON-LD szintaxis hiba', requiredContext: ['page'] },
  'SEO-SCHEMA-002':  { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'LocalBusiness schema hiányzik', requiredContext: ['page'] },
  'SEO-SCHEMA-003':  { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'FAQPage schema hiányzik', requiredContext: ['page', 'faqCount'] },
  'SEO-SCHEMA-004':  { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Service schema hiányzik', requiredContext: ['page'] },
  'SEO-SCHEMA-005':  { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Schema validation error', requiredContext: ['page', 'schemaType', 'errors'] },
  'SEO-SCHEMA-006':  { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'AggregateRating invalid', requiredContext: ['page', 'ratingValue'] },
  'SEO-SCHEMA-007':  { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Breadcrumb schema ≠ URL struktúra', requiredContext: ['page', 'breadcrumbPath'] },
  'SEO-SCHEMA-008':  { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Speakable schema hiányzik (AI visibility)', requiredContext: ['page'] },
  'SEO-SCHEMA-009':  { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Schema @id nem egyedi', requiredContext: ['page', 'duplicateId'] },
  'SEO-SCHEMA-010':  { severity: 'INFO',     retryable: false, userImpact: 'none', message: 'Schema @type nem ismert Google-nek', requiredContext: ['page', 'schemaType'] },
  // Meta
  'SEO-META-001':    { severity: 'ERROR',    retryable: false, userImpact: 'none', message: 'Title tag hiányzik', requiredContext: ['page'] },
  'SEO-META-002':    { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Title >60 char', requiredContext: ['page', 'titleLength'] },
  'SEO-META-003':    { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Title duplikált', requiredContext: ['page', 'duplicatePage'] },
  'SEO-META-004':    { severity: 'ERROR',    retryable: false, userImpact: 'none', message: 'Meta description hiányzik', requiredContext: ['page'] },
  'SEO-META-005':    { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Description >160 char', requiredContext: ['page', 'descLength'] },
  'SEO-META-006':    { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Description duplikált', requiredContext: ['page', 'duplicatePage'] },
  'SEO-META-007':    { severity: 'ERROR',    retryable: false, userImpact: 'none', message: 'Canonical URL hiányzik', requiredContext: ['page'] },
  'SEO-META-008':    { severity: 'ERROR',    retryable: false, userImpact: 'none', message: 'Canonical ≠ aktuális URL', requiredContext: ['page', 'canonicalUrl'] },
  'SEO-META-009':    { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Canonical → 404', requiredContext: ['page', 'canonicalUrl'] },
  'SEO-META-010':    { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'OG tags hiányoznak', requiredContext: ['page'] },
  'SEO-META-011':    { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'OG image 404', requiredContext: ['page', 'ogImageUrl'] },
  'SEO-META-012':    { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Twitter Card tags hiányoznak', requiredContext: ['page'] },
  'SEO-META-013':    { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Hreflang tag hibás', requiredContext: ['page', 'hreflang'] },
  'SEO-META-014':    { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Hreflang x-default hiányzik', requiredContext: ['page'] },
  'SEO-META-015':    { severity: 'CRITICAL', retryable: false, userImpact: 'blocked', message: 'Meta robots noindex PRODBAN!', requiredContext: ['page', 'robotsContent'] },
  // Sitemap & Robots
  'SEO-SITEMAP-001': { severity: 'ERROR',    retryable: false, userImpact: 'none', message: 'sitemap.xml nem generálódik', requiredContext: ['errorMessage'] },
  'SEO-SITEMAP-002': { severity: 'ERROR',    retryable: false, userImpact: 'none', message: 'sitemap.xml üres', requiredContext: ['siteUrl'] },
  'SEO-SITEMAP-003': { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'sitemap.xml 404-es URL-t tartalmaz', requiredContext: ['deadUrl'] },
  'SEO-SITEMAP-004': { severity: 'INFO',     retryable: false, userImpact: 'none', message: 'sitemap.xml lastmod hiányzik', requiredContext: ['urlCount'] },
  'SEO-SITEMAP-005': { severity: 'ERROR',    retryable: false, userImpact: 'none', message: 'sitemap.xml nem elérhető', requiredContext: ['statusCode'] },
  'SEO-ROBOTS-001':  { severity: 'ERROR',    retryable: false, userImpact: 'none', message: 'robots.txt hiányzik', requiredContext: ['statusCode'] },
  'SEO-ROBOTS-002':  { severity: 'CRITICAL', retryable: false, userImpact: 'blocked', message: 'robots.txt Disallow: / PRODBAN!', requiredContext: ['robotsContent'] },
  'SEO-ROBOTS-003':  { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'robots.txt LLM crawlerek blokkolva', requiredContext: ['blockedBots'] },
  'SEO-ROBOTS-004':  { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'robots.txt szintaxis hiba', requiredContext: ['lineNumber'] },
  'SEO-ROBOTS-005':  { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'robots.txt nem referálja sitemap-et', requiredContext: ['robotsContent'] },
  // Indexing
  'SEO-INDEX-001':   { severity: 'CRITICAL', retryable: false, userImpact: 'blocked', message: 'Noindex prod oldalon', requiredContext: ['page', 'source'] },
  'SEO-INDEX-002':   { severity: 'CRITICAL', retryable: false, userImpact: 'blocked', message: 'X-Robots-Tag noindex prodban', requiredContext: ['page'] },
  'SEO-INDEX-003':   { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Redirect chain >2 hop', requiredContext: ['from', 'hopCount'] },
  'SEO-INDEX-004':   { severity: 'ERROR',    retryable: false, userImpact: 'none', message: 'Redirect loop', requiredContext: ['urls'] },
  'SEO-INDEX-005':   { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Orphan page (nincs belső link)', requiredContext: ['page'] },
  'SEO-INDEX-006':   { severity: 'WARN',     retryable: false, userImpact: 'none', message: 'Thin content (<300 szó)', requiredContext: ['page', 'wordCount'] },
  // CWV
  'SEO-PERF-001':    { severity: 'WARN', retryable: false, userImpact: 'degraded', message: 'LCP >2.5s', requiredContext: ['page', 'lcpMs'] },
  'SEO-PERF-002':    { severity: 'WARN', retryable: false, userImpact: 'degraded', message: 'CLS >0.1', requiredContext: ['page', 'clsScore'] },
  'SEO-PERF-003':    { severity: 'WARN', retryable: false, userImpact: 'degraded', message: 'INP >200ms', requiredContext: ['page', 'inpMs'] },
  'SEO-PERF-004':    { severity: 'WARN', retryable: false, userImpact: 'degraded', message: 'TTFB >800ms', requiredContext: ['page', 'ttfbMs'] },
};

// ============================================================
// 11–15. CFG, BUILD, NET, JS, IMG (70 kód)
// ============================================================

export const CFG_CODES: Record<string, ErrorCodeDef> = {
  'CFG-ENV-001':      { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'RESEND_API_KEY hiányzik', requiredContext: ['varName'] },
  'CFG-ENV-002':      { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'BREVO_API_KEY hiányzik', requiredContext: ['varName'] },
  'CFG-ENV-003':      { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'GOOGLE_SHEETS_WEBHOOK_URL hiányzik', requiredContext: ['varName'] },
  'CFG-ENV-004':      { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'TURNSTILE_SECRET_KEY hiányzik', requiredContext: ['varName'] },
  'CFG-ENV-005':      { severity: 'CRITICAL', retryable: false, userImpact: 'blocked',  message: 'TURNSTILE_SITE_KEY hiányzik', requiredContext: ['varName'] },
  'CFG-ENV-006':      { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'SITE_URL hiányzik/hibás', requiredContext: ['varName'] },
  'CFG-ENV-007':      { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'ERROR_SHEETS_WEBHOOK_URL hiányzik', requiredContext: ['varName'] },
  'CFG-ENV-008':      { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'ERROR_EMAIL_TO hiányzik', requiredContext: ['varName'] },
  'CFG-ENV-009':      { severity: 'WARN',     retryable: false, userImpact: 'none',     message: 'PUBLIC_SITE_ID hiányzik', requiredContext: ['varName'] },
  'CFG-ENV-010':      { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Env var whitespace-t tartalmaz', requiredContext: ['varName'] },
  'CFG-SITE-001':     { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'site.ts config parse hiba', requiredContext: ['errorMessage'] },
  'CFG-I18N-001':     { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'i18n key hiányzik', requiredContext: ['key', 'locale'] },
  'CFG-CSP-001':      { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'CSP header szintaxis hiba', requiredContext: ['headerPreview'] },
  'CFG-CSP-002':      { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'CSP blokkolja saját scriptet', requiredContext: ['blockedResource'] },
  'CFG-WRANGLER-001': { severity: 'ERROR',    retryable: false, userImpact: 'blocked',  message: 'wrangler.toml parse/binding hiba', requiredContext: ['errorMessage'] },
};

export const BUILD_CODES: Record<string, ErrorCodeDef> = {
  'BUILD-ASTRO-001':   { severity: 'CRITICAL', retryable: false, userImpact: 'blocked', message: 'Astro build failed', requiredContext: ['errorMessage', 'file'] },
  'BUILD-ASTRO-002':   { severity: 'INFO',     retryable: false, userImpact: 'none',    message: 'Astro build warning', requiredContext: ['warningMessage'] },
  'BUILD-TS-001':      { severity: 'ERROR',    retryable: false, userImpact: 'blocked', message: 'TypeScript compilation error', requiredContext: ['file', 'tsError'] },
  'BUILD-IMG-001':     { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Image optimization hiba', requiredContext: ['imagePath'] },
  'BUILD-IMG-002':     { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Referenced image hiányzik', requiredContext: ['referencedPath'] },
  'BUILD-CSS-001':     { severity: 'INFO',     retryable: false, userImpact: 'none',    message: 'Tailwind class nem létezik', requiredContext: ['className'] },
  'BUILD-CSS-002':     { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'CSS bundle >50KB', requiredContext: ['bundleSize'] },
  'BUILD-DEPLOY-001':  { severity: 'CRITICAL', retryable: true,  userImpact: 'blocked', message: 'CF Workers deploy failed', requiredContext: ['deployId'] },
  'BUILD-DEPLOY-002':  { severity: 'WARN',     retryable: true,  userImpact: 'none',    message: 'CF Workers deploy timeout', requiredContext: ['durationMs'] },
  'BUILD-DEPLOY-003':  { severity: 'ERROR',    retryable: false, userImpact: 'blocked', message: 'Function size >1MB', requiredContext: ['functionSize'] },
  'BUILD-SITEMAP-001': { severity: 'ERROR',    retryable: false, userImpact: 'none',    message: 'Sitemap generálás hiba', requiredContext: ['errorMessage'] },
  'BUILD-ROUTE-001':   { severity: 'ERROR',    retryable: false, userImpact: 'degraded', message: 'Duplicate route', requiredContext: ['route', 'files'] },
  'BUILD-SIZE-001':    { severity: 'WARN',     retryable: false, userImpact: 'degraded', message: 'Page HTML >100KB', requiredContext: ['page', 'size'] },
  'BUILD-PERF-001':    { severity: 'INFO',     retryable: false, userImpact: 'none',    message: 'Build >5 perc', requiredContext: ['durationMs'] },
  'BUILD-SCHEMA-001':  { severity: 'WARN',     retryable: false, userImpact: 'none',    message: 'JSON-LD build-time validation hiba', requiredContext: ['schemaType'] },
};

export const NET_CODES: Record<string, ErrorCodeDef> = {
  'NET-OFFLINE-001':  { severity: 'INFO',  retryable: false, userImpact: 'blocked',  message: 'Böngésző offline', requiredContext: ['lastPage'] },
  'NET-DNS-001':      { severity: 'ERROR', retryable: true,  userImpact: 'blocked',  message: 'DNS resolution failed', requiredContext: ['hostname'] },
  'NET-SSL-001':      { severity: 'ERROR', retryable: false, userImpact: 'blocked',  message: 'SSL/TLS hiba', requiredContext: ['hostname'] },
  'NET-MIXED-001':    { severity: 'ERROR', retryable: false, userImpact: 'degraded', message: 'Mixed content (HTTP in HTTPS)', requiredContext: ['blockedUrl', 'page'] },
  'NET-TIMEOUT-001':  { severity: 'WARN',  retryable: true,  userImpact: 'degraded', message: 'Generic fetch timeout', requiredContext: ['url', 'timeoutMs'] },
  'NET-ABORT-001':    { severity: 'INFO',  retryable: false, userImpact: 'none',     message: 'Fetch aborted', requiredContext: ['url'] },
  'NET-SIZE-001':     { severity: 'WARN',  retryable: false, userImpact: 'degraded', message: 'Response >5MB', requiredContext: ['url', 'size'] },
  'NET-REDIRECT-001': { severity: 'ERROR', retryable: false, userImpact: 'blocked',  message: 'Túl sok redirect (>5)', requiredContext: ['url', 'redirectCount'] },
  'NET-CF-001':       { severity: 'ERROR', retryable: true,  userImpact: 'blocked',  message: 'CF edge error (52x)', requiredContext: ['cfRay', 'statusCode'] },
  'NET-CF-002':       { severity: 'WARN',  retryable: false, userImpact: 'blocked',  message: 'CF WAF challenge (403)', requiredContext: ['cfRay'] },
};

export const JS_CODES: Record<string, ErrorCodeDef> = {
  'JS-UNHANDLED-001': { severity: 'ERROR', retryable: false, userImpact: 'degraded', message: 'Uncaught synchronous error', requiredContext: ['source', 'line', 'col'] },
  'JS-PROMISE-001':   { severity: 'ERROR', retryable: false, userImpact: 'degraded', message: 'Unhandled promise rejection', requiredContext: ['message'] },
  'JS-SYNTAX-001':    { severity: 'ERROR', retryable: false, userImpact: 'blocked',  message: 'Script parse error', requiredContext: ['source'] },
  'JS-TYPE-001':      { severity: 'ERROR', retryable: false, userImpact: 'degraded', message: 'TypeError', requiredContext: ['source', 'message'] },
  'JS-REF-001':       { severity: 'ERROR', retryable: false, userImpact: 'degraded', message: 'ReferenceError', requiredContext: ['source', 'message'] },
  'JS-RANGE-001':     { severity: 'ERROR', retryable: false, userImpact: 'blocked',  message: 'RangeError', requiredContext: ['source'] },
};

export const IMG_CODES: Record<string, ErrorCodeDef> = {
  'IMG-LOAD-001': { severity: 'WARN', retryable: true,  userImpact: 'degraded', message: 'Kép nem töltött be', requiredContext: ['src', 'page'] },
  'IMG-AVIF-001': { severity: 'WARN', retryable: false, userImpact: 'degraded', message: 'AVIF+WebP fallback is failed', requiredContext: ['src'] },
  'IMG-SIZE-001': { severity: 'INFO', retryable: false, userImpact: 'degraded', message: 'Kép >500KB (nem optimalizált)', requiredContext: ['src', 'size'] },
  'IMG-ALT-001':  { severity: 'INFO', retryable: false, userImpact: 'none',     message: 'Alt text hiányzik', requiredContext: ['src', 'page'] },
};

// ============================================================
// PROJECT-SPECIFIC — Projektenként bővítsd
// ============================================================

export const PROJECT_CODES: Record<string, ErrorCodeDef> = {
  // Példa Painless Removals:
  // 'MOVE-DIST-001': { severity: 'ERROR', retryable: true, userImpact: 'degraded', message: 'Distance API failed', requiredContext: ['from', 'to'] },
};

// ============================================================
// MERGED — Egyetlen lookup tábla
// ============================================================

export const ALL_CODES: Record<string, ErrorCodeDef> = {
  ...HTTP_CODES,
  ...SRV_CODES,
  ...RESEND_CODES,
  ...BREVO_CODES,
  ...SHEETS_CODES,
  ...TURN_CODES,
  ...KV_CODES,
  ...FORM_CODES,
  ...CALC_CODES,
  ...SEO_CODES,
  ...CFG_CODES,
  ...BUILD_CODES,
  ...NET_CODES,
  ...JS_CODES,
  ...IMG_CODES,
  ...PROJECT_CODES,
};
