/**
 * Breadcrumb Schema Generator
 *
 * Generates schema.org BreadcrumbList JSON-LD for navigation breadcrumbs.
 *
 * @example
 * const schema = breadcrumbSchema([
 *   { name: 'Főoldal', url: 'https://example.hu/' },
 *   { name: 'Szolgáltatások', url: 'https://example.hu/szolgaltatasok' },
 *   { name: 'Lakásköltöztetés', url: 'https://example.hu/szolgaltatasok/lakas' },
 * ]);
 *
 * // Or with automatic position calculation
 * const schema = breadcrumbSchema([
 *   { name: 'Főoldal', url: '/' },
 *   { name: 'Szolgáltatások', url: '/szolgaltatasok' },
 *   { name: 'Lakásköltöztetés' }, // Current page, no URL
 * ], 'https://example.hu');
 */

export interface BreadcrumbItem {
  /** Display name */
  name: string;

  /** URL (optional for current/last item) */
  url?: string;

  /** Position override (auto-calculated if not provided) */
  position?: number;
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }>;
}

/**
 * Generate BreadcrumbList schema
 *
 * @param items Array of breadcrumb items
 * @param baseUrl Optional base URL to prepend to relative paths
 */
export function breadcrumbSchema(
  items: BreadcrumbItem[],
  baseUrl?: string
): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const listItem: {
        '@type': 'ListItem';
        position: number;
        name: string;
        item?: string;
      } = {
        '@type': 'ListItem',
        position: item.position ?? index + 1,
        name: item.name,
      };

      // Add URL if provided (last item often doesn't have URL)
      if (item.url) {
        // Handle relative URLs
        if (baseUrl && item.url.startsWith('/')) {
          listItem.item = `${baseUrl.replace(/\/$/, '')}${item.url}`;
        } else {
          listItem.item = item.url;
        }
      }

      return listItem;
    }),
  };
}

/**
 * Helper to build breadcrumbs from pathname
 *
 * @example
 * const crumbs = buildBreadcrumbsFromPath('/szolgaltatasok/lakas', {
 *   home: 'Főoldal',
 *   labels: {
 *     szolgaltatasok: 'Szolgáltatások',
 *     lakas: 'Lakásköltöztetés',
 *   },
 * });
 */
export interface PathToBreadcrumbsOptions {
  /** Home page label */
  home?: string;

  /** Map of path segments to display labels */
  labels?: Record<string, string>;

  /** Base URL */
  baseUrl?: string;
}

export function buildBreadcrumbsFromPath(
  pathname: string,
  options: PathToBreadcrumbsOptions = {}
): BreadcrumbItem[] {
  const { home = 'Home', labels = {}, baseUrl = '' } = options;

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { name: home, url: baseUrl ? `${baseUrl}/` : '/' },
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    breadcrumbs.push({
      name: labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      url: isLast ? undefined : (baseUrl ? `${baseUrl}${currentPath}` : currentPath),
    });
  });

  return breadcrumbs;
}

export default breadcrumbSchema;
