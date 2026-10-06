# Patterns

Short JSON fragments for cases the generator does not cover yet or that come up in
reviews. The business is made up (Example Removals Ltd, `https://example.co.uk`).
For the full generators, read `src/config/jsonld.ts` in leadgen-template-site.

## Minimal reference nodes (every page except where the full node lives)

```json
"provider": {
  "@type": "MovingCompany",
  "@id": "https://example.co.uk/#business",
  "name": "Example Removals",
  "url": "https://example.co.uk/"
}
```

```json
"author": {
  "@type": "Person",
  "@id": "https://example.co.uk/author/jane-doe/#person",
  "name": "Jane Doe",
  "url": "https://example.co.uk/author/jane-doe/"
}
```

`isPartOf: { "@id": "https://example.co.uk/#website" }` can stay a bare reference;
nothing reads WebSite outside the homepage.

## Offer variants (only with the price visible on the page)

Fixed price:

```json
"offers": { "@type": "Offer", "price": "580", "priceCurrency": "GBP" }
```

Range ("from £350 to £4,000" on the page):

```json
"offers": { "@type": "AggregateOffer", "lowPrice": "350", "highPrice": "4000", "priceCurrency": "GBP" }
```

"From" price only:

```json
"offers": { "@type": "Offer", "priceCurrency": "GBP",
  "priceSpecification": { "@type": "PriceSpecification", "minPrice": "350", "priceCurrency": "GBP" } }
```

Hourly (unit code `HUR` = hour, UN/CEFACT):

```json
"offers": { "@type": "Offer",
  "priceSpecification": {
    "@type": "UnitPriceSpecification", "price": "45", "priceCurrency": "GBP",
    "referenceQuantity": { "@type": "QuantitativeValue", "value": "1", "unitCode": "HUR" }
  } }
```

VAT: add `"valueAddedTaxIncluded": true` to the `PriceSpecification` when the page
says the price includes VAT (`forms.vatInclusive` in the template config).

## Area page Service

```json
{
  "@type": "Service",
  "@id": "https://example.co.uk/areas/clifton/#service",
  "name": "House removals in Clifton",
  "serviceType": "House removals",
  "url": "https://example.co.uk/areas/clifton/",
  "provider": { "@type": "MovingCompany", "@id": "https://example.co.uk/#business",
                "name": "Example Removals", "url": "https://example.co.uk/" },
  "isSimilarTo": { "@id": "https://example.co.uk/services/house-removals/#service" },
  "areaServed": {
    "@type": "Place",
    "name": "Clifton",
    "containedInPlace": { "@type": "City", "name": "Bristol",
                          "sameAs": "https://en.wikipedia.org/wiki/Bristol" }
  }
}
```

## Route page Service

```json
{
  "@type": "Service",
  "@id": "https://example.co.uk/routes/bristol-to-london/#service",
  "name": "Removals from Bristol to London",
  "serviceType": "Long-distance removals",
  "url": "https://example.co.uk/routes/bristol-to-london/",
  "provider": { "@type": "MovingCompany", "@id": "https://example.co.uk/#business",
                "name": "Example Removals", "url": "https://example.co.uk/" },
  "areaServed": [
    { "@type": "City", "name": "Bristol", "sameAs": "https://en.wikipedia.org/wiki/Bristol" },
    { "@type": "City", "name": "London", "sameAs": "https://en.wikipedia.org/wiki/London" }
  ]
}
```

The template has no route generator or route; add one in the template when a site
needs route pages, with its own `routes.route()` entry.

## Service-area business address

```json
"address": {
  "@type": "PostalAddress",
  "addressLocality": "Bristol",
  "addressRegion": "England",
  "addressCountry": "GB"
}
```

No `streetAddress`, no `geo`, because GBP hides them.

## Hungarian business node (fragment)

```json
{
  "@type": "MovingCompany",
  "@id": "https://example.hu/#business",
  "name": "Example Költöztetés",
  "legalName": "Example Költöztetés Kft.",
  "url": "https://example.hu/",
  "telephone": "+36301234567",
  "email": "info@example.hu",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Példa utca 12.",
    "addressLocality": "Budapest",
    "postalCode": "1111",
    "addressCountry": "HU"
  },
  "taxID": "12345678-2-43",
  "vatID": "HU12345678",
  "identifier": { "@type": "PropertyValue", "propertyID": "cégjegyzékszám", "value": "01-09-123456" },
  "knowsLanguage": ["hu"]
}
```

All numbers above are illustrative; use the business's own, shown in its
impresszum.

Person (author page) and Article nodes: the template's `personSchema()` and
`articleSchema()` are the pattern; add the minimal reference nodes above to them.
