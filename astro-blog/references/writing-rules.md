# Phase 3: Writing Rules

## Answer-First Paragraphs

Every paragraph's **first sentence** contains the key information. LLMs extract first sentences for RAG.

### The Pattern
```
[ANSWER: Key fact/claim] ← First sentence
[EVIDENCE: Supporting data]
[CONTEXT: Qualifications]
```

### Examples

❌ **Bad (context-first):**
"Many people wonder about service costs. This is a common question. The truth is, it depends on many factors. Generally speaking, you can expect to pay £500-£1,500."

✅ **Good (answer-first):**
"A typical service costs £800-£1,200 in the UK. This price includes standard deliverables and support. Factors like complexity and location can adjust this by ±30%."

### Forbidden Openings
- "Many people..."
- "It's important to note..."
- "In this section..."
- "When it comes to..."
- "Let's explore..."
- "As you may know..."

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

### Subject Position Rule
Main entity = grammatical subject.

❌ "Many homeowners choose professional services"
✅ "Professional services handle 80% of UK projects"

### First Sentence Check
After writing each H2 section, verify:
- Is the section's main entity the subject of the first sentence?

---

## Engagement Hooks

Insert every 300-400 words to maintain reader engagement.

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

- [ ] Every paragraph starts with key information
- [ ] No forbidden openings used
- [ ] Entity in subject position in section openers
- [ ] All statistics have sources
- [ ] Tables used for comparisons
- [ ] EngagementHooks every 300-400 words
- [ ] ExpertInsight at end of each H2 section
- [ ] 2-4 internal links placed (first within 100 words)
- [ ] 3+ external links with proper context sentences
- [ ] No "vacuum" anchors (here, source, click here)
- [ ] Word count meets target
