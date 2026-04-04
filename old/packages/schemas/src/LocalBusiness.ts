/**
 * LocalBusiness Schema Generator
 *
 * Generates schema.org LocalBusiness JSON-LD for local SEO.
 *
 * @example
 * const schema = localBusinessSchema({
 *   name: 'Költöztető Kft.',
 *   description: 'Megbízható költöztetés Budapesten',
 *   url: 'https://koltoztetes.hu',
 *   telephone: '+36 1 234 5678',
 *   email: 'info@koltoztetes.hu',
 *   address: {
 *     streetAddress: 'Példa utca 1.',
 *     addressLocality: 'Budapest',
 *     postalCode: '1234',
 *     addressCountry: 'HU',
 *   },
 *   geo: { latitude: 47.4979, longitude: 19.0402 },
 *   openingHours: [
 *     { days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], opens: '08:00', closes: '18:00' },
 *     { days: ['Sa'], opens: '09:00', closes: '14:00' },
 *   ],
 *   priceRange: '$$',
 *   image: 'https://koltoztetes.hu/images/storefront.jpg',
 *   sameAs: [
 *     'https://facebook.com/koltoztetes',
 *     'https://instagram.com/koltoztetes',
 *   ],
 * });
 */

export interface PostalAddress {
  streetAddress: string;
  addressLocality: string;
  postalCode?: string;
  addressRegion?: string;
  addressCountry?: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface OpeningHoursSpec {
  /** Day codes: Mo, Tu, We, Th, Fr, Sa, Su */
  days: string[];
  opens: string;
  closes: string;
}

export interface LocalBusinessInput {
  /** Business name */
  name: string;

  /** Business type (default: LocalBusiness) */
  type?: string;

  /** Business description */
  description?: string;

  /** Website URL */
  url?: string;

  /** Phone number */
  telephone?: string;

  /** Email address */
  email?: string;

  /** Physical address */
  address?: PostalAddress;

  /** Geographic coordinates */
  geo?: GeoCoordinates;

  /** Opening hours */
  openingHours?: OpeningHoursSpec[];

  /** Price range indicator (e.g., $, $$, $$$) */
  priceRange?: string;

  /** Business image URL */
  image?: string | string[];

  /** Logo URL */
  logo?: string;

  /** Social media profile URLs */
  sameAs?: string[];

  /** Area served (city, region, or country names) */
  areaServed?: string | string[];

  /** Aggregate rating */
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
}

export interface LocalBusinessSchema {
  '@context': 'https://schema.org';
  '@type': string;
  name: string;
  [key: string]: unknown;
}

export function localBusinessSchema(input: LocalBusinessInput): LocalBusinessSchema {
  const schema: LocalBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': input.type || 'LocalBusiness',
    name: input.name,
  };

  if (input.description) {
    schema.description = input.description;
  }

  if (input.url) {
    schema.url = input.url;
  }

  if (input.telephone) {
    schema.telephone = input.telephone;
  }

  if (input.email) {
    schema.email = input.email;
  }

  if (input.address) {
    schema.address = {
      '@type': 'PostalAddress',
      ...input.address,
    };
  }

  if (input.geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: input.geo.latitude,
      longitude: input.geo.longitude,
    };
  }

  if (input.openingHours && input.openingHours.length > 0) {
    schema.openingHoursSpecification = input.openingHours.map((hours) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours.days,
      opens: hours.opens,
      closes: hours.closes,
    }));
  }

  if (input.priceRange) {
    schema.priceRange = input.priceRange;
  }

  if (input.image) {
    schema.image = input.image;
  }

  if (input.logo) {
    schema.logo = input.logo;
  }

  if (input.sameAs && input.sameAs.length > 0) {
    schema.sameAs = input.sameAs;
  }

  if (input.areaServed) {
    schema.areaServed = input.areaServed;
  }

  if (input.aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.aggregateRating.ratingValue,
      reviewCount: input.aggregateRating.reviewCount,
      bestRating: input.aggregateRating.bestRating || 5,
      worstRating: input.aggregateRating.worstRating || 1,
    };
  }

  return schema;
}

export default localBusinessSchema;
