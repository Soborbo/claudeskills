# Service Synonyms

## Removals Industry

```yaml
house_removals:
  dominant: "house removals"
  synonyms:
    - removals
    - removal company
    - moving company
    - movers
    - house movers
    - furniture movers
    - relocation
    - removal service

man_and_van:
  dominant: "man and van"
  synonyms:
    - man with van
    - van and man
    - small removals
    - single item movers
    - small moves

office_removals:
  dominant: "office removals"
  synonyms:
    - commercial removals
    - business relocation
    - office movers
    - commercial movers
    - office relocation

packing_service:
  dominant: "packing service"
  synonyms:
    - packing and unpacking
    - professional packing
    - packers
    - removal packing

storage:
  dominant: "storage"
  synonyms:
    - furniture storage
    - self storage
    - secure storage
    - short term storage
    - long term storage
```

## Cleaning Industry

```yaml
domestic_cleaning:
  dominant: "domestic cleaning"
  synonyms:
    - house cleaning
    - home cleaning
    - residential cleaning
    - domestic cleaners
    - house cleaners

commercial_cleaning:
  dominant: "commercial cleaning"
  synonyms:
    - office cleaning
    - business cleaning
    - professional cleaning
    - contract cleaning

end_of_tenancy:
  dominant: "end of tenancy cleaning"
  synonyms:
    - move out cleaning
    - deep cleaning
    - landlord cleaning
    - deposit cleaning
```

## Trades Industry

```yaml
plumbing:
  dominant: "plumber"
  synonyms:
    - plumbing
    - plumbing services
    - plumbing company
    - emergency plumber
    - local plumber

electrician:
  dominant: "electrician"
  synonyms:
    - electrical services
    - electrical contractor
    - electrical company
    - local electrician

building:
  dominant: "builder"
  synonyms:
    - building services
    - construction
    - building company
    - local builder
```

## Synonym Usage Rules

| Rule | Requirement |
|------|-------------|
| Dominant | H1, meta title, URL |
| Synonyms | H2s, body, meta description |
| Per page | ONE dominant only |
| Mixing | Never in same heading |

### Good Example

```
H1: House Removals Bristol (dominant)
Body: Our moving company provides... (synonym)
Body: ...professional movers who... (synonym)
```

### Bad Example

```
H1: House Removals & Moving Company Bristol (mixed - BAD)
```

---

# Long-tail Modifiers

## Price Modifiers

```yaml
price_modifiers:
  - cheap
  - affordable
  - budget
  - low cost
  - best price
  - competitive
  - value
  - economical
```

**Use on:** Homepage, service pages  
**Avoid on:** Premium/luxury positioning

## Quality Modifiers

```yaml
quality_modifiers:
  - best
  - top rated
  - professional
  - reliable
  - trusted
  - reputable
  - experienced
  - recommended
```

**Use on:** Homepage, service pages  
**Avoid on:** Area pages (too generic)

## Urgency Modifiers

```yaml
urgency_modifiers:
  - same day
  - next day
  - emergency
  - urgent
  - last minute
  - quick
  - fast
  - immediate
```

**Use on:** Service pages, CTAs  
**Avoid on:** Articles (unless topic)

## Size Modifiers

```yaml
size_modifiers:
  - small
  - large
  - single item
  - full house
  - studio flat
  - 1 bed
  - 2 bed
  - 3 bed
  - large home
```

**Use on:** Service pages, area pages  
**Good for:** Calculator landing pages

## Modifier Limits

| Page Type | Max Modifier Types |
|-----------|-------------------|
| Homepage | 2 (e.g., quality + price) |
| Service | 2 |
| Area | 1 |
| Article | 0 (topic is the modifier) |

### Good Example

```yaml
page: "/services/house-removals"
modifiers_used:
  - price: "affordable removals bristol"
  - urgency: "same day removals"
```

### Bad Example (too many)

```yaml
page: "/services/house-removals"
modifiers_used:
  - price: "cheap removals"
  - quality: "best removals"
  - urgency: "same day removals"
  - size: "small removals"
  # TOO MANY - pick 2
```
