# Skill Manifest

## Load Order (Priority)

### 1. Always Load First
- **project-spec-v4** — Defines project constraints and requirements
- **astro-architecture** — Tech stack foundation and project structure

### 2. Core Skills (load for every Astro project)
- **astro-forms** OR **lead-gen-calculator** (not both)
- **astro-images** — Image optimization patterns
- **astro-seo** — Technical SEO essentials
- **astro-security** — Security headers and protections
- **astro-ux** — UX patterns and section taxonomy

### 3. Conditional Skills (load based on requirements)
| Skill | Load When |
|-------|-----------|
| astro-i18n | Multi-language site |
| astro-blog | Blog/content section needed |
| analytics-measurement | GTM/GA4 required |
| local-seo | Local business targeting |
| astro-a11y | Accessibility audit needed |

### 4. Specialist Skills (on-demand)
- **Conversion**: cro, ab-testing, social-proof
- **Performance**: astro-performance, speed-monitoring
- **Content**: lead-gen-copy, keyword-research, competitor-analysis
- **Technical**: schema-patterns, astro-animations, design-tokens
- **Operations**: email-templates, crm-integrations, client-handoff

## Skill Conflicts

| Skill A | Skill B | Resolution |
|---------|---------|------------|
| astro-forms | lead-gen-calculator | Use calculator for quote/pricing tools, forms for simple contact |
| astro-animations | astro-performance | Performance wins — animations must not break LCP/CLS |
| cro | astro-a11y | Accessibility wins — never sacrifice a11y for conversion |
| astro-blog | page-structure | blog uses its own templates, page-structure for landing pages |

## Skill Dependencies

```
lead-gen-calculator
└── requires: astro-forms (backend patterns)

astro-seo
└── requires: astro-architecture (config structure)

analytics-measurement
└── requires: astro-architecture (GTM config location)

schema-patterns
└── requires: astro-seo (base SEO setup)

speed-monitoring
└── requires: astro-performance (metrics understanding)

ab-testing
└── requires: analytics-measurement (GA4 events)
```

## Skill Categories

### Foundation
| Skill | Purpose |
|-------|---------|
| project-spec-v4 | Project requirements template |
| astro-architecture | Tech stack and structure |
| astro-components | Component library patterns |
| page-structure | Landing page templates |
| section-skeleton | Section patterns |

### Conversion
| Skill | Purpose |
|-------|---------|
| astro-forms | Form handling and validation |
| lead-gen-calculator | Quote/pricing calculators |
| social-proof | Testimonials and trust |
| cro | Conversion optimization |
| ab-testing | A/B testing patterns |

### SEO & Content
| Skill | Purpose |
|-------|---------|
| astro-seo | Technical SEO |
| local-seo | Local business SEO |
| keyword-research | Keyword strategy |
| internal-linking | Link architecture |
| heading-tree | Heading structure |
| lead-gen-copy | Copywriting patterns |
| astro-blog | Blog implementation |

### Technical Quality
| Skill | Purpose |
|-------|---------|
| astro-performance | Core Web Vitals |
| speed-monitoring | Performance tracking |
| astro-a11y | Accessibility |
| astro-security | Security headers |
| astro-testing | Test patterns |
| error-states | Error handling |

### Visual & UX
| Skill | Purpose |
|-------|---------|
| astro-ux | UX patterns |
| astro-images | Image optimization |
| astro-animations | Motion design |
| astro-navigation | Nav components |
| design-tokens | Design system |
| youtube-embed | Video embeds |

### Integrations
| Skill | Purpose |
|-------|---------|
| analytics-measurement | GTM/GA4 |
| crm-integrations | CRM webhooks |
| email-templates | Email design |
| schema-patterns | Structured data |

### Operations
| Skill | Purpose |
|-------|---------|
| deployment | Cloudflare setup |
| client-handoff | Handoff docs |
| competitor-analysis | Research patterns |

### Multi-Market
| Skill | Purpose |
|-------|---------|
| astro-i18n | Internationalization |
| legal-pages | Legal requirements |
