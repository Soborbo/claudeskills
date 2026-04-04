# Trust Elements Schema

## Full Schema

```yaml
trust_elements:
  social_proof:
    review_platform: Google | Trustpilot | Facebook | Yelp | none
    rating: 4.8  # or not_found: true
    review_count: 250  # or not_found: true
    displayed_prominently: true | false
    widget_type: badge | carousel | static | none
    
  credentials:
    - type: membership | insurance | certification | award
      name: "BAR" | "Which? Trusted" | "ISO 9001"
      displayed: badge | text | footer_only
    # OR
    credentials:
      not_found: true
      
  guarantees:
    - type: money-back | price-match | satisfaction | damage
      specifics: "Exact guarantee text"
    # OR
    guarantees:
      not_found: true
      
  experience_claims:
    years: 20  # or not_found: true
    jobs_completed: "5000+"  # exact text or not_found: true
    
  trust_strip:
    present: true | false
    items:
      - "✓ Fully Insured"
      - "✓ No Hidden Fees"
      - "✓ 4.9★ Rated"
    # OR
    items:
      not_found: true
      
  team_visibility:
    founder_shown: true | false
    founder_name: "John Smith"  # or not_found: true
    team_photos: true | false
    personal_story: true | false
```

## Credential Types

| Type | Examples |
|------|----------|
| membership | BAR, FMB, Checkatrade, TrustATrader |
| insurance | Public liability, Goods in transit |
| certification | ISO 9001, Safe Contractor |
| award | Which? Trusted, Local business award |

## Display Classification

| Display | Meaning |
|---------|---------|
| badge | Visual logo/badge prominently shown |
| text | Mentioned in text but no visual |
| footer_only | Only in footer, not prominent |

## Example Output

```yaml
trust_elements:
  social_proof:
    review_platform: Google
    rating: 4.9
    review_count: 270
    displayed_prominently: true
    widget_type: badge
    
  credentials:
    - type: membership
      name: "BAR"
      displayed: badge
    - type: insurance
      name: "£1m public liability"
      displayed: text
      
  guarantees:
    - type: price-match
      specifics: "Beat any like-for-like quote"
    - type: damage
      specifics: "Full compensation for any damage"
      
  experience_claims:
    years: 25
    jobs_completed: "10,000+"
    
  trust_strip:
    present: true
    items:
      - "✓ Fully Insured"
      - "✓ No Hidden Fees"
      - "✓ 4.9★ Google Rating"
      - "✓ Family Run Since 1998"
      
  team_visibility:
    founder_shown: true
    founder_name: "Mike Johnson"
    team_photos: true
    personal_story: true
```
