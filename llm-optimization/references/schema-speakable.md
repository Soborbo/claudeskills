# Speakable Schema Implementation

## What is Speakable?

Speakable schema tells AI assistants which parts of your page are best for voice/text responses.

## Implementation

### Option 1: CSS Selector (Recommended)

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "House Removals Bristol | ABC Movers",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [
      ".page-summary",
      ".quick-facts",
      ".faq-answer",
      ".price-table"
    ]
  },
  "lastReviewed": "2025-01-15"
}
```

### Option 2: XPath

```json
{
  "speakable": {
    "@type": "SpeakableSpecification",
    "xpath": [
      "/html/body/article/p[1]",
      "/html/body/article/section[@class='faq']//dd"
    ]
  }
}
```

## Best Practices

### DO Mark as Speakable
- First paragraph (direct answer)
- Quick facts / summary box
- FAQ answers (not questions)
- Price/cost summaries
- Contact information
- Service descriptions (brief)

### DON'T Mark as Speakable
- Navigation elements
- Legal disclaimers
- Long paragraphs (>300 chars)
- Marketing fluff
- Calls to action
- Form fields

## Astro Component

```astro
---
interface Props {
  speakableSelectors: string[];
  lastReviewed: string;
}

const { speakableSelectors, lastReviewed } = Astro.props;
---

<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": speakableSelectors
  },
  "lastReviewed": lastReviewed
})} />
```

## Combined with FAQPage

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".lead", ".faq-answer"]
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How much does house removal cost in Bristol?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "House removal in Bristol costs £300-£1,200..."
          }
        }
      ]
    }
  ]
}
```
