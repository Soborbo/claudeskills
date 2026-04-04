# Perplexity Optimization

## How Perplexity Works

Perplexity:
1. Real-time web crawling (PerplexityBot)
2. Academic and news source preference
3. Citation-heavy responses
4. Freshness is critical

## Key Differentiators

| Aspect | Perplexity Approach |
|--------|---------------------|
| Sources | Cites specific URLs in answers |
| Freshness | Real-time, prefers recent content |
| Authority | News, academic, official sources |
| Format | Prefers structured data |

## Getting Cited by Perplexity

### Content Requirements
- [ ] Unique data or statistics
- [ ] Original research/surveys
- [ ] Expert quotes with attribution
- [ ] Specific, verifiable claims
- [ ] Publication dates visible

### Technical Requirements
- [ ] PerplexityBot allowed
- [ ] Fast response times (<2s)
- [ ] Clean HTML structure
- [ ] No aggressive pop-ups
- [ ] Working canonical URLs

## High-Citation Content Types

1. **Original Data**
   - "Our 2024 survey of 500 Bristol residents found..."
   - "Based on 1,200 quotes we provided last year..."

2. **Expert Commentary**
   - "According to [Name], [Title] at [Company]..."
   - Include credentials and expertise

3. **Comprehensive Guides**
   - 2000+ words
   - Multiple sections
   - Tables and lists
   - External citations

4. **Local Statistics**
   - "Bristol removal costs average £X based on [source]"
   - "X% of Bristol residents prefer [thing]"

## Perplexity-Friendly Structure

```html
<article>
  <header>
    <h1>[Specific Title with Keywords]</h1>
    <p class="byline">By [Author Name], [Title]</p>
    <time datetime="2025-01-15">Updated: January 15, 2025</time>
  </header>

  <p class="summary">
    [Direct answer to the query in 2 sentences]
  </p>

  <section>
    <h2>Key Findings</h2>
    <ul>
      <li>[Specific fact with number]</li>
      <li>[Specific fact with number]</li>
    </ul>
  </section>

  <footer>
    <h3>Sources</h3>
    <ul>
      <li><a href="[url]">[Source Name]</a></li>
    </ul>
  </footer>
</article>
```
