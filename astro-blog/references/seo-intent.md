# Phase 1: SEO & Intent

## Information Gain (Critical)

Google's algorithm measures how much NEW information you provide beyond existing results. Content that rephrases SERP consensus scores near-zero and gets penalized.

### Gap Analysis Process

1. **Search** top 3 results for your target query
2. **Extract Consensus** — List what ALL results say
3. **Find the Gap** — What's missing? This is your angle.

### Your Content Must Include ONE Of:

| Type | Example |
|------|---------|
| Original data | "Our analysis of 500 projects shows..." |
| Case study | "When we worked with [Client]..." |
| Contrarian insight | "Contrary to popular belief..." |
| Unique framework | "The 3-Step Method we developed..." |
| Expert quote | Named industry expert |

### Forbidden (Zero Information Gain)

- Rephrasing what top results already say
- Generic advice without specific data
- "Everybody knows" content
- Lists identical to competitors

---

## Entity Salience

Modern SEO ranks "Entity Salience" — how clearly the algorithm identifies what your document is ABOUT.

### Entity as Subject Rule

The main entity must be the grammatical SUBJECT, not just mentioned.

❌ "Many developers use Python for speed"
✅ "Python's speed attracts developers"

### First Sentence Rule

Every H2's first sentence: main entity in subject position.

```markdown
## How Much Does [Service] Cost?

[Service] typically costs £X-£Y... ← "[Service]" is subject
```

### Entity Density

- First 100 words: main entity as subject
- Each H2: section entity in first sentence
- Throughout: related entities mentioned naturally

---

## Search Intent Types

Every article declares ONE dominant intent. CTA must match.

| Intent | User Goal | Content Type | CTA Match |
|--------|-----------|--------------|-----------|
| **informational** | Learn | How-to, Guide | Newsletter, Download |
| **commercial** | Research before buying | Cost guide | Calculator, Quote |
| **comparison** | Evaluate options | X vs Y | Consultation |
| **transactional** | Ready to act | Service page | Contact, Book |

### Intent Rules

- `informational`: NO aggressive sales CTAs
- `commercial`: MUST link to calculator/quote
- `comparison`: MUST have clear recommendation
- `transactional`: MUST have direct action path

---

## Internal Linking

### Hard Rules by Content Type

| Content Type | Word Count | Internal Links | First Link |
|--------------|------------|----------------|------------|
| Quick guide | 500-800 | 2-3 | Within 100 words |
| Standard | 1000-1500 | 3-4 | Within 100 words |
| **Pillar** | 2500+ | **8-12** | Within 100 words |

### Pillar Article Link Strategy

For 2500+ word pillar content, distribute links throughout:

```
Intro (0-300 words):      2 links (calculator + related pillar)
Section 1 (300-800):      2 links (cluster articles)
Section 2 (800-1500):     2-3 links (service pages + clusters)
Section 3 (1500-2200):    2-3 links (clusters + tools)
Conclusion (2200+):       1-2 links (CTA + next steps)
```

### Link Relevance Rules

- Every link must be contextually relevant to the sentence
- No link stuffing — max 1 link per 200 words
- Vary anchor text — don't repeat same anchor
- Mix link types: clusters, pillars, service pages, tools

### Good Anchors
- "solar panel installation costs London"
- "our instant quote calculator"
- "complete guide to choosing a provider"

### Bad Anchors
- "click here"
- "read more"
- "this article"

---

## Elite External Link Strategy (2025)

External links are not noise — they're structural elements that build your page's authority through Knowledge Graph connections and Information Gain signals.

### Link Type Classification & `rel` Attribute Matrix

Every outbound link must be categorized by type. This determines the signals sent to search engines.

| Type | Description | nofollow | noopener | SEO/E-E-A-T Value |
|------|-------------|----------|----------|-------------------|
| `citation` | Data, statistics, research | ❌ No | ✔ Yes | High (credibility) |
| `authority` | Professional body, government | ❌ No | ✔ Yes | Excellent (trust) |
| `reputation` | Author/company verification (LinkedIn) | ❌ No | ✔ Yes | Required (E-E-A-T) |
| `commercial` | Partner or unpaid service mention | ⚠ Context | ✔ Yes | Context-dependent |
| `affiliate` | Commission link | ✔ Yes + `sponsored` | ✔ Yes | Required disclosure |
| `ugc` | User-generated content | ✔ Yes + `ugc` | ✔ Yes | Required disclosure |

**Note:** `noopener` is required for ALL `target="_blank"` links for security.

### Implementation by Type

```html
<!-- Citation (research, data) -->
<a href="https://ons.gov.uk/..." 
   target="_blank" 
   rel="noopener noreferrer"
   data-link-type="citation">
   ONS household spending data
</a>

<!-- Authority (government, professional body) -->
<a href="https://gov.uk/..." 
   target="_blank" 
   rel="noopener noreferrer"
   data-link-type="authority">
   official government guidelines
</a>

<!-- Reputation (author verification) -->
<a href="https://linkedin.com/in/..." 
   target="_blank" 
   rel="noopener noreferrer"
   data-link-type="reputation">
   John Smith's professional profile
</a>

<!-- Affiliate/Sponsored -->
<a href="https://partner.com/..." 
   target="_blank" 
   rel="noopener noreferrer nofollow sponsored"
   data-link-type="affiliate">
   recommended product
</a>
```

### Approved Authority Domains

| Category | UK Sources | International |
|----------|------------|---------------|
| Government | gov.uk, nhs.uk, legislation.gov.uk | europa.eu |
| News | bbc.co.uk, theguardian.com, reuters.com, ft.com | nytimes.com |
| Consumer | which.co.uk, moneysavingexpert.com | - |
| Industry | Relevant trade association sites | - |
| Academic | .ac.uk domains, scholar.google.com | .edu domains |
| Statistics | ons.gov.uk, statista.com | worldbank.org |

### Anchor Text Policy (Critical)

The anchor text must precisely describe the target page's relevance. "Vacuum" links (generic anchors) can trigger penalties.

**Forbidden patterns:**
- "here", "source", "website", "click here"
- "according to a study" (without naming it)
- "link", "this page", "read more"

**Required pattern:** Anchor includes source name + the claim being supported.

| ❌ Bad | ✅ Good |
|--------|---------|
| "Read more about costs here." | "The BAR 2024 industry report shows costs rose 15%." |
| "According to this study..." | "Research from Which? (2024) found that 67% of customers..." |
| "Source" | "ONS household expenditure data" |

### Quantity & Context Requirements

External links increase page authority when used correctly. Zero external links = E-E-A-T red flag.

**Link Density:**
- Ratio: ~1 external link per 300-500 words
- Minimum: 3 per article (1 citation + 1 authority + 1 reputation)
- Maximum: Don't exceed internal link count

**Context Requirement:** Every external link must be preceded or followed by an explanatory sentence establishing source credibility.

**Example:**
```markdown
❌ Bad (no context):
"The average cost is £1,200 ([source](https://...))."

✅ Good (with context):
"According to the UK's leading consumer research organization, 
the [Which? 2024 Home Services Survey](https://which.co.uk/...) 
found the average cost is £1,200 — a 12% increase from 2023."
```

### Requirements by Intent

| Intent | Min. Links | Required Types |
|--------|------------|----------------|
| informational | 3 | 1 citation, 1 authority, 1 any |
| commercial | 3 | 1 citation, 1 authority, 1 reputation |
| comparison | 4 | 2 citations, 1 authority, 1 reputation |
| transactional | 2 | 1 authority (regulations), 1 reputation |

### Integration with Schema (Automatic)

`reputation` type links should auto-populate the Author's `sameAs` field in JSON-LD:

```json
{
  "@type": "Person",
  "name": "John Smith",
  "sameAs": [
    "https://linkedin.com/in/john-smith",      // reputation link
    "https://industry-body.org/member/12345"   // reputation link
  ]
}
```

### Frontmatter Tracking (Optional)

For audit purposes, track external link types:

```yaml
externalLinks:
  citations: 2
  authority: 1
  reputation: 1
  affiliate: 0
```

---

## Phase 1 Output Template

Before proceeding to Phase 2, document:

```
TARGET QUERY: [what user will search]

INTENT: [informational/commercial/comparison/transactional]

CONSENSUS (what top 3 results say):
1. [Common point]
2. [Common point]
3. [Common point]

GAP (your unique angle):
[What's missing that you'll cover]

ENTITIES TO COVER:
- [Main entity]
- [Related entity 1]
- [Related entity 2]
- ...

CTA TYPE: [matching intent]

INTERNAL LINKS PLANNED:
1. [anchor] → [URL] (within first 100 words)
2. [anchor] → [URL]
```
