/**
 * @leadgen/config - Schema.org Generation
 *
 * Generate structured data from site config.
 */

import type { SiteConfig, Address, OpeningHours, Person, Service } from './types';

// =============================================================================
// LocalBusiness Schema
// =============================================================================

/**
 * Generate LocalBusiness schema from config
 */
export function generateLocalBusinessSchema(config: SiteConfig): Record<string, unknown> {
  const { company, contact, openingHours, social, schema: schemaConfig } = config;

  const primaryAddress = contact.addresses.find((a) => a.label === 'primary') || contact.addresses[0];
  const primaryPhone = contact.phones.find((p) => p.primary) || contact.phones[0];
  const primaryEmail = contact.emails.find((e) => e.primary) || contact.emails[0];

  const businessSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaConfig?.type || company.schemaType || 'LocalBusiness',
    name: company.name,
    legalName: company.legalName,
    url: config.url,
  };

  if (company.description) {
    businessSchema.description = company.description;
  }

  if (company.foundedYear) {
    businessSchema.foundingDate = company.foundedYear.toString();
  }

  if (company.taxNumber) {
    businessSchema.taxID = company.taxNumber;
  }

  // Address
  if (primaryAddress) {
    businessSchema.address = {
      '@type': 'PostalAddress',
      streetAddress: primaryAddress.street,
      addressLocality: primaryAddress.city,
      postalCode: primaryAddress.postalCode,
      addressRegion: primaryAddress.region,
      addressCountry: primaryAddress.countryCode,
    };

    if (primaryAddress.latitude && primaryAddress.longitude) {
      businessSchema.geo = {
        '@type': 'GeoCoordinates',
        latitude: primaryAddress.latitude,
        longitude: primaryAddress.longitude,
      };
    }
  }

  // Contact
  if (primaryPhone) {
    businessSchema.telephone = primaryPhone.number;
  }

  if (primaryEmail) {
    businessSchema.email = primaryEmail.email;
  }

  // Logo
  if (config.branding.logo.main) {
    businessSchema.logo = config.branding.logo.main;
  }

  // Opening hours
  if (openingHours && openingHours.length > 0) {
    const specs = openingHours
      .filter((h) => h.schemaDays && h.schemaTime && !h.closed)
      .map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.schemaDays,
        opens: h.schemaTime?.split('-')[0]?.trim(),
        closes: h.schemaTime?.split('-')[1]?.trim(),
      }));

    if (specs.length > 0) {
      businessSchema.openingHoursSpecification = specs;
    }
  }

  // Social profiles
  if (social && social.length > 0) {
    businessSchema.sameAs = social.map((s) => s.url);
  }

  // Schema config extras
  if (schemaConfig) {
    if (schemaConfig.priceRange) {
      businessSchema.priceRange = schemaConfig.priceRange;
    }

    if (schemaConfig.areasServed) {
      businessSchema.areaServed = schemaConfig.areasServed;
    }

    if (schemaConfig.paymentAccepted) {
      businessSchema.paymentAccepted = schemaConfig.paymentAccepted.join(', ');
    }

    if (schemaConfig.currenciesAccepted) {
      businessSchema.currenciesAccepted = schemaConfig.currenciesAccepted.join(', ');
    }

    if (schemaConfig.aggregateRating) {
      businessSchema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: schemaConfig.aggregateRating.ratingValue,
        reviewCount: schemaConfig.aggregateRating.reviewCount,
        bestRating: schemaConfig.aggregateRating.bestRating || 5,
        worstRating: 1,
      };
    }
  }

  return businessSchema;
}

// =============================================================================
// Organization Schema
// =============================================================================

/**
 * Generate Organization schema from config
 */
export function generateOrganizationSchema(config: SiteConfig): Record<string, unknown> {
  const { company, contact, social } = config;

  const primaryPhone = contact.phones.find((p) => p.primary) || contact.phones[0];
  const primaryEmail = contact.emails.find((e) => e.primary) || contact.emails[0];
  const primaryAddress = contact.addresses[0];

  const orgSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    legalName: company.legalName,
    url: config.url,
  };

  if (company.description) {
    orgSchema.description = company.description;
  }

  if (company.foundedYear) {
    orgSchema.foundingDate = company.foundedYear.toString();
  }

  if (config.branding.logo.main) {
    orgSchema.logo = config.branding.logo.main;
  }

  if (primaryPhone) {
    orgSchema.telephone = primaryPhone.number;
  }

  if (primaryEmail) {
    orgSchema.email = primaryEmail.email;
  }

  if (primaryAddress) {
    orgSchema.address = {
      '@type': 'PostalAddress',
      streetAddress: primaryAddress.street,
      addressLocality: primaryAddress.city,
      postalCode: primaryAddress.postalCode,
      addressCountry: primaryAddress.countryCode,
    };
  }

  if (social && social.length > 0) {
    orgSchema.sameAs = social.map((s) => s.url);
  }

  // Founders
  const founders = config.team?.filter((p) => p.isFounder);
  if (founders && founders.length > 0) {
    orgSchema.founder = founders.map((f) => ({
      '@type': 'Person',
      name: f.name,
      jobTitle: f.title,
    }));
  }

  return orgSchema;
}

// =============================================================================
// WebSite Schema
// =============================================================================

/**
 * Generate WebSite schema from config
 */
export function generateWebSiteSchema(config: SiteConfig): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.company.name,
    url: config.url,
    description: config.company.description,
    inLanguage: config.seo.language,
  };
}

// =============================================================================
// Service Schema
// =============================================================================

/**
 * Generate Service schema from config service
 */
export function generateServiceSchema(
  service: Service,
  config: SiteConfig
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    provider: {
      '@type': 'Organization',
      name: config.company.name,
      url: config.url,
    },
  };

  if (service.description) {
    schema.description = service.description;
  }

  if (service.url) {
    schema.url = service.url;
  }

  if (service.image) {
    schema.image = service.image;
  }

  if (service.priceRange || service.priceFrom) {
    schema.offers = {
      '@type': 'Offer',
      ...(service.priceFrom && { price: service.priceFrom }),
      ...(service.priceRange && { priceRange: service.priceRange }),
      priceCurrency: service.currency || 'HUF',
    };
  }

  if (config.schema?.areasServed) {
    schema.areaServed = config.schema.areasServed;
  }

  return schema;
}

// =============================================================================
// Person Schema
// =============================================================================

/**
 * Generate Person schema from config person
 */
export function generatePersonSchema(
  person: Person,
  config: SiteConfig
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    jobTitle: person.title,
    worksFor: {
      '@type': 'Organization',
      name: config.company.name,
    },
  };

  if (person.photo) {
    schema.image = person.photo;
  }

  if (person.bio) {
    schema.description = person.bio;
  }

  if (person.email) {
    schema.email = person.email;
  }

  if (person.linkedin) {
    schema.sameAs = [person.linkedin];
  }

  return schema;
}

// =============================================================================
// Combined Schema Graph
// =============================================================================

/**
 * Generate complete schema graph for homepage
 */
export function generateHomePageSchema(config: SiteConfig): Record<string, unknown> {
  const schemas: Record<string, unknown>[] = [
    generateWebSiteSchema(config),
    generateLocalBusinessSchema(config),
  ];

  // Add featured services
  const featuredServices = config.services?.filter((s) => s.featured);
  if (featuredServices) {
    featuredServices.forEach((service) => {
      schemas.push(generateServiceSchema(service, config));
    });
  }

  // Add founders/owners
  const owners = config.team?.filter((p) => p.isOwner || p.isFounder);
  if (owners) {
    owners.forEach((person) => {
      schemas.push(generatePersonSchema(person, config));
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': schemas.map((s) => {
      const { '@context': _, ...rest } = s;
      return rest;
    }),
  };
}

// =============================================================================
// JSON-LD Helper
// =============================================================================

/**
 * Render schema as JSON-LD script tag content
 */
export function renderSchemaJsonLd(schema: Record<string, unknown>): string {
  return JSON.stringify(schema, null, 2);
}
