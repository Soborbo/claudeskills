/**
 * Page-level E-E-A-T signal checks.
 *
 * SCOPE BOUNDARY: this module audits the *human-visible* and *crawler-visible*
 * signals on the rendered page. It deliberately does NOT validate JSON-LD
 * wiring and does NOT generate schema (both are the `schema` skill). Where a signal also has a schema expression, this
 * module checks the visible side and leaves the markup to those skills.
 */
import type { CheckResult, PageKind, Market } from './types';
import { bodyText, detectKind, hasSpecificity, parse, text } from './dom';
import {
  detectAccreditations,
  findRegistration,
  hasHuPostalAddress,
  HU_ADOSZAM_RE,
  HU_CEGJEGYZEKSZAM_RE,
  isValidHuAdoszam,
  isValidHuCegjegyzekszam,
} from './markets';

/** Vague phrases that, inside an author/about block, signal a CLAIM of
 * experience rather than a demonstration of it. Copy *voice* is humanize-copy's
 * job; this list is intentionally tiny and credibility-specific. */
const FLUFF = [
  'passionate about',
  'leading provider',
  'world-class',
  'second to none',
  'we pride ourselves',
  'one-stop shop',
  'industry-leading',
  'piacvezető',
  'szenvedély',
  'elkötelezett szakértő',
  'verhetetlen',
];

const AUTHOR_SELECTORS = [
  '[rel~="author"]',
  '[itemprop="author"]',
  'address.author',
  '.author',
  '.byline',
  '[class*="author"]',
].join(',');

function authorEl(doc: Document): Element | null {
  const el = doc.querySelector(AUTHOR_SELECTORS);
  if (el) return el;
  // Fallback: a "By NAME" byline near the top of an article.
  const article = doc.querySelector('article, main') ?? doc.body;
  const head = text(article).slice(0, 240);
  return /\bby\s+[A-Z][a-z]+\s+[A-Z][a-z]+/.test(head) ? article : null;
}

export function checkAuthor(doc: Document, kind: PageKind): CheckResult {
  const el = authorEl(doc);
  if (!el) {
    if (kind === 'article')
      return {
        id: 'author.visible-byline',
        signal: 'Visible author byline on article',
        status: 'fail',
        observed_differences:
          'Article page has no visible author byline. Add a named author (links to a profile/author page).',
      };
    return { id: 'author.visible-byline', signal: 'Visible author byline', status: 'not_found' };
  }
  return { id: 'author.visible-byline', signal: 'Visible author byline', status: 'pass' };
}

export function checkBioCredentials(doc: Document): CheckResult {
  const bio =
    doc.querySelector('.author-bio, .bio, [itemprop="author"] [itemprop="description"]') ??
    doc.querySelector('[class*="author"]');
  if (!bio)
    return { id: 'author.bio-credentials', signal: 'Author bio with specific credentials', status: 'not_found' };
  const t = text(bio);
  const fluff = FLUFF.find((p) => t.toLowerCase().includes(p));
  if (!hasSpecificity(t)) {
    return {
      id: 'author.bio-credentials',
      signal: 'Author bio with specific credentials',
      status: 'warn',
      observed_differences: fluff
        ? `Bio uses vague phrasing ("${fluff}") and no concrete credential (years, dates, certifications, numbers).`
        : 'Bio present but contains no concrete credential (years in trade, dates, certifications, named results).',
    };
  }
  if (fluff)
    return {
      id: 'author.bio-credentials',
      signal: 'Author bio with specific credentials',
      status: 'warn',
      observed_differences: `Bio has credentials but also vague filler ("${fluff}") — tighten to specifics.`,
    };
  return { id: 'author.bio-credentials', signal: 'Author bio with specific credentials', status: 'pass' };
}

export function checkExperienceMarkers(doc: Document, kind: PageKind): CheckResult {
  const t = bodyText(doc);
  const strong =
    /\bcase stud(y|ies)\b|\bbefore (and|&|\/) ?after\b|esettanulm[áa]ny|el[őo]tte ?[-/–] ?ut[áa]na/.test(t);
  const firstPerson =
    /\b(we (installed|removed|fitted|built|delivered|completed))\b|(beszereltük|elvégeztük|kiszállítottuk|telepítettük)/.test(
      t,
    );
  const captioned = doc.querySelector('figure figcaption') !== null;
  if (strong || (firstPerson && captioned))
    return { id: 'experience.first-hand', signal: 'First-hand experience evidence', status: 'pass' };
  if (kind === 'service' || kind === 'product')
    return {
      id: 'experience.first-hand',
      signal: 'First-hand experience evidence',
      status: 'warn',
      observed_differences:
        'No first-hand evidence found (case study, before/after, captioned own photos, or first-person job description). This is the asymmetric signal a real operator can show and a large competitor cannot fake.',
    };
  return { id: 'experience.first-hand', signal: 'First-hand experience evidence', status: 'not_found' };
}

const TRUST_PAGES: Record<string, { re: RegExp; required: boolean }> = {
  about: { re: /about|r[óo]lunk|bemutatkoz/i, required: true },
  contact: { re: /contact|kapcsolat/i, required: true },
  privacy: { re: /privacy|adatkezel|adatv[ée]del/i, required: true },
  terms: { re: /terms|aszf|szerz[őo]d[ée]si|felt[ée]telek/i, required: false },
};

export function checkTrustPages(doc: Document, kind: PageKind): CheckResult[] {
  const anchors = [...doc.querySelectorAll('a[href]')].map((a) => {
    const href = a.getAttribute('href') ?? '';
    return `${href} ${text(a)}`.toLowerCase();
  });
  const present = (re: RegExp) => anchors.some((a) => re.test(a));
  const out: CheckResult[] = [];
  for (const [name, { re, required }] of Object.entries(TRUST_PAGES)) {
    const ok = present(re);
    out.push({
      id: `trust-page.${name}`,
      signal: `Link to ${name} page`,
      status: ok ? 'pass' : required ? 'fail' : 'warn',
      ...(ok ? {} : { observed_differences: `No link matching the ${name} page was found in the page's links.` }),
    });
  }
  if (kind === 'product') {
    const ok = present(/returns|refund|el[áa]ll[áa]s|visszak[üu]ld|sz[áa]ll[íi]t[áa]s/i);
    out.push({
      id: 'trust-page.returns',
      signal: 'Link to returns/refund/shipping policy (product)',
      status: ok ? 'pass' : 'fail',
      ...(ok ? {} : { observed_differences: 'Product context but no returns/refund/shipping policy link found.' }),
    });
  }
  return out;
}

export function checkBusinessTrust(doc: Document, market: Market): CheckResult[] {
  const out: CheckResult[] = [];
  const raw = text(doc);

  const phone = doc.querySelector('a[href^="tel:"]') !== null || /\+?\d[\d ()-]{7,}\d/.test(raw);
  out.push({
    id: 'business.phone',
    signal: 'Visible phone number',
    status: phone ? 'pass' : 'warn',
    ...(phone ? {} : { observed_differences: 'No visible telephone number or tel: link found.' }),
  });

  const ukPc = /\b[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}\b/i;
  const address =
    doc.querySelector('address') !== null ||
    doc.querySelector('[itemtype*="PostalAddress"]') !== null ||
    (market === 'uk'
      ? ukPc.test(raw)
      : market === 'hu'
        ? hasHuPostalAddress(raw)
        : ukPc.test(raw) || hasHuPostalAddress(raw));
  out.push({
    id: 'business.address',
    signal: 'Visible postal address',
    status: address ? 'pass' : 'warn',
    ...(address ? {} : { observed_differences: 'No <address>, PostalAddress, or postcode + town pattern found on the page.' }),
  });

  if (market === 'uk' || market === 'hu') {
    const reg = findRegistration(raw, market);
    out.push({
      id: 'business.registration',
      signal: market === 'uk' ? 'Visible company number' : 'Visible cégjegyzékszám / adószám',
      status: reg ? 'pass' : 'warn',
      ...(reg
        ? {}
        : {
            observed_differences:
              market === 'uk'
                ? 'No valid Companies House number found near a "Company No / Registered in…" label.'
                : 'No valid cégjegyzékszám or adószám found in the page text.',
          }),
    });
  }

  const accreditations = detectAccreditations(bodyText(doc), market);
  out.push({
    id: 'business.accreditations',
    signal: 'Recognised accreditations / trust marks',
    status: accreditations.length ? 'pass' : 'not_found',
    ...(accreditations.length ? {} : { observed_differences: 'No recognised market trust marks detected (informational).' }),
  });
  return out;
}

export function checkAnswerFirst(doc: Document): CheckResult {
  const main = doc.querySelector('main, article') ?? doc.body;
  const firstP = main.querySelector('p');
  const t = firstP ? text(firstP) : '';
  const len = t.length;
  const concise = len >= 40 && len <= 360;
  const hasNumber = /\d/.test(text(main));
  if (concise && hasNumber)
    return { id: 'geo.answer-first', signal: 'Answer-first opening + fact density (GEO)', status: 'pass' };
  return {
    id: 'geo.answer-first',
    signal: 'Answer-first opening + fact density (GEO)',
    status: 'warn',
    observed_differences: !firstP
      ? 'No leading paragraph found in <main>/<article> to carry a direct answer.'
      : !concise
        ? `Opening paragraph is ${len} chars; a direct answer of ~40–360 chars is easier for AI engines to lift.`
        : 'No numeric facts found in the main content; specific numbers/dates raise AI-citation likelihood.',
  };
}

/* ---------------------------------------------------- HU impresszum --- */

const IMPRESSZUM_LINK_RE = /impresszum|imprint|jogi[- ]nyilatkozat|c[ée]gadatok/i;
const IMPRESSZUM_PAGE_RE = /\/(impresszum|imprint|jogi-nyilatkozat|cegadatok)\b/i;

function isImpresszumPage(doc: Document, url: string): boolean {
  if (IMPRESSZUM_PAGE_RE.test(url)) return true;
  const h = doc.querySelector('h1');
  return h !== null && /impresszum|imprint/i.test(text(h));
}

/**
 * Ekertv. (2001. évi CVIII. tv.) 4. § — the fields a Hungarian online service
 * must publish "directly and continuously". Name (a), licence (e) and chamber
 * data (g) cannot be judged mechanically, so they stay on the human checklist
 * in references/market-hu.md; everything below is a deterministic signal.
 */
export function impresszumFields(raw: string, doc: Document): { field: string; ok: boolean }[] {
  const reg = HU_CEGJEGYZEKSZAM_RE.exec(raw);
  const ado = HU_ADOSZAM_RE.exec(raw);
  return [
    { field: 'székhely / cím (b)', ok: hasHuPostalAddress(raw) || doc.querySelector('address') !== null },
    {
      field: 'e-mail cím (c)',
      ok: doc.querySelector('a[href^="mailto:"]') !== null || /[\w.+-]+@[\w-]+\.[\w.-]+/.test(raw),
    },
    {
      field: 'nyilvántartási szám (d)',
      ok:
        (reg !== null && isValidHuCegjegyzekszam(reg[0])) ||
        /nyilv[áa]ntart[áa]si sz[áa]m\s*:?\s*\d{6,}/i.test(raw),
    },
    { field: 'nyilvántartó bíróság / hatóság (d)', ok: /c[ée]gb[íi]r[óo]s[áa]g|t[öo]rv[ée]nysz[ée]k|hat[óo]s[áa]g|nyilv[áa]ntart[óo]/i.test(raw) },
    { field: 'adószám (f)', ok: ado !== null && isValidHuAdoszam(ado[0]) },
    { field: 'tárhelyszolgáltató adatai (h)', ok: /t[áa]rhely/i.test(raw) },
  ];
}

/**
 * HU only. On an impresszum page: every mechanically checkable Ekertv. 4. §
 * field must be present (`fail` otherwise — it is a legal duty, not a nicety).
 * On any other page: a link to the impresszum (or the fields inline) → `pass`,
 * missing → `warn` (one page in the build is enough; the site audit shows which).
 */
export function checkHuImpresszum(doc: Document, url = ''): CheckResult {
  const raw = text(doc);
  if (isImpresszumPage(doc, url)) {
    const missing = impresszumFields(raw, doc)
      .filter((f) => !f.ok)
      .map((f) => f.field);
    if (missing.length === 0)
      return { id: 'business.impresszum-fields', signal: 'Ekertv. 4. § impresszum fields', status: 'pass' };
    return {
      id: 'business.impresszum-fields',
      signal: 'Ekertv. 4. § impresszum fields',
      status: 'fail',
      observed_differences: `Impresszum page is missing: ${missing.join(', ')}. Ekertv. 4. § requires these to be published directly and continuously.`,
    };
  }
  const linked = [...doc.querySelectorAll('a[href]')].some((a) =>
    IMPRESSZUM_LINK_RE.test(`${a.getAttribute('href') ?? ''} ${text(a)}`),
  );
  const inline = impresszumFields(raw, doc).every((f) => f.ok);
  if (linked || inline) return { id: 'business.impresszum', signal: 'Impresszum reachable (Ekertv. 4. §)', status: 'pass' };
  return {
    id: 'business.impresszum',
    signal: 'Impresszum reachable (Ekertv. 4. §)',
    status: 'warn',
    observed_differences:
      'No link to an impresszum / cégadatok page and the Ekertv. 4. § fields are not shown inline. Put an Impresszum link in the footer.',
  };
}

/* ------------------------------------------- unverified experience data --- */

const PLACEHOLDER_RE = /\[(?:placeholder|insert:?|todo)[^\]]*\]|needs real data|valós adat kell/i;

/**
 * First-hand evidence must be real. A template either renders
 * `data-experience-verified="false"` (from an `experienceVerified: false`
 * frontmatter flag) or leaves a bracketed placeholder; both mean a human has
 * not confirmed the numbers/case yet, so the page must not ship → `fail`.
 */
export function checkExperienceVerified(doc: Document): CheckResult {
  const flagged = doc.querySelector('[data-experience-verified="false"]') !== null;
  const m = PLACEHOLDER_RE.exec(text(doc));
  if (!flagged && !m)
    return { id: 'experience.verified', signal: 'No unverified experience data', status: 'pass' };
  return {
    id: 'experience.verified',
    signal: 'No unverified experience data',
    status: 'fail',
    observed_differences: flagged
      ? 'An element is marked data-experience-verified="false": a human has not confirmed this case/data yet. Verify it or remove it before publishing.'
      : `Placeholder text left in the page ("${m?.[0]}"). Replace it with real, verifiable data or remove the block.`,
  };
}

/** Run every page-level check and return a flat result list. */
export function auditPage(input: { html: string; url?: string; market?: Market; kind?: PageKind }): CheckResult[] {
  const doc = parse(input.html);
  const market = input.market ?? 'generic';
  const kind = input.kind ?? detectKind(doc, input.url ?? '');
  return [
    checkAuthor(doc, kind),
    checkBioCredentials(doc),
    checkExperienceMarkers(doc, kind),
    checkExperienceVerified(doc),
    ...checkTrustPages(doc, kind),
    ...checkBusinessTrust(doc, market),
    ...(market === 'hu' ? [checkHuImpresszum(doc, input.url ?? '')] : []),
    checkAnswerFirst(doc),
  ];
}
