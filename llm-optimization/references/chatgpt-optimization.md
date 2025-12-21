# ChatGPT Optimization

## How ChatGPT Search Works

ChatGPT uses:
1. Bing index (primary)
2. Direct crawling (OAI-SearchBot, ChatGPT-User)
3. Schema.org structured data
4. Content freshness signals

## Optimization Checklist

### Technical
- [ ] OAI-SearchBot allowed in robots.txt
- [ ] ChatGPT-User allowed in robots.txt
- [ ] Server responds < 3 seconds
- [ ] Content in HTML (not JS-rendered)
- [ ] Mobile-responsive

### Content
- [ ] Direct answers in first 2 sentences
- [ ] Specific numbers and facts (not vague claims)
- [ ] Updated dates visible
- [ ] Author/business attribution
- [ ] Outbound links to authoritative sources

### Schema Priority
1. LocalBusiness (with all properties)
2. FAQPage (5+ questions)
3. HowTo (for process pages)
4. Service (linked to LocalBusiness)
5. Speakable (for key content sections)

## Content That Gets Cited

ChatGPT prefers:
- Listicles with clear rankings
- Comparison tables
- Step-by-step guides
- FAQ with specific answers
- Price/cost breakdowns
- Local service + area pages

## Example: High-Citation Content

```markdown
## How Much Does House Removal Cost in Bristol?

House removal in Bristol costs **£300-£1,200** depending on:

| Home Size | Average Cost | Duration |
|-----------|--------------|----------|
| 1 bed flat | £300-£450 | 2-3 hours |
| 2 bed house | £450-£650 | 3-4 hours |
| 3 bed house | £650-£900 | 4-6 hours |
| 4+ bed house | £900-£1,200 | 6-8 hours |

*Prices based on Bristol average, January 2025. Includes 2-person team and van.*
```

This format:
- Answers question immediately
- Provides specific numbers
- Uses table (LLM-extractable)
- Cites source/date
