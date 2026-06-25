import { describe, expect, it } from 'vitest';
import {
  detectAccreditations,
  findRegistration,
  isValidHuAdoszam,
  isValidHuCegjegyzekszam,
  isValidUkCompanyNumber,
} from '../../src/eeat/markets';

describe('isValidUkCompanyNumber', () => {
  it('accepts 8 digits and 2-letter+6-digit forms', () => {
    expect(isValidUkCompanyNumber('09876543')).toBe(true);
    expect(isValidUkCompanyNumber('SC123456')).toBe(true);
    expect(isValidUkCompanyNumber('OC301010')).toBe(true);
  });
  it('rejects malformed numbers', () => {
    expect(isValidUkCompanyNumber('1234')).toBe(false);
    expect(isValidUkCompanyNumber('123456789')).toBe(false);
    expect(isValidUkCompanyNumber('S1234567')).toBe(false);
  });
});

describe('isValidHuAdoszam (CDV checksum)', () => {
  it('accepts a checksum-valid number', () => {
    expect(isValidHuAdoszam('12180439-2-41')).toBe(true);
  });
  it('rejects a wrong check digit', () => {
    expect(isValidHuAdoszam('12180438-2-41')).toBe(false); // core changed → checksum fails
  });
  it('rejects malformed shapes', () => {
    expect(isValidHuAdoszam('1218043-2-41')).toBe(false);
    expect(isValidHuAdoszam('12180439-9-41')).toBe(false); // 2nd block must be 1–5
    expect(isValidHuAdoszam('not a number')).toBe(false);
  });
});

describe('isValidHuCegjegyzekszam', () => {
  it('accepts a valid court code + shape', () => {
    expect(isValidHuCegjegyzekszam('01-09-264581')).toBe(true);
    expect(isValidHuCegjegyzekszam('20-06-123456')).toBe(true);
  });
  it('rejects an out-of-range court code or bad shape', () => {
    expect(isValidHuCegjegyzekszam('99-09-264581')).toBe(false);
    expect(isValidHuCegjegyzekszam('1-9-264581')).toBe(false);
  });
});

describe('detectAccreditations', () => {
  it('finds UK trade marks', () => {
    const found = detectAccreditations('we are gas safe registered and checkatrade members', 'uk');
    expect(found).toContain('Gas Safe Register');
    expect(found).toContain('Checkatrade');
  });
  it('finds HU trust signals', () => {
    const found = detectAccreditations('árukereső megbízható bolt partnerek vagyunk', 'hu');
    expect(found).toContain('Árukereső Megbízható Bolt');
  });
  it('returns nothing for the generic market', () => {
    expect(detectAccreditations('gas safe', 'generic')).toEqual([]);
  });
});

describe('findRegistration', () => {
  it('extracts a UK company number near a registration label', () => {
    const r = findRegistration('Registered in England, Company No. 09876543.', 'uk');
    expect(r).toEqual({ kind: 'companyNumber', value: '09876543' });
  });
  it('does not invent a UK number without a label', () => {
    expect(findRegistration('call 09876543 today', 'uk')).toBeNull();
  });
  it('extracts a HU cégjegyzékszám', () => {
    const r = findRegistration('Cégjegyzékszám: 01-09-264581', 'hu');
    expect(r).toEqual({ kind: 'cégjegyzékszám', value: '01-09-264581' });
  });
});
