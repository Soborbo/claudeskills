# CRO Dashboard Metrics

## Key Metrics Interface

```typescript
// Key metrics to track in CRO dashboard
interface CROMetrics {
  // Traffic
  sessions: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;

  // Engagement
  scrollDepth: { [key: string]: number }; // % reaching each depth
  timeOnPage: number;
  pagesPerSession: number;

  // Conversion Funnel
  landingPageViews: number;
  formStarts: number;
  formCompletions: number;
  conversionRate: number;

  // Form Analytics
  avgFormTime: number;
  fieldDropoffs: { [fieldName: string]: number };
  errorRates: { [fieldName: string]: number };

  // Qualitative
  exitIntentShown: number;
  exitIntentConverted: number;
  surveyResponses: { [answer: string]: number };
}
```

## Recommended Metrics to Monitor

### Traffic Metrics
- Sessions and unique visitors
- Bounce rate by page/source
- Average session duration

### Engagement Metrics
- Scroll depth percentages (25%, 50%, 75%, 100%)
- Time on page for key landing pages
- Pages per session

### Conversion Funnel Metrics
- Landing page views
- Form starts vs completions
- Overall conversion rate
- Drop-off points in funnel

### Form Analytics
- Average time to complete form
- Field-level drop-off rates
- Error rates per field
- Corrections/hesitations per field

### Qualitative Metrics
- Exit intent popup shows/conversions
- Survey response themes
- Session recording insights
- Heatmap click patterns
