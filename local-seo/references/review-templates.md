# Review Request Templates

## Review Velocity Rules

| Metric | Minimum | FAIL State |
|--------|---------|------------|
| Total reviews | 10 | <10 |
| Monthly new | 1 | 0 in 30 days |
| Response rate | 100% | Any unresponded |
| Average rating | 4.0+ | <4.0 |

**30+ day review gap = LOCAL FAIL STATE.**

## Direct Review Link

```
https://search.google.com/local/writereview?placeid=[PLACE_ID]
```

Get Place ID: [Google Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)

## Email Templates

### Standard Request (3 Days After Service)

```
Subject: How did we do? (60 seconds)

Hi [Name],

Thanks for choosing [Business Name]!

If you were happy with our service, we'd really appreciate 
a quick Google review. It only takes 60 seconds:

👉 [DIRECT REVIEW LINK]

Your feedback helps other customers find us.

Thanks so much!
[Your Name]
```

### Reminder (7 Days, No Response)

```
Subject: Quick favour? 🙏

Hi [Name],

Hope you're settled in after your move!

If you have 60 seconds, a Google review would really help us:

👉 [DIRECT REVIEW LINK]

No pressure – but it means a lot to small businesses like ours.

Thanks,
[Your Name]
```

### SMS Template

```
Hi [Name]! Thanks for choosing [Business]. If you're happy, 
a quick Google review helps us a lot: [SHORT LINK]
```

## Review Collection Methods

| Method | Timing | Response Rate |
|--------|--------|---------------|
| Email | 3 days after | 10-15% |
| SMS | Same day | 15-20% |
| QR code | At completion | 5-10% |
| In-person ask | At completion | 30%+ |

**Best: In-person ask + follow-up email.**

## Response Templates

### 5-Star Review

```
Thank you so much for the lovely review, [Name]! We really 
enjoyed helping with your move and are thrilled you're happy. 
We look forward to helping you again in the future!
```

### 4-Star Review

```
Thanks for the great feedback, [Name]! We're glad the move 
went well. If there's anything we could have done better, 
we'd love to hear – always looking to improve!
```

### 3-Star or Below

```
Hi [Name], thank you for your honest feedback. We're sorry 
your experience wasn't perfect. We take this seriously and 
would like to make it right. Please contact us at [email] 
so we can discuss this directly.
```

**Rule: ALWAYS respond within 24 hours.**

## QR Code Strategy

| Placement | When |
|-----------|------|
| Invoice/receipt | After payment |
| Business card | At completion |
| Van wrap | Always visible |
| Follow-up email | As backup |

## Review Monitoring

| Task | Frequency |
|------|-----------|
| Check new reviews | Daily |
| Respond to reviews | Within 24h |
| Track review count | Weekly |
| Calculate velocity | Monthly |

## FAIL Prevention

| Risk | Prevention |
|------|------------|
| No reviews in 30 days | Automated email sequence |
| Negative review | Respond + offline resolution |
| Low rating average | Improve service + ask happy customers |

## Review Tracking Template

```yaml
reviews:
  total: 24
  average: 4.8
  last_review: 2024-01-15
  days_since: 5
  status: PASS
  
  monthly_velocity:
    - { month: "Jan", count: 3 }
    - { month: "Dec", count: 2 }
    - { month: "Nov", count: 4 }
```
