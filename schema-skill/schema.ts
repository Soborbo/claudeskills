/**
 * schema.ts — JSON-LD generators derived from siteConfig
 *
 * Every function imports the same config. No hardcoded business data.
 * Follows schema-audit SKILL.md entity architecture:
 * - One entity, one @id
 * - Full URLs + hash fragments (never bare #fragments)
 * - @graph wrapper for multi-entity pages
 * - Homepage declares full business entity, all other pages reference via @id
 */

import type { SiteConfig } from './siteConfig';

// ── HELPERS ─────────────────────────────────────

/**
 * Build full @id URL from path + fragment.
 * Handles trailing slash on config.url and root path
 * so we never get double slashes.
 */
function id(config: SiteConfig, path: string, fragment: string): string {
  const base = config.url.replace(/\/$/, '');
  const cleanPath = path === '/' ? '' : path;
  return `${base}${cleanPath}#${fragment}`;
}

/** Full URL from path — uses canonicalBase if set, otherwise url */
function fullUrl(config: SiteConfig, path: string): string {
  const base = (config.seo?.canonicalBase || config.url).replace(/\/$/, '');
  return `${base}${path}`;
}

/** Build sameAs array from social links + googleMapsCid + Companies House */
function buildSameAs(config: SiteConfig): string[] {
  const urls: string[] = [];

  // Google Maps CID first (highest priority for UK local)
  if (config.googleMapsCid) urls.push(config.googleMapsCid);

  // Social profiles
  const s = config.social;
  if (s.facebook)  urls.push(s.facebook);
  if (s.linkedin)  urls.push(s.linkedin);
  if (s.youtube)   urls.push(s.youtube);
  if (s.instagram) urls.push(s.instagram);
  if (s.tiktok)    urls.push(s.tiktok);

  // Trustpilot from reviews
  const trustpilot = config.reviews.find(r => r.platform === 'Trustpilot');
  if (trustpilot) urls.push(trustpilot.url);

  // Companies House
  if (config.legal.companyNumber) {
    urls.push(
      `https://find-and-update.company-information.service.gov.uk/company/${config.legal.companyNumber}`,
    );
  }

  // Yell from reviews
  const yell = config.reviews.find(r => r.platform === 'Yell');
  if (yell) urls.push(yell.url);

  return urls;
}

/** Aggregate rating — weighted average across all review platforms */
function buildAggregateRating(config: SiteConfig) {
  const totalCount = config.reviews.reduce((sum, r) => sum + r.count, 0);
  if (totalCount === 0) return undefined;
  const weightedSum = config.reviews.reduce((sum, r) => sum + r.rating * r.count, 0);
  const avgRating = Math.round((weightedSum / totalCount) * 10) / 10;

  return {
    '@type': 'AggregateRating',
    ratingValue: avgRating.toString(),
    reviewCount: totalCount.toString(),
    bestRating: '5',
    worstRating: '1',
  };
}

/** PostalAddress */
function buildAddress(config: SiteConfig) {
  return {
    '@type': 'PostalAddress',
    streetAddress: config.address.street,
    addressLocality: config.address.city,
    addressRegion: config.address.region,
    postalCode: config.address.postcode,
    addressCountry: config.address.country,
  };
}

/** GeoCoordinates if available */
function buildGeo(config: SiteConfig) {
  if (!config.address.geo) return undefined;
  return {
    '@type': 'GeoCoordinates',
    latitude: config.address.geo.lat,
    longitude: config.address.geo.lng,
  };
}

/** OpeningHoursSpecification — full day names as required */
function buildHours(config: SiteConfig) {
  return config.hours.map(h => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: h.days,
    opens: h.opens,
    closes: h.closes,
  }));
}

/** Logo as ImageObject */
function buildLogo(config: SiteConfig) {
  return {
    '@type': 'ImageObject',
    url: fullUrl(config, config.assets.logo),
  };
}

/** OG image as ImageObject with dimensions */
function buildImage(config: SiteConfig) {
  return {
    '@type': 'ImageObject',
    url: fullUrl(config, config.assets.ogImage),
    width: config.assets.ogWidth,
    height: config.assets.ogHeight,
  };
}

/** knowsAbout derived from services — no manual config needed */
function buildKnowsAbout(config: SiteConfig): string[] {
  return config.services.map(s => s.serviceType || s.name);
}

/** Map country code to country name for schema.org */
const COUNTRY_NAMES: Record<string, string> = {
  GB: 'United Kingdom', US: 'United States', HU: 'Hungary',
  DE: 'Germany', FR: 'France', IE: 'Ireland', AU: 'Australia',
  CA: 'Canada', NZ: 'New Zealand', NL: 'Netherlands',
};

/**
 * areaServed for homepage: featured cities + country only.
 * Area pages handle local specificity.
 */
function buildAreaServed(config: SiteConfig) {
  const areas: object[] = [];

  config.areas
    .filter(a => a.featured)
    .forEach(a => {
      areas.push({
        '@type': 'City',
        name: a.county ? `${a.name}, ${a.county}` : a.name,
      });
    });

  const countryCode = config.address.country;
  const countryName = COUNTRY_NAMES[countryCode] || countryCode;
  areas.push({ '@type': 'Country', name: countryName });

  // GeoCircle from serviceArea config (radius-based coverage)
  if (config.serviceArea && config.address.geo) {
    const unitMap = { mi: 'https://schema.org/Mile', km: 'https://schema.org/Kilometer' };
    areas.push({
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: config.address.geo.lat,
        longitude: config.address.geo.lng,
      },
      geoRadius: {
        '@type': 'Distance',
        value: config.serviceArea.radius.toString(),
        unitCode: unitMap[config.serviceArea.unit] || unitMap.mi,
      },
    });
  }

  return areas;
}

/** hasOfferCatalog — links to service @ids with name */
function buildOfferCatalog(config: SiteConfig) {
  return {
    '@type': 'OfferCatalog',
    name: 'Services',
    itemListElement: config.services.map(s => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        '@id': id(config, `/${s.slug}/`, 'service'),
        name: s.name,
      },
    })),
  };
}

// ── MAIN SCHEMA GENERATORS ──────────────────────

/**
 * Homepage — full LocalBusiness + WebSite
 * ONLY place the full business entity is declared.
 */
export function homepageSchema(config: SiteConfig) {
  const businessId = id(config, '/', 'business');
  const websiteId = id(config, '/', 'website');
  const geo = buildGeo(config);
  const aggregateRating = buildAggregateRating(config);
  const featuredPerson = config.people.find(p => p.featured);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': config.schemaType,
        '@id': businessId,
        name: config.name,
        legalName: config.legalName,
        description: config.description,
        slogan: config.tagline,
        url: config.url,
        telephone: config.contact.phone,
        email: config.contact.email,
        foundingDate: config.foundedYear.toString(),
        currenciesAccepted: config.currency,
        paymentAccepted: config.paymentAccepted,
        priceRange: config.priceRange,
        address: buildAddress(config),
        ...(geo && { geo }),
        ...(config.googleMapsCid && { hasMap: config.googleMapsCid }),
        logo: buildLogo(config),
        image: buildImage(config),
        ...(config.assets.heroImage && {
          photo: { '@type': 'ImageObject', url: fullUrl(config, config.assets.heroImage) },
        }),
        openingHoursSpecification: buildHours(config),
        ...(aggregateRating && { aggregateRating }),
        sameAs: buildSameAs(config),
        areaServed: buildAreaServed(config),
        hasOfferCatalog: buildOfferCatalog(config),
        knowsAbout: buildKnowsAbout(config),
        knowsLanguage: [config.locale.split('-')[0]],
        ...(config.contact.bookingUrl && {
          potentialAction: {
            '@type': 'ReserveAction',
            target: config.contact.bookingUrl,
            name: 'Book Online',
          },
        }),
        ...(featuredPerson && {
          founder: { '@id': id(config, `/about/${featuredPerson.slug}/`, 'person') },
        }),
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: config.name,
        url: config.url,
        publisher: { '@id': businessId },
      },
    ],
  };
}

/**
 * Person — for about/team pages
 * Declares full Person entity with @id.
 * knowsAbout derived from services, not manual input.
 */
export function personSchema(config: SiteConfig, personSlug: string) {
  const person = config.people.find(p => p.slug === personSlug);
  if (!person) throw new Error(`Person "${personSlug}" not found in config`);

  const personId = id(config, `/about/${person.slug}/`, 'person');
  const businessId = id(config, '/', 'business');
  const websiteId = id(config, '/', 'website');
  const profilePageId = id(config, `/about/${person.slug}/`, 'webpage');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': profilePageId,
        url: fullUrl(config, `/about/${person.slug}/`),
        mainEntity: { '@id': personId },
        isPartOf: { '@id': websiteId },
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: person.name,
        ...(person.jobTitle && { jobTitle: person.jobTitle }),
        ...(person.bio && { description: person.bio }),
        ...(person.image && {
          image: { '@type': 'ImageObject', url: fullUrl(config, person.image) },
        }),
        worksFor: { '@id': businessId },
        ...(person.jobTitle && {
          hasOccupation: {
            '@type': 'Occupation',
            name: person.jobTitle,
            ...(person.role && { description: person.role }),
          },
        }),
        knowsAbout: buildKnowsAbout(config),
        ...(person.sameAs.length > 0 && { sameAs: person.sameAs }),
      },
    ],
  };
}

/**
 * Service page — declares Service with @id
 */
export function serviceSchema(config: SiteConfig, serviceSlug: string) {
  const service = config.services.find(s => s.slug === serviceSlug);
  if (!service) throw new Error(`Service "${serviceSlug}" not found in config`);

  const serviceId = id(config, `/${service.slug}/`, 'service');
  const businessId = id(config, '/', 'business');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': serviceId,
        name: service.name,
        ...(service.serviceType && { serviceType: service.serviceType }),
        description: service.shortDescription,
        url: fullUrl(config, `/${service.slug}/`),
        provider: { '@id': businessId },
        areaServed: { '@type': 'Country', name: COUNTRY_NAMES[config.address.country] || config.address.country },
      },
      breadcrumbSchema(config, [
        { name: 'Home', path: '/' },
        { name: service.name, path: `/${service.slug}/` },
      ]),
    ],
  };
}

/**
 * Area service page — Service with specific areaServed
 * Gets @id from its URL for entity graph strength.
 */
export function areaServiceSchema(
  config: SiteConfig,
  serviceSlug: string,
  areaSlug: string,
) {
  const service = config.services.find(s => s.slug === serviceSlug);
  const area = config.areas.find(a => a.slug === areaSlug);
  if (!service) throw new Error(`Service "${serviceSlug}" not found in config`);
  if (!area) throw new Error(`Area "${areaSlug}" not found in config`);

  const areaServiceId = id(config, `/${service.slug}/${area.slug}/`, 'service');
  const businessId = id(config, '/', 'business');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': areaServiceId,
        name: `${service.name} in ${area.name}`,
        ...(service.serviceType && { serviceType: service.serviceType }),
        description: service.shortDescription,
        url: fullUrl(config, `/${service.slug}/${area.slug}/`),
        provider: { '@id': businessId },
        areaServed: {
          '@type': 'Place',
          name: area.county ? `${area.name}, ${area.county}` : area.name,
          ...(area.county && {
            containedInPlace: { '@type': 'AdministrativeArea', name: area.county },
          }),
        },
      },
      breadcrumbSchema(config, [
        { name: 'Home', path: '/' },
        { name: service.name, path: `/${service.slug}/` },
        { name: area.name, path: `/${service.slug}/${area.slug}/` },
      ]),
    ],
  };
}

/**
 * About page — AboutPage with mainEntity → business
 */
export function aboutPageSchema(config: SiteConfig) {
  const businessId = id(config, '/', 'business');
  const websiteId = id(config, '/', 'website');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': id(config, '/about/', 'webpage'),
        url: fullUrl(config, '/about/'),
        mainEntity: { '@id': businessId },
        isPartOf: { '@id': websiteId },
      },
      breadcrumbSchema(config, [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about/' },
      ]),
    ],
  };
}

/**
 * Contact page — ContactPage with mainEntity → business
 */
export function contactPageSchema(config: SiteConfig) {
  const businessId = id(config, '/', 'business');
  const websiteId = id(config, '/', 'website');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        '@id': id(config, '/contact/', 'webpage'),
        url: fullUrl(config, '/contact/'),
        mainEntity: { '@id': businessId },
        isPartOf: { '@id': websiteId },
      },
      breadcrumbSchema(config, [
        { name: 'Home', path: '/' },
        { name: 'Contact', path: '/contact/' },
      ]),
    ],
  };
}

/**
 * Collection page — for service hub / area hub pages
 * Lists services or areas as an ItemList.
 */
export function collectionPageSchema(
  config: SiteConfig,
  page: {
    name: string;
    path: string;
    items: Array<{ name: string; url: string }>;
  },
) {
  const websiteId = id(config, '/', 'website');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': id(config, page.path, 'webpage'),
        name: page.name,
        url: fullUrl(config, page.path),
        isPartOf: { '@id': websiteId },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: page.items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            url: fullUrl(config, item.url),
          })),
        },
      },
      breadcrumbSchema(config, [
        { name: 'Home', path: '/' },
        { name: page.name, path: page.path },
      ]),
    ],
  };
}

/**
 * FAQ — only use if FAQ is visible on page.
 * Questions and answers MUST match visible content word-for-word.
 * No rich results since Jan 2026 but significantly increases AI search visibility.
 */
export function faqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * BreadcrumbList — reusable, pass array of {name, path} crumbs
 */
export function breadcrumbSchema(
  config: SiteConfig,
  items: Array<{ name: string; path: string }>,
) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: fullUrl(config, item.path),
    })),
  };
}

/**
 * Article / BlogPosting — configurable type
 * author → Person @id, publisher → business @id
 */
export function articleSchema(
  config: SiteConfig,
  article: {
    headline: string;
    slug: string;
    datePublished: string;
    dateModified: string;
    authorSlug: string;
    description?: string;
    image?: string;
    type?: 'Article' | 'BlogPosting' | 'NewsArticle';
  },
) {
  const person = config.people.find(p => p.slug === article.authorSlug);
  if (!person) throw new Error(`Author "${article.authorSlug}" not found in config`);

  const businessId = id(config, '/', 'business');
  const websiteId = id(config, '/', 'website');
  const personId = id(config, `/about/${person.slug}/`, 'person');
  const articleType = article.type || 'Article';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': articleType,
        headline: article.headline,
        url: fullUrl(config, `/blog/${article.slug}/`),
        datePublished: article.datePublished,
        dateModified: article.dateModified,
        ...(article.description && { description: article.description }),
        ...(article.image && {
          image: { '@type': 'ImageObject', url: fullUrl(config, article.image) },
        }),
        author: { '@id': personId },
        publisher: { '@id': businessId },
        isPartOf: { '@id': websiteId },
      },
      breadcrumbSchema(config, [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog/' },
        { name: article.headline, path: `/blog/${article.slug}/` },
      ]),
    ],
  };
}

/**
 * VideoObject — for pages with embedded video.
 * Can trigger video carousels in SERP — high value.
 * Add to @graph alongside the page's main schema.
 *
 * Scope: ONLY on watch/embed pages (the page that actually hosts the video).
 * Do NOT emit VideoObject on listing/hub pages that merely link to video pages —
 * Google flags these as "video content not present" and drops eligibility.
 *
 * uploadDate MUST be ISO 8601 with timezone, e.g. "2025-04-15T09:00:00+00:00".
 * Date-only "YYYY-MM-DD" is rejected by Google's stricter validator.
 */
export function videoSchema(
  config: SiteConfig,
  video: {
    name: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string; // ISO 8601 with timezone: "2025-04-15T09:00:00+00:00"
    contentUrl?: string;
    embedUrl?: string;
    duration?: string; // ISO 8601: "PT5M30S"
  },
) {
  const businessId = id(config, '/', 'business');

  return {
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl.startsWith('http')
      ? video.thumbnailUrl
      : fullUrl(config, video.thumbnailUrl),
    uploadDate: video.uploadDate,
    ...(video.contentUrl && { contentUrl: video.contentUrl }),
    ...(video.embedUrl && { embedUrl: video.embedUrl }),
    ...(video.duration && { duration: video.duration }),
    publisher: { '@id': businessId },
  };
}

/**
 * Calculator / Tool page — WebApplication
 */
export function calculatorSchema(
  config: SiteConfig,
  tool: { name: string; slug: string; description: string },
) {
  const businessId = id(config, '/', 'business');
  const websiteId = id(config, '/', 'website');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': id(config, `/${tool.slug}/`, 'webapp'),
        name: tool.name,
        url: fullUrl(config, `/${tool.slug}/`),
        description: tool.description,
        provider: { '@id': businessId },
        isPartOf: { '@id': websiteId },
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: config.currency,
        },
      },
      breadcrumbSchema(config, [
        { name: 'Home', path: '/' },
        { name: tool.name, path: `/${tool.slug}/` },
      ]),
    ],
  };
}
