# Content Silo Examples

## Removals Business — 3 Silos

```yaml
silos:
  - name: "house-removals"
    top: "/services/house-removals"
    supporting:
      areas:
        - "/areas/bath"
        - "/areas/bristol"
        - "/areas/weston"
      articles:
        - "/blog/moving-costs-2024"
        - "/blog/packing-tips"
        - "/blog/moving-checklist"
        
  - name: "office-removals"
    top: "/services/office-removals"
    supporting:
      areas:
        - "/areas/bath-office"
        - "/areas/bristol-office"
      articles:
        - "/blog/office-moving-guide"
        - "/blog/minimize-downtime"
        
  - name: "storage"
    top: "/services/storage"
    supporting:
      areas: []  # No area pages for storage
      articles:
        - "/blog/storage-tips"
        
standalone:
  - "/calculator"
  - "/contact"
  - "/about"
  - "/privacy-policy"
```

## Link Flow Diagram

```
                         HOMEPAGE
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────┐
    │ HOUSE REMOVALS│ │OFFICE REMOVALS│ │  STORAGE  │
    │  (silo top)   │ │  (silo top)   │ │(silo top) │
    └───────┬───────┘ └───────┬───────┘ └─────┬─────┘
            │                 │               │
     ┌──────┴──────┐    ┌─────┴─────┐         │
     │             │    │           │         │
   Areas       Articles  Areas   Articles  Articles
     │             │    │           │         │
     └──────┬──────┘    └─────┬─────┘         │
            │                 │               │
            └────────►  CALCULATOR  ◄─────────┘
```

## Intra-Silo Linking (ENCOURAGED)

```yaml
# Within house-removals silo
links:
  # Silo top → areas
  - from: "/services/house-removals"
    to: "/areas/bath"
    anchor: "removals in Bath"
    
  # Area → silo top (REQUIRED)
  - from: "/areas/bath"
    to: "/services/house-removals"
    anchor: "house removals service"
    
  # Area → nearby area (same silo)
  - from: "/areas/bath"
    to: "/areas/bristol"
    anchor: "Bristol removals"
    
  # Article → silo top (REQUIRED)
  - from: "/blog/moving-costs"
    to: "/services/house-removals"
    anchor: "professional house removals"
    
  # Article → area (same silo)
  - from: "/blog/moving-costs"
    to: "/areas/bath"
    anchor: "moving to Bath"
```

## Cross-Silo Linking (LIMITED)

```yaml
# Between silos - max 1-2 per page
allowed:
  # Related service mention
  - from: "/services/house-removals"
    to: "/services/packing"  # Different silo
    anchor: "packing service"
    max: 1
    
  # Blog can mention related topic
  - from: "/blog/moving-costs"
    to: "/services/storage"  # Different silo
    anchor: "storage options"
    max: 1
    
forbidden:
  # Area → different silo area
  - from: "/areas/bath"
    to: "/areas/bath-office"  # NO!
    
  # Blog → different silo service as main link
  - from: "/blog/moving-costs"
    to: "/services/office-removals"  # NO!
```

## Homepage Linking

```yaml
homepage_links:
  required:
    # Link to ALL silo tops
    - to: "/services/house-removals"
      section: "services"
      anchor: "House Removals"
      
    - to: "/services/office-removals"
      section: "services"
      anchor: "Office Removals"
      
    - to: "/services/storage"
      section: "services"
      anchor: "Storage"
      
    # Link to calculator
    - to: "/calculator"
      section: "hero"
      anchor: "Get Free Quote"
      
  optional:
    # Featured areas (2-3 max)
    - to: "/areas/bath"
      section: "coverage"
      
    # Featured article
    - to: "/blog/moving-costs"
      section: "content"
```

## Calculator Linking (Special)

```yaml
calculator_inbound:
  required:
    - from: "/"
      anchor: "Get Free Quote"
    - from: "/services/house-removals"
      anchor: "Get your quote"
    - from: "/services/office-removals"
      anchor: "Get your quote"
    - from: "/services/storage"
      anchor: "Calculate storage cost"
      
calculator_outbound:
  max: 5
  allowed:
    - to: "/"
      section: "logo"
    - to: "/services/*"
      section: "results"
      max: 2
```

## Cleaning Business — 2 Silos

```yaml
silos:
  - name: "domestic-cleaning"
    top: "/services/domestic-cleaning"
    supporting:
      areas:
        - "/areas/bristol"
        - "/areas/bath"
      articles:
        - "/blog/cleaning-tips"
        - "/blog/spring-cleaning"
        
  - name: "commercial-cleaning"
    top: "/services/commercial-cleaning"
    supporting:
      areas:
        - "/areas/bristol-commercial"
      articles:
        - "/blog/office-hygiene"
```

## Trades Business — Single Silo

Small sites can have 1 silo:

```yaml
silos:
  - name: "plumbing"
    top: "/services/plumbing"
    supporting:
      areas:
        - "/areas/bristol"
        - "/areas/bath"
      articles:
        - "/blog/boiler-guide"
        
# All pages link to single silo top
# No cross-silo complexity
```
