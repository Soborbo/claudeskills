# Competitive Edge Tactics

32 advanced local SEO tactics. Implementation priority at bottom.

---

## GBP TACTICS

### #2. GBP Insights KPIs

| Metric | Healthy | Warning | FAIL |
|--------|---------|---------|------|
| Profile views/mo | 500+ | 100-500 | <100 |
| Direction requests | 20+ | 5-20 | <5 |
| Calls from GBP | 10+ | 3-10 | <3 |
| Website clicks | 50+ | 10-50 | <10 |

### #3. Review Justifications

```yaml
prompt: "Please mention what stood out (speed, friendliness...)"
target_words: ["fast", "professional", "on time", "careful"]
```
Google shows: *"Mentioned in reviews: fast service"*

### #7. Category Hacking

```yaml
primary: "Moving Company"
secondary: ["Packaging Service", "Storage Facility", "Junk Removal Service", "Furniture Store"]
```
Use all 9 slots. Check competitors, add what they missed.

### #10. Post Strategy

| Week | Type | Example |
|------|------|---------|
| 1 | Job | "Just completed 3-bed move in Clifton" |
| 2 | Offer | "10% off midweek moves" |
| 3 | Review | Screenshot of 5-star |
| 4 | Team | Photo of crew |

### #11. Q&A Seeding

Ask from friend's account, answer officially:
- "What areas do you cover?" → Full list + links
- "How much does a 2-bed move cost?" → Price range + calculator link
- "Are you insured?" → Confirmation + details

### #19. GBP Attributes

Enable all relevant: "Women-owned", "LGBTQ+ friendly", "Online estimates", "Onsite services". These appear as filters.

### #24. Service-Specific Links

```yaml
"House Removals" → /services/house-removals  # NOT homepage
"Office Removals" → /services/office-removals
```

### #32. Description Loading (750 chars)

```
[Primary keyword + location] → [Secondary services] → [USP] → [Trust signal] → [CTA]
```

---

## PHOTO & MEDIA

### #1. Photo Geo-tagging

```yaml
exif_location: required
filename: "[service]-[area]-[number].jpg"
alt: "[Service] in [Area] - [description]"
```
Tools: GeoImgr, ExifTool

---

## REVIEWS

### #8. Sentiment Mining

Extract from your reviews:
```yaml
mentioned_10x: ["on time", "careful", "friendly"]
```
Use in: hero copy, meta descriptions, GBP description, ads.

### #9. Competitor Weakness Mining

```yaml
their_negatives: ["late", "damaged", "rude"]
your_messaging: ["Always on time — or next move free", "Fully insured"]
```

### #23. Recency Stacking

```yaml
bad: 5 reviews one week, then 2 months nothing
good: 1 review/week, continuously
```
Stagger requests, never batch.

### #30. Platform Diversification

```yaml
primary: Google (80%)
secondary: Facebook (10%), Trustpilot (5%), Industry (5%)
display: "4.9★ Google | 4.8★ Trustpilot | 5★ Facebook"
```

---

## COMPETITOR INTEL

### #25. GBP Monitoring (Weekly)

Check: New reviews, photos, posts, categories, services, Q&A.
Action: They got 5 reviews → you need 6.

### #21. Backlink Gap Analysis

1. Export competitor backlinks (Ahrefs/Semrush)
2. Filter to local domains
3. Match their citations, pitch same publications

---

## AREA STRATEGY

### #4. Hyperlocal vs City

| Site Size | Strategy |
|-----------|----------|
| Small (5pg) | City only: "/areas/bristol" |
| Medium (15pg) | + Major areas: "/areas/clifton" |
| Large (30+pg) | + Postcodes: "/areas/bs6" |

Don't go hyperlocal until city pages rank.

### #27. Postcode Clustering

```yaml
clusters:
  - name: "North Bristol"
    postcodes: [BS6, BS7, BS9, BS10]
    page: "/areas/north-bristol"
```
Cluster first → dominate → then expand.

### #13. Service Area Polygon

- Max 20 areas in GBP
- Remove areas with 0 leads in 6 months
- Optimal radius: trades 15-20mi, removals 30-50mi

---

## CONTENT

### #14. "Near Me" Injection

**Never H1/H2.** Use in:
- FAQ: "Looking for removals near me? We cover..."
- Schema: areaServed
- CTA: "Find removals near you"

### #26. PAA Hijacking

Search target keyword → note "People Also Ask" → add exact questions to FAQ with schema.

### #31. GBP Search Query Insights

Check: GBP → Insights → Search queries
- "cheap removals bristol" → Target with value messaging
- "removals jobs bristol" → Wrong intent, ignore

---

## TECHNICAL

### #6. Click-to-Call Tracking

```javascript
gtag('event', 'click_to_call', {
  'event_category': 'contact',
  'event_label': page_location
});
```

### #12. UTM for GBP

```
https://domain.com/?utm_source=google&utm_medium=gbp&utm_campaign=local
```

### #16. Mobile-First Checks

| Check | Pass | Fail |
|-------|------|------|
| Phone | `<a href="tel:">` | Plain text |
| Address | Links to Maps | Plain text |
| Form | Above fold | Hidden |
| Load | <3s on 4G | >3s |

### #22. Response Time

- GBP messages: <1 hour
- Forms: <30 minutes
- Auto-responder: "We'll reply within 30 minutes"

### #28. Time-of-Day Optimization

Peak times (from GBP Insights):
- Monday 8-10am: Phone MUST be answered
- Saturday 10am-2pm: Research mode
GBP posts: Schedule for Monday 7am.

### #29. Schema Stacking

```yaml
homepage: [LocalBusiness, AggregateRating, FAQPage, Service]
service: [Service, AggregateRating, FAQPage, BreadcrumbList]
area: [Service+areaServed, AggregateRating, FAQPage]
```

---

## LINKS & PR

### #5. Local Link Opportunities

| Type | Value |
|------|-------|
| Charity sponsor | Link + trust |
| Event sponsor | Link + visibility |
| Local news mention | High authority |

Target: 1 local link/quarter.

### #18. PR Pitches

| Angle | Example |
|-------|---------|
| Milestone | "Completes 1000th move" |
| Data | "Friday = most popular moving day" |
| Quirky | "Strangest items we've moved" |

---

## VOICE & SEASONAL

### #17. Voice Search

Target conversational questions in FAQ:
- "Hey Google, find removals near me"
- Answer: first 40 words = concise, then expand

### #15. Seasonal Boost

| Month | Post | Offer |
|-------|------|-------|
| Jan | "New year, new home?" | 10% off |
| Jun-Aug | "Summer moving rush" | Book early |
| Dec | "Before Christmas" | Last slots |

---

## SCALING

### #20. Multi-Location

```yaml
rules:
  - Separate GBP per location
  - Unique phone per location
  - Location-specific landing page
fail: Same phone for 2 locations
```

---

## IMPLEMENTATION PRIORITY

**Phase 1 (Week 1-2):** #2, #6, #12, #16, #22
**Phase 2 (Week 3-4):** #1, #7, #10, #11, #32
**Phase 3 (Month 2):** #4, #14, #26, #27, #29
**Phase 4 (Month 3+):** #8, #9, #21, #25, #3
**Phase 5 (Ongoing):** #5, #18, #15, #17, #23
