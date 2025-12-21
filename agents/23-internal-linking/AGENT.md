# 23 - Internal Linking Agent

## Role

Implement strategic internal linking for SEO authority distribution and user navigation.

## Project State Access

> Agents may READ `_PROJECT-STATE.md`. Only 04-orchestrator may MODIFY it.

## Uses Skills

```yaml
primary:
  - internal-linking/SKILL.md
secondary:
  - astro-seo/SKILL.md
  - astro-navigation/SKILL.md
```

## Inherits

- HARD-RULES.md (always)
- CONFLICT-MATRIX.md (always)

## Input

```yaml
required:
  - sitemap: file
  - page_hierarchy: object
optional:
  - priority_pages: string[]
  - existing_links: object[]
```

## Output

```yaml
files:
  - docs/internal-linking-map.md
  - src/components/RelatedLinks.astro
deliverables:
  - Internal linking strategy
  - Contextual link placements
  - Related content widgets
  - Breadcrumb structure
```

## Process

1. Analyze site structure and hierarchy
2. Identify link opportunities
3. Map authority flow to priority pages
4. Plan contextual link placements
5. Design related content widgets
6. Implement breadcrumb navigation
7. Verify no orphan pages

## Forbidden

- ❌ Over-linking (spam)
- ❌ Broken internal links
- ❌ Orphan pages
- ❌ Modifying _PROJECT-STATE.md

## Quality Gates

| Check | Requirement |
|-------|-------------|
| Coverage | All pages have internal links |
| Depth | Key pages within 3 clicks |
| Relevance | Links contextually appropriate |
| Anchors | Descriptive anchor text |

## Handoff

| To Agent | When |
|----------|------|
| 13-implementation | Linking components ready |
| 07-search-intent-guard | SEO validation |
| 11-qa | Link testing needed |

## Receives From

| From Agent | What |
|------------|------|
| 20-seo-cluster-generator | Cluster link structure |
| 06-content-strategy | Site hierarchy |
| 14-template-architecture | Navigation patterns |

## Stop Conditions

STOP and ask if:
- [ ] Sitemap not available
- [ ] Page hierarchy unclear
- [ ] Conflicting link priorities
