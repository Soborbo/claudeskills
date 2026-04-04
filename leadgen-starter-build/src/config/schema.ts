/**
 * schema.ts — JSON-LD generators derived from siteConfig
 *
 * Every function imports the same config. No hardcoded business data.
 * Follows schema-entity-graph skill:
 * - One entity, one @id
 * - Full URLs + hash fragments
 * - @graph wrapper for multi-entity pages
 * - Homepage declares full business entity, all other pages reference via @id
 */

import type { SiteConfig } from './siteConfig';

// ── HELPERS ─────────────────────────────────────

function id(config: SiteConfig, path: string, fragment: string): string {
  const base = config.url.replace(/\/$/, '');
  const cleanPath = path === '/' ? '' : path;
  return `${base}${cleanPath}#${fragment}`;
}

function fullUrl(config: SiteConfig, path: string): string {
  const base = config.url.replace(/\/$/, '');
  return `${base}${path}`;
}

function buildSameAs(config: SiteConfig): string[] {
  const urls: string[] = [];
  if (config.googleMapsCid) urls.push(config.googleMapsCid);
  const s = config.social;
  if (s.facebook) urls.push(s.facebook);
  if (s.linkedin) urls.push(s.linkedin);
  if (s.youtube) urls.push(s.youtube);
  if (s.instagram) urls.push(s.instagram);
  if (s.tiktok) urls.push(s.tiktok);
  const trustpilot = config.reviews.find(r => r.platform === 'Trustpilot');
  if (trustpilot) urls.push(trustpilot.url);
  if (config.legal.companyNumber) {
    urls.push(`https://find-and-update.company-information.service.gov.uk/company/${config.legal.companyNumber}`);
  }
  const yell = config.reviews.find(r => r.platform === 'Yell');
  if (yell) urls.push(yell.url);
  return urls;
}

function buildAggregateRating(config: SiteConfig) {
  const totalCount = config.reviews.reduce((sum, r) => sum + r.count, 0);
  if (totalCount === 0) {
    return { '@type': 'AggregateRating', ratingValue: '0', reviewCount: '0', bestRating: '5', worstRating: '1' };
  }
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

function buildGeo(config: SiteConfig) {
  if (!config.address.geo) return undefined;
  return {
    '@type': 'GeoCoordinates',
    latitude: config.address.geo.lat,
    longitude: config.address.geo.lng,
  };
}

function buildHours(config: SiteConfig) {
  return config.hours.map(h => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: h.days,
    opens: h.opens,
    closes: h.closes,
  }));
}

function buildLogo(config: SiteConfig) {
  return { '@type': 'ImageObject', url: fullUrl(config, config.assets.logo) };
}

function buildImage(config: SiteConfig) {
  return {
    '@type': 'ImageObject',
    url: fullUrl(config, config.assets.ogImage),
    width: config.assets.ogWidth,
    height: config.assets.ogHeight,
  };
}

function buildKnowsAbout(config: SiteConfig): string[] {
  return config.services.map(s => s.serviceType || s.name);
}

function buildAreaServed(config: SiteConfig) {
  const areas: object[] = [];
  config.areas.filter(a => a.featured).forEach(a => {
    areas.push({ '@type': 'City', name: a.county ? `${a.name}, ${a.county}` : a.name });
  });
  areas.push({ '@type': 'Country', name: 'United Kingdom' });
  return areas;
}

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

export function homepageSchema(config: SiteConfig) {
  const businessId = id(config, '/', 'business');
  const websiteId = id(config, '/', 'website');
  const geo = buildGeo(config);
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
        openingHoursSpecification: buildHours(config),
        aggregateRating: buildAggregateRating(config),
        sameAs: buildSameAs(config),
        areaServed: buildAreaServed(config),
        hasOfferCatalog: buildOfferCatalog(config),
        knowsAbout: buildKnowsAbout(config),
        knowsLanguage: [config.locale.split('-')[0]],
        ...(featuredPerson && {
          founder: { '@id': id(config, `/author/${featuredPerson.slug}/`, 'person') },
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

export function personSchema(config: SiteConfig, personSlug: string) {
  const person = config.people.find(p => p.slug === personSlug);
  if (!person) throw new Error(`Person "${personSlug}" not found in config`);

  const personId = id(config, `/author/${person.slug}/`, 'person');
  const businessId = id(config, '/', 'business');
  const websiteId = id(config, '/', 'website');
  const profilePageId = id(config, `/author/${person.slug}/`, 'webpage');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': profilePageId,
        url: fullUrl(config, `/author/${person.slug}/`),
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
          hasOccupation: { '@type': 'Occupation', name: person.jobTitle },
        }),
        knowsAbout: buildKnowsAbout(config),
        ...(person.sameAs.length > 0 && { sameAs: person.sameAs }),
      },
    ],
  };
}

export function serviceSchema(config: SiteConfig, serviceSlug: string) {
  const service = config.services.find(s => s.slug === serviceSlug);
  if (!service) throw new Error(`Service "${serviceSlug}" not found in config`);

  const serviceId = id(config, `/services/${service.slug}/`, 'service');
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
        url: fullUrl(config, `/services/${service.slug}/`),
        provider: { '@id': businessId },
        areaServed: { '@type': 'Country', name: 'United Kingdom' },
      },
      breadcrumbSchema(config, [
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/services/' },
        { name: service.name, path: `/services/${service.slug}/` },
      ]),
    ],
  };
}

export function areaServiceSchema(config: SiteConfig, areaSlug: string) {
  const area = config.areas.find(a => a.slug === areaSlug);
  if (!area) throw new Error(`Area "${areaSlug}" not found in config`);

  const areaId = id(config, `/areas/${area.slug}/`, 'service');
  const businessId = id(config, '/', 'business');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': areaId,
        name: `Removals in ${area.name}`,
        description: `Professional removal services in ${area.name}`,
        url: fullUrl(config, `/areas/${area.slug}/`),
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
        { name: 'Areas', path: '/areas/' },
        { name: area.name, path: `/areas/${area.slug}/` },
      ]),
    ],
  };
}

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

export function collectionPageSchema(
  config: SiteConfig,
  page: { name: string; path: string; items: Array<{ name: string; url: string }> },
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

export function faqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

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
  const personId = id(config, `/author/${person.slug}/`, 'person');
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

export function videoSchema(
  config: SiteConfig,
  video: {
    name: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string;
    contentUrl?: string;
    embedUrl?: string;
    duration?: string;
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
        offers: { '@type': 'Offer', price: '0', priceCurrency: config.currency },
      },
      breadcrumbSchema(config, [
        { name: 'Home', path: '/' },
        { name: tool.name, path: `/${tool.slug}/` },
      ]),
    ],
  };
}
