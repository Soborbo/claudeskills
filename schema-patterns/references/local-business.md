# LocalBusiness and Service Schemas

## LocalBusiness Schema

```astro
---
// src/components/schema/LocalBusinessSchema.astro
interface Props {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  geo: {
    latitude: number;
    longitude: number;
  };
  hours: {
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }[];
  images: string[];
  priceRange?: string;
  rating?: {
    value: number;
    count: number;
  };
  sameAs?: string[]; // Social profiles
}

const props = Astro.props;
const siteUrl = Astro.site?.toString().replace(/\/$/, '');

const schema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#business`,
  "name": props.name,
  "description": props.description,
  "url": siteUrl,
  "telephone": props.phone,
  "email": props.email,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": props.address.street,
    "addressLocality": props.address.city,
    "addressRegion": props.address.region,
    "postalCode": props.address.postalCode,
    "addressCountry": props.address.country
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": props.geo.latitude,
    "longitude": props.geo.longitude
  },
  "openingHoursSpecification": props.hours.map(h => ({
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": h.dayOfWeek,
    "opens": h.opens,
    "closes": h.closes
  })),
  "image": props.images,
  "priceRange": props.priceRange,
  ...(props.rating && {
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": props.rating.value,
      "reviewCount": props.rating.count,
      "bestRating": 5,
      "worstRating": 1
    }
  }),
  ...(props.sameAs && { "sameAs": props.sameAs })
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

## Service Schema

```astro
---
// src/components/schema/ServiceSchema.astro
interface Props {
  name: string;
  description: string;
  provider: string;
  areaServed: string[];
  serviceType: string;
  url: string;
  image?: string;
  offers?: {
    price?: number;
    priceCurrency?: string;
    priceRange?: string;
  };
}

const props = Astro.props;
const siteUrl = Astro.site?.toString().replace(/\/$/, '');

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": props.name,
  "description": props.description,
  "provider": {
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#business`
  },
  "areaServed": props.areaServed.map(area => ({
    "@type": "City",
    "name": area
  })),
  "serviceType": props.serviceType,
  "url": props.url,
  ...(props.image && { "image": props.image }),
  ...(props.offers && {
    "offers": {
      "@type": "Offer",
      ...(props.offers.price && {
        "price": props.offers.price,
        "priceCurrency": props.offers.priceCurrency || "GBP"
      }),
      ...(props.offers.priceRange && {
        "priceSpecification": {
          "@type": "PriceSpecification",
          "price": props.offers.priceRange
        }
      })
    }
  })
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```
