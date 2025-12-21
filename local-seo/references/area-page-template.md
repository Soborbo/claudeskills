# Area Page Template

## Minimum Requirements

| Requirement | Threshold |
|-------------|-----------|
| Word count | 600+ |
| Unique content | 30%+ vs other area pages |
| Local proofs | 2+ |
| Unique sections | 5+ |

## Page Structure

```
/areas/[location]/

H1: [Service] in [Location]
├── Intro (150+ words, 1 local proof)
├── H2: Services in [Location]
│   └── Service cards linking to service pages
├── H2: Areas We Cover in [Location]
│   └── Unique neighbourhood/postcode list
├── H2: Why Choose Us in [Location]
│   └── Location-specific benefits
├── H2: [Location] Customer Reviews
│   └── Unique review snippets
├── H2: [Service] Prices in [Location]
│   └── CTA to calculator/contact
└── H2: Contact Us in [Location]
    └── Map embed + form
```

## Differentiation Checklist

For EACH area page, verify these are UNIQUE:

| Element | Bristol Page | Bath Page | Cardiff Page |
|---------|--------------|-----------|--------------|
| Neighbourhoods | Clifton, Redland | Bathwick, Widcombe | Canton, Roath |
| Postcodes | BS1, BS2, BS6 | BA1, BA2 | CF5, CF11 |
| Review quote | "John from Clifton..." | "Sarah from Bath..." | "Mike from Cardiff..." |
| Local landmark | "near Cabot Circus" | "near Bath Abbey" | "near Cardiff Bay" |
| CTA text | "Bristol's trusted..." | "Bath's local..." | "Cardiff's reliable..." |

**FAIL if >70% identical to another area page.**

## Local Proof Examples

### Type 1: Customer Quote

```
"The team arrived right on time to our flat in Clifton. They 
navigated the narrow streets and limited parking perfectly. 
Highly recommend for anyone moving in BS8!"
— John, Clifton
```

### Type 2: Area Knowledge

```
We know Bristol's tricky spots – from Clifton's steep hills 
to the narrow Victorian terraces of Redland. Our team is 
experienced with BS6 permit parking and know the best times 
to avoid Gloucester Road traffic.
```

### Type 3: Local Stats

```
We've completed over 200 moves in the BS postcodes this year, 
with an average 4.9★ rating from Bristol customers.
```

## Schema for Area Page

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "House Removals in Bath",
  "provider": {
    "@type": "LocalBusiness",
    "@id": "https://domain.com/#business"
  },
  "areaServed": {
    "@type": "City",
    "name": "Bath",
    "containedIn": {
      "@type": "AdministrativeArea",
      "name": "Somerset"
    }
  },
  "description": "Professional house removals in Bath..."
}
```

## Internal Linking

| From Area Page | Link To |
|----------------|---------|
| Bath | → Silo top service page (required) |
| Bath | → Bristol area page (nearby) |
| Bath | → Weston area page (nearby) |
| Bath | → Calculator (CTA) |

**Cross-reference: `internal-linking` skill for full link map.**

## Content Uniqueness Test

Run before publishing:

1. Compare to other area pages
2. Calculate % unique sentences
3. Must be >30% unique

**Tools:** Copyscape, Siteliner, or manual diff.

## FAIL Conditions

| Check | FAIL if |
|-------|---------|
| Word count | <600 |
| Local proofs | <2 |
| Unique content | <30% |
| No map embed | Missing |
| No review quote | Missing |
| No neighbourhood list | Missing |
| Identical CTA | Same as another page |
