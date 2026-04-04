# Section Maps

Full section lists per page type.

## Landing Page (goal: lead)

```yaml
sections:
  - { id: hero, purpose: "Outcome promise + primary CTA", cta: true }
  - { id: trust-strip, purpose: "4 proof points", cta: false }
  - { id: problem, purpose: "Empathy + agitation", cta: false }
  - { id: solution, purpose: "How you solve it", cta: false }
  - { id: benefits, purpose: "3 outcomes with images", cta: true }
  - { id: how-it-works, purpose: "3-step process", cta: false }
  - { id: social-proof, purpose: "3 reviews", cta: true }
  - { id: calculator, purpose: "Interactive quote", cta: false, conditional: removals }
  - { id: why-us, purpose: "Differentiators grid", cta: false }
  - { id: faq, purpose: "6+ objection handlers", cta: false }
  - { id: final-cta, purpose: "High-contrast conversion", cta: true, primary: true }
  - { id: footer, purpose: "Contact + legal", cta: false }

total: 11-12
viewports: 8-10
cta_sections: [hero, benefits, social-proof, final-cta]
primary_conversion: final-cta
```

## Service Page (goal: inform + lead)

```yaml
sections:
  - { id: hero, purpose: "Service + location + CTA", cta: true }
  - { id: trust-strip, purpose: "Credentials", cta: false }
  - { id: service-intro, purpose: "What this includes", cta: false }
  - { id: benefits, purpose: "Why choose this", cta: true }
  - { id: process, purpose: "How it works", cta: false }
  - { id: pricing, purpose: "Price range or quote CTA", cta: true }
  - { id: social-proof, purpose: "Service reviews", cta: false }
  - { id: faq, purpose: "Service questions", cta: false }
  - { id: related-services, purpose: "Internal links", cta: false }
  - { id: final-cta, purpose: "Book/quote CTA", cta: true, primary: true }
  - { id: footer, purpose: "Contact + legal", cta: false }

total: 11
viewports: 6-8
cta_sections: [hero, benefits, pricing, final-cta]
primary_conversion: final-cta
```

## Service Area Page (goal: local lead)

```yaml
sections:
  - { id: hero, purpose: "[Service] in [Location] + CTA", cta: true }
  - { id: trust-strip, purpose: "Local credentials", cta: false }
  - { id: area-intro, purpose: "Why we serve this area", cta: false }
  - { id: services-list, purpose: "What we offer here", cta: true }
  - { id: coverage-map, purpose: "Postcodes served", cta: false }
  - { id: local-reviews, purpose: "Reviews from area", cta: false }
  - { id: local-faq, purpose: "Area questions", cta: false }
  - { id: final-cta, purpose: "Get local quote", cta: true, primary: true }
  - { id: footer, purpose: "Contact + legal", cta: false }

total: 9
viewports: 5-6
cta_sections: [hero, services-list, final-cta]
primary_conversion: final-cta
```

## Article/Blog (goal: inform)

```yaml
sections:
  - { id: hero-article, purpose: "Title + meta + read time", cta: false }
  - { id: intro, purpose: "Hook + overview", cta: false }
  - { id: body, purpose: "Main content (H2 chunks)", cta: false }
  - { id: key-takeaways, purpose: "Summary box", cta: false }
  - { id: author-box, purpose: "Credibility", cta: false }
  - { id: related-posts, purpose: "Internal links", cta: false }
  - { id: service-cta, purpose: "Soft conversion", cta: true, primary: true }
  - { id: footer, purpose: "Contact + legal", cta: false }

total: 8
viewports: varies
cta_sections: [service-cta]
primary_conversion: service-cta
```

## Calculator Page (goal: convert)

```yaml
sections:
  - { id: calculator-hero, purpose: "What you'll get", cta: false }
  - { id: calculator-widget, purpose: "Multi-step form", cta: true, primary: true }
  - { id: trust-strip, purpose: "Why trust estimate", cta: false }
  - { id: how-it-works, purpose: "What happens after", cta: false }
  - { id: footer-minimal, purpose: "Legal only", cta: false }

total: 5
viewports: 2-3
cta_sections: [calculator-widget]
primary_conversion: calculator-widget
```

## Thank You Page (goal: confirm + upsell)

```yaml
sections:
  - { id: confirmation, purpose: "Success + next steps", cta: false }
  - { id: expectation, purpose: "What happens now", cta: false }
  - { id: upsell, purpose: "Related service", cta: true, primary: true }
  - { id: social-share, purpose: "Optional sharing", cta: false }
  - { id: footer-minimal, purpose: "Contact only", cta: false }

total: 5
viewports: 1-2
cta_sections: [upsell]
primary_conversion: upsell
```

## Industry Modifiers

| Industry | Add | Remove |
|----------|-----|--------|
| removals | calculator | - |
| cleaning | pricing-table | calculator |
| trades | gallery | - |
| legal | credentials-detail | pricing |
| healthcare | compliance-badges | pricing |

## SEO Roles by Section

| Section | SEO Responsibility |
|---------|-------------------|
| hero | primary_keyword (H1) |
| service-intro | semantic_support |
| area-intro | location_keyword |
| benefits | secondary_keywords |
| faq | long_tail_questions |
| body | topic_depth |

## Section Dependencies

```yaml
dependencies:
  pricing:
    requires: [benefits]
  how-it-works:
    requires: [solution, service-intro]  # OR
  local-reviews:
    requires: [area-intro]
  related-posts:
    requires: [body]
  upsell:
    requires: [confirmation]
```
