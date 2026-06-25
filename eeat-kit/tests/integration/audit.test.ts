import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { auditPage } from '../../src/eeat/checks';
import { summarize } from '../../src/eeat/audit';

const here = path.dirname(fileURLToPath(import.meta.url));
const fx = (f: string) => readFileSync(path.join(here, '..', 'fixtures', f), 'utf8');

describe('auditPage — strong fixture', () => {
  const results = auditPage({ html: fx('strong-eeat.html'), url: '/trapezlemez-t35/', market: 'hu' });

  it('produces zero blocking failures', () => {
    const fails = results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
  });

  it('detects it as a product page and finds the registration + accreditation', () => {
    expect(results.find((r) => r.id === 'business.registration')?.status).toBe('pass');
    expect(results.find((r) => r.id === 'business.accreditations')?.status).toBe('pass');
    expect(results.find((r) => r.id === 'trust-page.returns')?.status).toBe('pass');
  });
});

describe('auditPage — weak fixture', () => {
  const results = auditPage({ html: fx('weak-eeat.html'), url: '/blog/how-to-choose/', market: 'uk' });
  const ids = results.filter((r) => r.status === 'fail').map((r) => r.id);

  it('flags the missing author byline on an article', () => {
    expect(ids).toContain('author.visible-byline');
  });

  it('flags missing required trust pages (contact, privacy)', () => {
    expect(ids).toContain('trust-page.contact');
    expect(ids).toContain('trust-page.privacy');
  });

  it('summarize() returns exit code 1 when fails exist', () => {
    expect(summarize(results).exitCode).toBe(1);
  });
});
