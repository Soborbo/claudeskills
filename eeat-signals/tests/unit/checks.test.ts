import { describe, expect, it } from 'vitest';
import { parse } from '../../src/eeat/dom';
import {
  auditPage,
  checkAnswerFirst,
  checkAuthor,
  checkBioCredentials,
  checkBusinessTrust,
  checkExperienceMarkers,
  checkExperienceVerified,
  checkHuImpresszum,
  checkTrustPages,
} from '../../src/eeat/checks';
import type { CheckResult } from '../../src/eeat/types';

const byId = (rs: CheckResult[], id: string) => rs.find((r) => r.id === id);

describe('checkAuthor', () => {
  it('fails an article with no visible byline', () => {
    const doc = parse('<article><h1>Title</h1><p>Some body text here.</p></article>');
    expect(checkAuthor(doc, 'article').status).toBe('fail');
  });
  it('passes when an author element is present', () => {
    const doc = parse('<article><span class="author">By Jane Doe</span><p>Body.</p></article>');
    expect(checkAuthor(doc, 'article').status).toBe('pass');
  });
  it('is not_found on a generic page with no author', () => {
    const doc = parse('<main><p>Plain content.</p></main>');
    expect(checkAuthor(doc, 'generic').status).toBe('not_found');
  });
});

describe('checkBioCredentials', () => {
  it('passes when the bio carries specifics', () => {
    const doc = parse('<div class="author-bio"><p>Jane has 9 years experience, certified since 2015.</p></div>');
    expect(checkBioCredentials(doc).status).toBe('pass');
  });
  it('warns on vague, credential-free bios', () => {
    const doc = parse('<div class="author-bio"><p>Jane is passionate about marketing.</p></div>');
    const r = checkBioCredentials(doc);
    expect(r.status).toBe('warn');
    expect(r.observed_differences).toMatch(/passionate about/);
  });
  it('is not_found with no author/bio block', () => {
    const doc = parse('<main><p>Hello.</p></main>');
    expect(checkBioCredentials(doc).status).toBe('not_found');
  });
});

describe('checkExperienceMarkers', () => {
  it('passes on a case-study marker', () => {
    const doc = parse('<main><p>Read our case study from last month.</p></main>');
    expect(checkExperienceMarkers(doc, 'service').status).toBe('pass');
  });
  it('warns on a service page with no first-hand evidence', () => {
    const doc = parse('<main><p>We sell sheets at good prices.</p></main>');
    expect(checkExperienceMarkers(doc, 'service').status).toBe('warn');
  });
  it('is not_found on generic pages', () => {
    const doc = parse('<main><p>About cookies.</p></main>');
    expect(checkExperienceMarkers(doc, 'generic').status).toBe('not_found');
  });
});

describe('checkTrustPages', () => {
  const nav = (links: string) => parse(`<nav>${links}</nav>`);

  it('passes required pages when linked', () => {
    const doc = nav(
      '<a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a>',
    );
    const rs = checkTrustPages(doc, 'generic');
    expect(byId(rs, 'trust-page.about')?.status).toBe('pass');
    expect(byId(rs, 'trust-page.contact')?.status).toBe('pass');
    expect(byId(rs, 'trust-page.privacy')?.status).toBe('pass');
  });

  it('fails a missing privacy link and warns a missing terms link', () => {
    const doc = nav('<a href="/about/">About</a><a href="/contact/">Contact</a>');
    const rs = checkTrustPages(doc, 'generic');
    expect(byId(rs, 'trust-page.privacy')?.status).toBe('fail');
    expect(byId(rs, 'trust-page.terms')?.status).toBe('warn');
  });

  it('requires a returns link on product pages', () => {
    const withReturns = nav(
      '<a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a><a href="/returns/">Returns</a>',
    );
    expect(byId(checkTrustPages(withReturns, 'product'), 'trust-page.returns')?.status).toBe('pass');
    const noReturns = nav('<a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a>');
    expect(byId(checkTrustPages(noReturns, 'product'), 'trust-page.returns')?.status).toBe('fail');
  });
});

describe('checkBusinessTrust', () => {
  it('passes phone, address and registration when all visible (HU)', () => {
    const doc = parse(
      '<footer><address>9021 Győr, Fő tér 1.</address><a href="tel:+3696123456">call</a><p>Cégjegyzékszám: 01-09-264581</p></footer>',
    );
    const rs = checkBusinessTrust(doc, 'hu');
    expect(byId(rs, 'business.phone')?.status).toBe('pass');
    expect(byId(rs, 'business.address')?.status).toBe('pass');
    expect(byId(rs, 'business.registration')?.status).toBe('pass');
  });

  it('does not pass the HU address on a bare 4-digit number (e.g. a year)', () => {
    const doc = parse('<main><p>2008 óta, 3290 Ft/m²-től szállítunk.</p></main>');
    expect(byId(checkBusinessTrust(doc, 'hu'), 'business.address')?.status).toBe('warn');
    const withTown = parse('<footer><p>Példa Kft., 6720 Szeged, Kárász u. 5.</p></footer>');
    expect(byId(checkBusinessTrust(withTown, 'hu'), 'business.address')?.status).toBe('pass');
  });

  it('warns when trust basics are absent', () => {
    const doc = parse('<main><p>Welcome.</p></main>');
    const rs = checkBusinessTrust(doc, 'hu');
    expect(byId(rs, 'business.phone')?.status).toBe('warn');
    expect(byId(rs, 'business.registration')?.status).toBe('warn');
  });
});

describe('checkAnswerFirst', () => {
  it('passes a concise opening with numeric facts', () => {
    const doc = parse('<main><p>We remove waste across Bristol from £90, same-day in most BS postcodes.</p></main>');
    expect(checkAnswerFirst(doc).status).toBe('pass');
  });
  it('warns when the opening is bloated or fact-free', () => {
    const long = 'word '.repeat(120);
    const doc = parse(`<main><p>${long}</p></main>`);
    expect(checkAnswerFirst(doc).status).toBe('warn');
  });
});

describe('checkHuImpresszum (Ekertv. 4. §)', () => {
  const full =
    '<h1>Impresszum</h1><p>Példa Kft. Székhely: 9021 Győr, Fő tér 1. E-mail: <a href="mailto:info@pelda.hu">info@pelda.hu</a>. ' +
    'Cégjegyzékszám: 01-09-264581, nyilvántartja a Fővárosi Törvényszék Cégbírósága. Adószám: 12180439-2-41. ' +
    'Tárhelyszolgáltató: Tárhely Kft., 1132 Budapest, Váci út 1., info@tarhely.hu</p>';

  it('passes an impresszum page with every checkable field', () => {
    expect(checkHuImpresszum(parse(full), '/impresszum/').status).toBe('pass');
  });

  it('fails an impresszum page that misses the adószám and hosting provider', () => {
    const doc = parse(
      '<h1>Impresszum</h1><p>Példa Kft., 9021 Győr, Fő tér 1. info@pelda.hu. Cégjegyzékszám: 01-09-264581 (Cégbíróság).</p>',
    );
    const r = checkHuImpresszum(doc, '/impresszum/');
    expect(r.status).toBe('fail');
    expect(r.observed_differences).toMatch(/adószám/);
    expect(r.observed_differences).toMatch(/tárhely/);
  });

  it('detects the impresszum page from its H1 when the URL is unknown', () => {
    expect(checkHuImpresszum(parse('<h1>Impresszum</h1><p>Példa Kft.</p>')).status).toBe('fail');
  });

  it('passes an ordinary page that links to the impresszum', () => {
    expect(checkHuImpresszum(parse('<footer><a href="/impresszum/">Impresszum</a></footer>'), '/').status).toBe('pass');
  });

  it('warns on an ordinary page with no impresszum link', () => {
    const r = checkHuImpresszum(parse('<footer><a href="/kapcsolat/">Kapcsolat</a></footer>'), '/');
    expect(r.status).toBe('warn');
    expect(r.id).toBe('business.impresszum');
  });

  it('is only run for the HU market', () => {
    const page = '<main><p>Hello</p></main>';
    expect(auditPage({ html: page, market: 'uk' }).some((r) => r.id.startsWith('business.impresszum'))).toBe(false);
    expect(auditPage({ html: page, market: 'hu' }).some((r) => r.id === 'business.impresszum')).toBe(true);
  });
});

describe('checkExperienceVerified', () => {
  it('passes a page with no unverified markers', () => {
    expect(checkExperienceVerified(parse('<main><p>Esettanulmány: 240 m², Győr, 2023.</p></main>')).status).toBe('pass');
  });
  it('fails when a block is flagged data-experience-verified="false"', () => {
    const doc = parse('<section data-experience-verified="false"><p>Case study: 3 days, £1,200.</p></section>');
    expect(checkExperienceVerified(doc).status).toBe('fail');
  });
  it('fails when placeholder text is left in', () => {
    const doc = parse('<section><p>[PLACEHOLDER - NEEDS REAL DATA] Route: [From → To]</p></section>');
    expect(checkExperienceVerified(doc).status).toBe('fail');
  });
});
