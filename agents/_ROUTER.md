# Agent Router

> **IMPORTANT:** Phase ordering overrides numeric folder order.
> Example: 05-discovery runs BEFORE 01-market-intelligence.
> Always follow "By Project Phase" section for execution order.

## By Task Type

| Task | Primary Agent | Backup Agent |
|------|---------------|--------------|
| New project setup | 05-discovery | 04-orchestrator |
| Competitor research | 01-market-intelligence | 06-content-strategy |
| Write headlines | 02-copy | 19-landing-generator |
| CTA text | 02-copy | - |
| Page structure planning | 14-template-architecture | 06-content-strategy |
| Component creation | 13-implementation | 16-astro-architecture |
| Form implementation | 13-implementation | 09-security |
| Calculator build | 21-calculator-configurator | - |
| SEO meta tags | 07-search-intent-guard | 20-seo-cluster |
| Schema markup | 22-schema | 08-local-variant |
| Local/area pages | 08-local-variant | 20-seo-cluster |
| Internal linking | 23-internal-linking | 20-seo-cluster |
| Image optimization | 03-performance-guardian | - |
| Speed issues | 03-performance-guardian | - |
| Security audit | 09-security | 11-qa |
| Pre-launch QA | 11-qa | 10-consistency-guardian |
| Analytics setup | 12-analytics-sanity | - |
| AI/LLM optimization | 24-llm-optimization | 22-schema |
| TypeScript issues | 17-typescript-quality | 16-astro-architecture |
| Tailwind/styling | 18-tailwind-system | 15-ux-ui-architecture |

## By Project Phase

### Phase 1: Discovery
1. 05-discovery
2. 01-market-intelligence
3. 06-content-strategy

### Phase 2: Architecture
4. 16-astro-architecture
5. 14-template-architecture
6. 15-ux-ui-architecture
7. 18-tailwind-system

### Phase 3: Implementation
8. 13-implementation
9. 02-copy
10. 19-landing-generator
11. 21-calculator-configurator (if needed)

### Phase 4: SEO & Optimization
12. 20-seo-cluster-generator
13. 22-schema
14. 23-internal-linking
15. 08-local-variant (if needed)
16. 24-llm-optimization

### Phase 5: Quality
17. 03-performance-guardian
18. 09-security
19. 17-typescript-quality
20. 10-consistency-guardian
21. 11-qa

### Phase 6: Analytics & Launch
22. 12-analytics-sanity
23. Final 11-qa pass

## Guardian Agents

These agents can VETO and return work:
- 03-performance-guardian
- 07-search-intent-guard
- 09-security
- 10-consistency-guardian
- 11-qa
- 17-typescript-quality

## Parallel Execution Groups

These agents can run simultaneously:
- 01-market-intelligence + 05-discovery
- 02-copy + 14-template-architecture
- 22-schema + 23-internal-linking + 24-llm-optimization
- 03-performance-guardian + 09-security
