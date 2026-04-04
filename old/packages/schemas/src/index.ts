/**
 * @leadgen/schemas
 *
 * Schema.org JSON-LD generators for SEO-optimized structured data.
 */

// LocalBusiness
export {
  localBusinessSchema,
  type LocalBusinessInput,
  type LocalBusinessSchema,
  type PostalAddress,
  type GeoCoordinates,
  type OpeningHoursSpec,
} from './LocalBusiness';

// FAQ
export {
  faqSchema,
  questionSchema,
  type FAQItem,
  type FAQSchema,
} from './FAQ';

// Breadcrumb
export {
  breadcrumbSchema,
  buildBreadcrumbsFromPath,
  type BreadcrumbItem,
  type BreadcrumbSchema,
  type PathToBreadcrumbsOptions,
} from './Breadcrumb';

// Service
export {
  serviceSchema,
  serviceListSchema,
  type ServiceInput,
  type ServiceSchema,
  type ServiceProvider,
  type ServiceOffer,
} from './Service';

/**
 * Helper to render schema as JSON-LD script tag content
 */
export function renderSchema(schema: Record<string, unknown>): string {
  return JSON.stringify(schema, null, 2);
}

/**
 * Combine multiple schemas into a graph
 */
export function combineSchemas(schemas: Record<string, unknown>[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas.map((s) => {
      // Remove @context from individual schemas when combining
      const { '@context': _, ...rest } = s;
      return rest;
    }),
  };
}
