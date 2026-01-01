# Phase 3: Writing Rules

**⚠️ CRITICAL: Read `references/human-voice.md` FIRST to avoid AI-like writing patterns.**

## Answer-First Paragraphs (Use Strategically)

Answer-first paragraphs work well for direct questions and QueryAnswer sections. **Don't use them universally** or writing becomes robotic.

### When to Use Answer-First

✅ **Use for:**
- QueryAnswer section (required)
- Direct "how much" or "how long" questions
- Cost breakdowns and pricing sections
- First paragraph after H2s

✅ **Don't use for:**
- Personal stories and case studies
- Problem → solution narratives
- Engaging section openings
- Building suspense or interest

### The Pattern
```
[ANSWER: Key fact/claim] ← First sentence
[EVIDENCE: Supporting data]
[CONTEXT: Qualifications]
```

### Examples

❌ **Bad (context-first for a direct question):**
"Many people wonder about service costs. This is a common question. The truth is, it depends on many factors. Generally speaking, you can expect to pay £500-£1,500."

✅ **Good (answer-first for direct question):**
"A typical service costs £800-£1,200 in the UK. This price includes standard deliverables and support. Factors like complexity and location can adjust this by ±30%."

✅ **Also good (narrative approach for engagement):**
"Last month, a client called us with three quotes ranging from £500 to £1,800 for identical work. The confusion is understandable—without knowing what's included, prices look random. Here's what actually determines the final cost."

### Transitional Phrases - Use Sparingly

**ALLOWED in moderation:**
- "Many homeowners ask about..." (transitioning to FAQ)
- "It's worth noting that..." (important caveats)
- "When choosing a provider..." (natural advice)
- "Here's what matters..." (emphasis)

**FORBIDDEN:**
- Starting 3+ paragraphs with the same phrase
- "Let's explore..." or "Let's dive into..." (too blog-coach)
- "In today's world..." or "In this day and age..." (cliché)
- Using them as filler when you don't know what to say

---

## Typography Standards

| Property | Value |
|----------|-------|
| Max line width | 65-75 characters |
| Body font | 16-18px |
| Line height | 1.6 |
| Paragraph spacing | 1.5em |
| Alignment | Left (never justified) |

### Paragraph Rules
- Maximum 4 lines / 2-4 sentences
- One idea per paragraph
- Short sentences (15-20 words average)
- Active voice preferred

---

## Readability Standards (Human Comprehension + Mobile)

### Paragraph Length

**Standard paragraphs:** 3-5 sentences (50-80 words)
**Maximum:** 100 words before requiring a break
**Mobile consideration:** 2-3 sentences per paragraph (easier on small screens)
**Variation:** Mix short (1-2 sentence) with medium (3-5 sentence) paragraphs

❌ **Dense wall of text:**
```markdown
Solar panel installation involves multiple considerations that homeowners need to understand before proceeding. The cost varies significantly based on your roof size, panel quality, and whether you add battery storage which can increase the total by thousands of pounds. Most installations complete in one to two days but the planning process takes several weeks including surveys, quotes, and scheduling. You'll also need to consider the long-term benefits like reduced energy bills and increased property value which typically offset the initial investment within seven to ten years.
```
(200+ words in single paragraph - exhausting to read)

✅ **Readable variation:**
```markdown
Solar panel installation involves several key decisions.

The cost varies significantly based on your roof size, panel quality, and whether you add battery storage. Battery systems can increase the total by £2,000-£3,000, but they provide backup power during outages.

Most installations complete in 1-2 days. The planning process takes 4-6 weeks including surveys, quotes, and scheduling.

Long-term benefits like reduced energy bills typically offset the initial investment within 7-10 years.
```
(Short opening + medium paragraphs = scannable and digestible)

### Sentence Length Variety

**Target average:** 15-20 words per sentence
**Mix:** Short (5-10 words) + Medium (15-20) + Long (25-30) sentences
**Reading level:** Flesch-Kincaid Grade 8-10 (accessible to general audience)
**Avoid:** 3+ consecutive sentences over 25 words

**Example of good variety:**
```markdown
Solar panels cost £5,000-£8,000 in the UK. (8 words - punchy)

The exact price depends on your roof size, panel quality, and whether you add battery storage, which can increase the total by another £2,000-£3,000. (28 words - detailed)

Most installations complete in 1-2 days. (6 words - quick fact)
```

### Paragraph Opening Patterns

**Vary your paragraph starters to avoid robotic patterns:**

✅ **Good variety:**
- Question opening: "How much does maintenance cost?"
- Statistic opening: "73% of homeowners underestimate installation time."
- Narrative opening: "Last month, a client saved £1,200 by booking in January."
- Direct fact: "Solar panels require minimal maintenance."
- Transition: "Beyond upfront costs, consider long-term savings."

❌ **Avoid repetitive patterns:**
- Starting 3+ consecutive paragraphs with "The..."
- Every paragraph starting with subject-verb
- Overusing "It's important to..." or "You should..."

---

## GEO Formatting (For LLM Retrieval)

### < 300 Character Answer Blocks
Every H2 must be followed by an extractable answer under 300 characters.

```markdown
## How long does the typical project take?

A standard project takes 4-6 weeks from start to finish. ← Extractable (under 300 chars)

Larger or more complex projects may require...
```

### Decision Matrix Tables
For ANY comparison (X vs Y), include a table. LLMs prefer tabular data.

```markdown
| Factor | DIY | Professional |
|--------|-----|--------------|
| Cost | £100-£300 | £500-£1,500 |
| Time | 1-2 days | 4-6 hours |
| Risk | High | Low (insured) |
| **Best for** | Students | Families |
```

### Statistic Isolation
Don't bury data in paragraphs. Isolate key stats:

❌ **Bad:**
"According to recent surveys, approximately 73% of people tend to underestimate their project costs by somewhere between 20% and 30%."

✅ **Good:**
**Key statistic:**
- **73% of customers** underestimate costs by **20-30%**

---

## Featured Snippet Optimization (Position 0)

Featured snippets appear above organic results, driving 8-12% CTR. Optimize for them systematically.

### Paragraph Snippets (40-60 Words)

Google favors concise, direct answers immediately after H2s.

**Format:**
```markdown
## How much does [topic] cost in the UK?

[Main entity] costs £X-£Y in the UK. This price includes [key inclusions]. Factors like [variable 1] and [variable 2] can adjust the final cost by ±Z%.

[Additional context in next paragraph...]
```

**Character count:** 280-320 characters (including spaces)
**Sentence structure:** Answer → Evidence → Context

### List Snippets (Parallel Structure)

Google extracts numbered/bulleted lists verbatim. Use parallel phrasing.

**Format:**
```markdown
## How to choose a [main entity]

Follow these steps to select the right [entity]:

1. **Verify credentials** — Check for industry certifications and insurance
2. **Compare quotes** — Get at least 3 detailed written estimates
3. **Check reviews** — Read recent customer feedback on independent sites
4. **Ask questions** — Clarify warranty terms and project timeline
5. **Review contract** — Ensure all details match the quote before signing
```

**Rules:**
- **5-8 items** optimal (Google truncates at 8)
- **Parallel structure:** Each item starts same way (verb, noun, etc.)
- **Bolded labels** + concise description (10-15 words)

### Table Snippets (Comparison Data)

Google extracts tables for "X vs Y" queries. Keep tables simple.

**Format:**
```markdown
## [Option A] vs [Option B]: Which is better?

| Factor | Option A | Option B |
|--------|----------|----------|
| Cost | £X-£Y | £A-£B |
| Time | N days | M days |
| Difficulty | Low | High |
| **Best for** | Homeowners | Landlords |
```

**Rules:**
- **3-4 columns max** (mobile rendering)
- **5-7 rows max** (snippet height limit)
- **Bold final row** for "Best for" or "Recommendation"
- **Specific data:** No vague terms ("some", "varies", "depends")

### Snippet-Friendly H2 Patterns

**Question format** (highest snippet rate):
- "How much does [topic] cost?"
- "How long does [process] take?"
- "What is the best [entity] for [use case]?"
- "When should you [action]?"

**Avoid vague H2s:**
- ❌ "Understanding the costs" (too broad)
- ✅ "How much does installation cost in 2026?" (specific, question-based)

### Snippet Testing Checklist

- [ ] H2 is a direct question (or can be rephrased as one)
- [ ] Answer appears in first 40-60 words after H2
- [ ] Answer is self-contained (no pronouns requiring context)
- [ ] Lists use parallel structure with 5-8 items
- [ ] Tables have 3-4 columns, specific data (no "varies")
- [ ] No fluff before the answer ("Many people wonder..." ❌)

---

## Source Citation

### Every Statistic Needs a Source

```markdown
The average UK service costs £1,100 (Industry Association 2024 Survey).
```

Or inline:
```markdown
73% of customers underestimate costs ([Consumer Association](https://url)).
```

### Forbidden
- "Studies show..." (without citation)
- Round numbers without source
- "Experts say..." (without named expert)

---

## Entity Salience in Writing

### Balanced Entity Approach

Mention the main entity frequently and prominently. **Don't sacrifice natural phrasing for rigid subject-position rules.**

**REQUIRED:**
- First paragraph: main entity prominent (as subject OR mentioned clearly)
- First sentence after H2: entity present and clear
- Entity mentioned regularly throughout (density matters)

**ALLOWED natural phrasing:**
✅ "Many homeowners choose professional services" (natural, conversational)
✅ "Our clients typically see ROI in 5-7 years" (human voice)
✅ "When you're comparing quotes..." (addresses reader)
✅ "Professional services handle 80% of UK projects" (entity as subject also fine)

**Key insight:** Entity density (mentioning it regularly) matters more than forcing it into subject position every sentence.

---

## Engagement Hooks

Use **sparingly** to break up long sections. **Maximum 0-2 per standard article, 2-4 per pillar.** Overuse creates template-like feel.

### Types & Usage

**Stat** — Add credibility
```markdown
<EngagementHook type="stat">
**Did you know?** The average UK household spends £X on this service annually.
</EngagementHook>
```

**Question** — Make reader think
```markdown
<EngagementHook type="question">
**Ask yourself:** Have you compared at least 3 different providers?
</EngagementHook>
```

**Tip** — Provide actionable value
```markdown
<EngagementHook type="tip">
**Pro tip:** Book during off-peak season for 15-20% savings.
</EngagementHook>
```

**Quote** — Add authority
```markdown
<EngagementHook type="quote">
"The best time to start planning is 6 weeks before you need the service." — [Expert Name], [Credentials]
</EngagementHook>
```

**⚠️ Don't overuse:** Every 300-400 words = 4-5 hooks per article = AI-like pattern. Use only where genuinely valuable.

---

## Word Count Guidelines

| Type | Words | Purpose |
|------|-------|---------|
| Pillar | 2500-5000 | Comprehensive authority |
| Standard | 1000-1500 | Solid depth |
| Quick guide | 500-800 | Specific question |

---

## Term Definitions (Knowledge Graph Optimization)

Google extracts definitions for knowledge panels. LLMs use them for RAG responses. When introducing technical terms, provide clear definitions.

### Format

**[Term]** is [concise definition in 15-25 words].

**Examples:**

```markdown
**Monocrystalline solar panels** are photovoltaic panels made from single-crystal silicon, offering 18-22% efficiency—the highest among residential options.

**MCS certification** is the UK government-backed quality assurance scheme required for solar panel installers to qualify for incentives and warranties.

**Feed-in Tariff (FIT)** was a UK government scheme paying homeowners for solar electricity generated, replaced by the Smart Export Guarantee in 2019.
```

### Rules

- **First mention** of technical term = bold + definition
- **Definition length:** 15-25 words, self-contained
- **Avoid circular definitions:** "X is a type of X that..." (explains nothing)
- **Include key differentiator or metric:** efficiency %, year introduced, primary benefit
- **One definition per term:** Don't redefine the same term later

### When to Define

✅ **Always define:**
- Technical jargon (MCS, SAP, EPC ratings)
- Industry acronyms (ROI, kWh, kWp)
- Specialized equipment (inverters, optimizers)
- Regulatory terms (permitted development, building regs)

❌ **Don't define:**
- Common terms readers will know (solar panel, roof, electricity)
- Terms already defined earlier in article
- Self-evident phrases from context

---

## List Formatting Strategy (Scanability + LLM Extraction)

Lists improve scanability for humans and extraction for LLMs. Use strategically.

### Numbered Lists (Ranked/Sequential)

Use when **order matters:**

- **Step-by-step instructions:** "How to choose an installer"
- **Ranked comparisons:** "Top 5 cost factors"
- **Chronological sequences:** "Project timeline"
- **Priority order:** "Most important to least important"

**Example:**
```markdown
### How to Compare Solar Quotes

1. **Verify MCS certification** — Check installer's credentials first
2. **Compare kWp capacity** — Ensure quotes specify same system size
3. **Check panel brands** — Tier 1 brands cost more but last longer
4. **Review warranty terms** — Standard is 25 years panels, 10 years inverter
5. **Calculate cost per watt** — Divide total price by system kWp for fair comparison
```

### Bullet Lists (Unordered)

Use when **order doesn't matter:**

- **Features or benefits:** "What's included in the price"
- **Unranked options:** "Popular panel brands"
- **Examples:** "Common add-ons"
- **Checklists:** "Documents you'll need"

**Example:**
```markdown
### What's Included in Standard Installation

- Solar panels and mounting hardware
- Inverter and optimizers
- Electrical wiring and connection to consumer unit
- Scaffolding and safety equipment
- MCS certification paperwork
- Building control notification
```

### List Length Guidelines

- **Minimum:** 3 items (2 items = use prose instead)
- **Ideal:** 4-7 items (scannable at a glance)
- **Maximum:** 10 items (break into subsections if longer)

### Nested Lists

**Avoid nesting beyond 2 levels:**

✅ **Good (2 levels):**
```markdown
- Monocrystalline panels
  - Higher efficiency (18-22%)
  - Higher cost (£1.20-£1.50 per watt)
- Polycrystalline panels
  - Lower efficiency (15-17%)
  - Lower cost (£0.90-£1.20 per watt)
```

❌ **Bad (3 levels - confusing):**
```markdown
- Panel types
  - Monocrystalline
    - Standard efficiency
      - 18-20%
    - High efficiency
      - 21-22%
```

### List Item Length

- **Concise:** 10-20 words per item ideal
- **Maximum:** 30 words (if longer, consider subheadings instead)
- **Parallel structure:** Start each item same way (verb, noun, etc.)

**Example of parallel structure:**
```markdown
### Installation Process

- **Schedule survey** — Book roof assessment 4-6 weeks ahead
- **Review quote** — Compare at least 3 detailed quotes
- **Sign contract** — Lock in price with deposit (typically 10-20%)
- **Await installation** — Team arrives on scheduled day with equipment
- **Commission system** — Electrician tests and connects to grid
```
(Each starts with verb, maintains rhythm)

---

## Final Writing Checklist

Before moving to Phase 4:

**Human Voice (CRITICAL):**
- [ ] Read `references/human-voice.md` and apply guidelines
- [ ] Passed "The Human Test" (would someone know AI wrote this?)
- [ ] Paragraph variety (not answer-first for every paragraph)
- [ ] Component density reasonable (5-7 max for standard article)
- [ ] Natural transitions and phrasing

**Content Quality:**
- [ ] Answer-first used strategically (not universally)
- [ ] No forbidden phrases as filler
- [ ] Entity mentioned regularly and naturally
- [ ] All statistics have sources
- [ ] Tables used for complex comparisons (not every comparison)
- [ ] EngagementHooks used sparingly (0-2 per standard article)
- [ ] ExpertInsight used sparingly (1-2 per standard article)
- [ ] 2-4 internal links placed (first within 100 words)
- [ ] 3+ external links with proper context sentences
- [ ] No "vacuum" anchors (here, source, click here)
- [ ] Word count meets target
