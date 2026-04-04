---
name: competitor-analysis
description: Extracts marketing elements from competitor websites. Structured observation only. Does not write copy or make recommendations.
---

# Competitor Analysis Skill

## Purpose

Extracts observable marketing data from competitor websites. Observation only, no interpretation.

## Position in Workflow

```
[competitor-analysis] → [keyword-research] → [lead-gen-copy]
         ↓
   Raw observations      →    Patterns    →    Copy decisions
```

This skill produces RAW DATA. Copy decisions happen in other skills.

## Input

```yaml
competitor_urls: ["url1", "url2", "url3"]  # min 3, max 5
analysis_focus: full | messaging | trust | pricing | cta
industry: removals | cleaning | trades | legal | healthcare
```

## Output

```yaml
competitors:
  - url: "..."
    messaging: { ... }
    trust: { ... }
    pricing: { ... }
    ctas: { ... }
observed_differences: [ ... ]  # What varies between competitors
```

## Hard Rules

| Rule | Requirement |
|------|-------------|
| Competitor count | Minimum 3, maximum 5 |
| Data source | Visual observation only |
| No scraping | Manual review, no HTML parsing |
| No recommendations | Observations only, no "should" |
| Absence = explicit | Missing element → `not_found: true` |

## Analysis Categories

### 1. Messaging

| Field | Extract |
|-------|---------|
| `headline` | Exact H1 text |
| `headline_pattern` | benefit / feature / question / statement |
| `value_prop` | Main promise (1 sentence) |
| `tone` | formal / professional / casual / friendly |
| `unique_claims` | List of specific claims |

### 2. Trust Elements

| Field | Extract |
|-------|---------|
| `review_platform` | Google / Trustpilot / none |
| `rating` | Number or `not_found` |
| `review_count` | Number or `not_found` |
| `credentials` | List: type + name |
| `guarantees` | List: type + specifics |
| `team_visible` | true / false |

### 3. Pricing

| Field | Extract |
|-------|---------|
| `transparency` | hidden / teaser / full |
| `lowest_shown` | Price or `not_found` |
| `pricing_model` | fixed / hourly / quote-only |
| `discounts` | List or `not_found` |

### 4. CTAs

| Field | Extract |
|-------|---------|
| `primary_text` | Exact button text |
| `primary_placement` | hero / header / footer |
| `form_fields_count` | Number |
| `phone_prominent` | true / false |
| `mobile_sticky` | true / false |

## Handling Missing Data

**Never leave fields empty. Never guess.**

```yaml
# If element exists
rating: 4.8

# If element not found
rating: 
  not_found: true
  
# If unclear/ambiguous
pricing_model:
  unclear: true
  observed: "Shows 'from £X' but also 'call for quote'"
```

## Observed Differences Rules

Differences are **observations**, not opportunities or recommendations.

```yaml
# CORRECT - observation only
observed_differences:
  - category: pricing
    observation: "Competitors A, B show no prices. Competitor C shows 'from £299'."
    
# WRONG - contains recommendation
observed_differences:
  - category: pricing
    opportunity: "Show transparent pricing to differentiate"  # ❌ NO
```

**"Opportunity" word is FORBIDDEN in output.**

## Output Stability

Same input → same output structure. Always.

| Scenario | Rule |
|----------|------|
| Field has data | Include with value |
| Field not found | Include with `not_found: true` |
| Field unclear | Include with `unclear: true` + `observed` |
| Never | Omit fields |

## Forbidden

- ❌ HTML scraping or parsing
- ❌ Accessing competitor analytics
- ❌ Recommendations or "should" statements
- ❌ Ranking competitors (better/worse)
- ❌ Omitting fields when data missing
- ❌ Using word "opportunity"
- ❌ Making strategic suggestions

## Non-goals

- Does NOT write copy
- Does NOT rank competitors
- Does NOT make recommendations
- Does NOT interpret data
- Does NOT suggest positioning

## References

- [schema-messaging.md](references/schema-messaging.md) — Full messaging schema
- [schema-trust.md](references/schema-trust.md) — Full trust schema
- [schema-pricing-cta.md](references/schema-pricing-cta.md) — Full pricing & CTA schema

## Definition of Done

- [ ] 3-5 competitors analyzed
- [ ] All categories filled (or marked `not_found`)
- [ ] No recommendations in output
- [ ] No "opportunity" word used
- [ ] Differences are observations only
