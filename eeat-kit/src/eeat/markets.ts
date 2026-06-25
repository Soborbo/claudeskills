/**
 * Market packs: validators + recognised trust tokens for the UK and Hungary.
 * Pure string functions so they are trivially unit-testable.
 */
import type { Market } from './types';

/* ------------------------------------------------------------------ UK --- */

/** UK Companies House number: 8 digits, or 2 letters + 6 digits (SC/NI/OC…). */
export function isValidUkCompanyNumber(raw: string): boolean {
  const s = raw.trim().toUpperCase();
  return /^(?:\d{8}|[A-Z]{2}\d{6})$/.test(s);
}

export const UK_COMPANY_NUMBER_RE = /\b(?:\d{8}|[A-Z]{2}\d{6})\b/;

/** Recognised UK trade/consumer trust marks (logo + link to register = signal). */
export const UK_ACCREDITATIONS: Record<string, RegExp> = {
  'Gas Safe Register': /\bgas\s*safe\b/i,
  NICEIC: /\bniceic\b/i,
  NAPIT: /\bnapit\b/i,
  TrustMark: /\btrustmark\b/i,
  'Which? Trusted Traders': /\bwhich\?? *trusted *traders?\b/i,
  Checkatrade: /\bcheckatrade\b/i,
  TrustATrader: /\btrustatrader\b/i,
  FENSA: /\bfensa\b/i,
  CERTASS: /\bcertass\b/i,
  MCS: /\bmcs\b/i,
  HETAS: /\bhetas\b/i,
  FMB: /\bfederation of master builders\b|\bfmb\b/i,
};

/* ------------------------------------------------------------------ HU --- */

/**
 * Hungarian adószám: `8digits-1digit-2digits`. The 8th digit of the first
 * block is a CDV check digit over the first 7 (weights 9,7,3,1,9,7,3).
 */
export function isValidHuAdoszam(raw: string): boolean {
  const s = raw.trim();
  const m = /^(\d{8})-([1-5])-(\d{2})$/.exec(s);
  if (!m) return false;
  const core = m[1];
  const weights = [9, 7, 3, 1, 9, 7, 3];
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += Number(core[i]) * weights[i];
  const check = (10 - (sum % 10)) % 10;
  return check === Number(core[7]);
}

export const HU_ADOSZAM_RE = /\b\d{8}-[1-5]-\d{2}\b/;

/** Hungarian cégjegyzékszám: `CC-FF-NNNNNN`; CC = court code 01–20. */
export function isValidHuCegjegyzekszam(raw: string): boolean {
  const m = /^(\d{2})-(\d{2})-(\d{6})$/.exec(raw.trim());
  if (!m) return false;
  const court = Number(m[1]);
  return court >= 1 && court <= 20;
}

export const HU_CEGJEGYZEKSZAM_RE = /\b(?:0[1-9]|1[0-9]|20)-\d{2}-\d{6}\b/;

/** Recognised Hungarian trust signals (seals, review platforms, catalogs). */
export const HU_TRUST_SIGNALS: Record<string, RegExp> = {
  'Árukereső Megbízható Bolt': /megb[íi]zhat[óo] *bolt|árukeres[őo]/i,
  'Ország Boltja': /ország *boltja/i,
  'FEOSZ fogyasztóbarát': /fogyaszt[óo]bar[áa]t/i,
  Trustindex: /trustindex/i,
  Cylex: /cylex/i,
  'Arany Oldalak': /arany *oldalak/i,
  Telefonkönyv: /telefonk[öo]nyv/i,
  Vélemény: /v[ée]lem[ée]nyek?\b/i,
};

/* -------------------------------------------------------------- shared --- */

export function detectAccreditations(textLower: string, market: Market): string[] {
  const table =
    market === 'uk' ? UK_ACCREDITATIONS : market === 'hu' ? HU_TRUST_SIGNALS : {};
  return Object.entries(table)
    .filter(([, re]) => re.test(textLower))
    .map(([name]) => name);
}

/** Find a visible company-registration identifier for the given market. */
export function findRegistration(
  textRaw: string,
  market: Market,
): { kind: string; value: string } | null {
  if (market === 'uk') {
    if (/\b(compan(y|ies)\s*(no\.?|number|reg)|registered in (england|scotland|wales))\b/i.test(textRaw)) {
      const m = UK_COMPANY_NUMBER_RE.exec(textRaw);
      if (m && isValidUkCompanyNumber(m[0])) return { kind: 'companyNumber', value: m[0] };
    }
    return null;
  }
  if (market === 'hu') {
    const c = HU_CEGJEGYZEKSZAM_RE.exec(textRaw);
    if (c && isValidHuCegjegyzekszam(c[0])) return { kind: 'cégjegyzékszám', value: c[0] };
    const a = HU_ADOSZAM_RE.exec(textRaw);
    if (a && isValidHuAdoszam(a[0])) return { kind: 'adószám', value: a[0] };
    return null;
  }
  return null;
}
