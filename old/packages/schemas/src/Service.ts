/**
 * Service Schema Generator
 *
 * Generates schema.org Service JSON-LD for service pages.
 *
 * @example
 * const schema = serviceSchema({
 *   name: 'Lakásköltöztetés',
 *   description: 'Professzionális lakásköltöztetés Budapesten és környékén',
 *   provider: {
 *     name: 'Költöztető Kft.',
 *     url: 'https://koltoztetes.hu',
 *   },
 *   areaServed: ['Budapest', 'Pest megye'],
 *   serviceType: 'MovingCompany',
 *   offers: {
 *     priceRange: '30000-150000 HUF',
 *     priceCurrency: 'HUF',
 *   },
 * });
 */

export interface ServiceProvider {
  name: string;
  url?: string;
  telephone?: string;
  logo?: string;
}

export interface ServiceOffer {
  /** Price or price range description */
  priceRange?: string;

  /** ISO 4217 currency code */
  priceCurrency?: string;

  /** Specific price (number) */
  price?: number;

  /** Unit for price (e.g., 'per hour', 'per km') */
  priceSpecification?: string;

  /** Availability status */
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'BackOrder';
}

export interface ServiceInput {
  /** Service name */
  name: string;

  /** Service description */
  description?: string;

  /** Service URL */
  url?: string;

  /** Service type (schema.org type) */
  serviceType?: string;

  /** Service provider/organization */
  provider?: ServiceProvider;

  /** Area served (cities, regions, countries) */
  areaServed?: string | string[];

  /** Service image */
  image?: string | string[];

  /** Pricing information */
  offers?: ServiceOffer;

  /** Service category */
  category?: string;

  /** Has offer catalog */
  hasOfferCatalog?: boolean;

  /** Aggregate rating */
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
  };
}

export interface ServiceSchema {
  '@context': 'https://schema.org';
  '@type': 'Service';
  name: string;
  [key: string]: unknown;
}

export function serviceSchema(input: ServiceInput): ServiceSchema {
  const schema: ServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
  };

  if (input.description) {
    schema.description = input.description;
  }

  if (input.url) {
    schema.url = input.url;
  }

  if (input.serviceType) {
    schema.serviceType = input.serviceType;
  }

  if (input.provider) {
    schema.provider = {
      '@type': 'Organization',
      name: input.provider.name,
      ...(input.provider.url && { url: input.provider.url }),
      ...(input.provider.telephone && { telephone: input.provider.telephone }),
      ...(input.provider.logo && { logo: input.provider.logo }),
    };
  }

  if (input.areaServed) {
    schema.areaServed = input.areaServed;
  }

  if (input.image) {
    schema.image = input.image;
  }

  if (input.category) {
    schema.category = input.category;
  }

  if (input.offers) {
    const offer: Record<string, unknown> = {
      '@type': 'Offer',
    };

    if (input.offers.priceRange) {
      offer.priceRange = input.offers.priceRange;
    }

    if (input.offers.price !== undefined) {
      offer.price = input.offers.price;
    }

    if (input.offers.priceCurrency) {
      offer.priceCurrency = input.offers.priceCurrency;
    }

    if (input.offers.availability) {
      offer.availability = `https://schema.org/${input.offers.availability}`;
    }

    schema.offers = offer;
  }

  if (input.aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.aggregateRating.ratingValue,
      reviewCount: input.aggregateRating.reviewCount,
      bestRating: input.aggregateRating.bestRating || 5,
    };
  }

  return schema;
}

/**
 * Generate multiple services as an ItemList
 */
export function serviceListSchema(
  services: ServiceInput[],
  listName?: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(listName && { name: listName }),
    numberOfItems: services.length,
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: serviceSchema(service),
    })),
  };
}

export default serviceSchema;
