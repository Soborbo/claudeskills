# Google Gemini Optimization

## How Gemini Works

Gemini uses:
1. Google Search index (primary)
2. Google-Extended crawler
3. Knowledge Graph entities
4. E-E-A-T signals heavily

## Key Differences from ChatGPT

| Aspect | ChatGPT | Gemini |
|--------|---------|--------|
| Index | Bing | Google |
| E-E-A-T weight | Medium | High |
| Local signals | Basic | Strong (GMB) |
| Freshness | Important | Very important |
| Schema reliance | High | Very high |

## Google Business Profile Integration

Gemini pulls heavily from Google Business Profile:
- Business name (exact match to website)
- Reviews and ratings
- Q&A section
- Posts and updates
- Service descriptions

**CRITICAL:** Website entity name must EXACTLY match GBP name.

## Optimization Checklist

### Entity Consistency
- [ ] Business name identical on website and GBP
- [ ] Address format identical
- [ ] Phone number format identical
- [ ] Service names consistent

### Schema Requirements
- [ ] LocalBusiness with @id
- [ ] sameAs links to GBP, social profiles
- [ ] aggregateRating from reviews
- [ ] Service schemas linked to LocalBusiness
- [ ] Organization schema on about page

### Content for Gemini
- [ ] "People Also Ask" questions answered on page
- [ ] Location + service pages (not just generic)
- [ ] Updated dates in ISO format
- [ ] Author expertise signals

## Gemini-Specific Schema

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://example.com/#business",
  "name": "Bristol House Removals",
  "sameAs": [
    "https://www.google.com/maps?cid=XXXXX",
    "https://facebook.com/bristolremovals",
    "https://linkedin.com/company/bristolremovals"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "270"
  }
}
```
