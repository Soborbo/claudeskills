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
