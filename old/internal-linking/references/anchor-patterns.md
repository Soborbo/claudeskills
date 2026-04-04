# Anchor Text Patterns

## Anchor Types

| Type | Description | Limit |
|------|-------------|-------|
| Exact match | Full target keyword | 1 per page, 3 per target |
| Partial match | Part of keyword + variation | 3 per page |
| Branded | Company/brand name | Unlimited |
| Service name | Just the service | Unlimited |
| Natural phrase | Contextual mention | Unlimited |
| Generic | "click here", "learn more" | Nav/footer ONLY |

## By Target Page

### Homepage

```yaml
anchors:
  preferred:
    - "Home"
    - "{Brand Name}"
    - "{Brand Name} Removals"
  acceptable:
    - "back to home"
    - "our homepage"
  forbidden:
    - "click here"
```

### Service Page (Silo Top)

```yaml
anchors:
  preferred:
    - "{service name}"  # "house removals"
    - "our {service}"   # "our house removals service"
    - "{service} in {location}"  # "house removals in Bristol"
  acceptable:
    - "professional {service}"
    - "{service} team"
    - "learn about our {service}"
  exact_match:
    - "house removals bristol"  # MAX 3 inbound total
  forbidden:
    - "click here for house removals"
    - "read more about moving"
```

### Area Page

```yaml
anchors:
  preferred:
    - "{service} in {area}"  # "removals in Bath"
    - "{area} {service}"     # "Bath removals"
    - "serving {area}"
  acceptable:
    - "our {area} service"
    - "{area} coverage"
  forbidden:
    - "click here"
    - "{area} page"
```

### Blog Article

```yaml
anchors:
  preferred:
    - "{article topic}"      # "moving costs guide"
    - "how to {topic}"       # "how to pack fragile items"
    - "guide to {topic}"
  acceptable:
    - "read our {topic} guide"
    - "learn about {topic}"
  forbidden:
    - "click here"
    - "read more"
    - "this article"
```

### Calculator

```yaml
anchors:
  preferred:
    - "get a quote"
    - "instant quote"
    - "get your free quote"
    - "calculate your cost"
    - "see prices"
  acceptable:
    - "free quote calculator"
    - "try our calculator"
  exact_match:
    - "removal quote calculator"  # Rare, 1-2 max
  forbidden:
    - "click here for quote"
    - "calculator"  # Too generic
```

### Contact Page

```yaml
anchors:
  preferred:
    - "contact us"
    - "get in touch"
    - "speak to our team"
  acceptable:
    - "call us"
    - "send us a message"
  forbidden:
    - "click here"
```

## Placement Rules

### Hero Section

| Target | Anchor Style |
|--------|--------------|
| Calculator | Action-focused: "Get Free Quote" |
| Phone | "Call Now: {phone}" |
| Service | Avoided (use services section) |

### Body Content

| Rule | Requirement |
|------|-------------|
| Style | Natural, contextual |
| Density | Max 1 per 100 words |
| Generic | FORBIDDEN |
| Placement | Where naturally relevant |

```
Good:
"Our [house removals service] includes full packing..."

Bad:
"For more information, [click here]."
```

### Related Services Section

| Target | Anchor Style |
|--------|--------------|
| Same silo service | Service name |
| Cross-silo service | "Related: {service}" |

### FAQ Section

| Target | Anchor Style |
|--------|--------------|
| Article | Question or topic phrase |
| Service | Service name in answer |

```
Q: How much does moving cost?
A: See our [moving costs guide] for detailed pricing.
   Our [house removals service] starts from £299.
```

### Footer

| Allowed | Forbidden |
|---------|-----------|
| Generic nav: "Home", "Services" | Generic in body |
| Service names | Same rules apply |
| Legal: "Privacy Policy" | |

## Exact Match Limits

**Exact match = full keyword phrase**

| Limit | Scope |
|-------|-------|
| 1 per page | Outbound from any single page |
| 3 per target | Total inbound to any page |
| Spread sources | Not all from one page type |

```yaml
# Example: "house removals bristol" as anchor

inbound_to_services_house_removals:
  - from: "/"
    anchor: "house removals bristol"  # ✓ Count 1
  - from: "/blog/moving-costs"
    anchor: "house removals bristol"  # ✓ Count 2
  - from: "/areas/bath"
    anchor: "house removals bristol"  # ✓ Count 3
  - from: "/blog/packing"
    anchor: "house removals bristol"  # ❌ EXCEEDS LIMIT
```

## Natural Variation

```yaml
# Good anchor variety for "/services/house-removals"
inbound_anchors:
  - "house removals"           # Service name
  - "house removals bristol"   # Exact match (1 of 3)
  - "our removal service"      # Natural
  - "professional movers"      # Variation
  - "home moving service"      # Variation
  - "house removals service"   # Partial match
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Same anchor everywhere | Vary naturally |
| "click here" in body | Use descriptive anchor |
| Over-optimized | Mix in branded/natural |
| Orphaned generic | Always use nav/footer |
