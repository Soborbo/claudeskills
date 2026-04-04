# Performance Testing

## Lighthouse CLI (Primary Tool)

**Always test locally with multiple runs. Lighthouse scores fluctuate ±10–15 points.**

### Single page test:
```bash
lighthouse https://example.com \
  --only-categories=performance \
  --preset=perf \
  --form-factor=mobile \
  --output=json --output=html \
  --output-path=./lh-homepage \
  --chrome-flags="--headless"
```

### Batch test (median of 5 runs):
```bash
for i in 1 2 3 4 5; do
  lighthouse https://example.com \
    --only-categories=performance --preset=perf --form-factor=mobile \
    --output=json --output-path="./lh-run-$i.json" --chrome-flags="--headless"
  score=$(cat "lh-run-$i.json" | node -e "process.stdin.on('data',d=>console.log(Math.round(JSON.parse(d).categories.performance.score*100)))")
  echo "Run $i: $score"
done
# Take the MEDIAN (3rd value when sorted), not the best or worst
```

### Multi-page test:
```bash
urls=(
  "https://example.com/"
  "https://example.com/about/"
  "https://example.com/services/"
  "https://example.com/reviews/"
  "https://example.com/area/clifton/"
)
for url in "${urls[@]}"; do
  name=$(echo "$url" | sed 's|https://[^/]*/||;s|/|-|g;s|-$||')
  [ -z "$name" ] && name="homepage"
  lighthouse "$url" --only-categories=performance --preset=perf \
    --form-factor=mobile --output=json \
    --output-path="./lh-${name}.json" --chrome-flags="--headless"
  score=$(cat "lh-${name}.json" | node -e "process.stdin.on('data',d=>console.log(Math.round(JSON.parse(d).categories.performance.score*100)))")
  echo "$name: $score"
done
```

## Which Pages to Test

**Don't only test the homepage.** Test at minimum:

| Page Type | Why |
|-----------|-----|
| Homepage | Primary landing page, usually best optimized |
| Longest service page | Most content = largest HTML = slowest parse |
| Area/location page | Template-generated, may have different components |
| Reviews page | Many DOM elements (review cards, SVG logos) |
| Calculator/interactive | JS-heavy, INP matters here |

## Score Interpretation

| Score | Action |
|-------|--------|
| 90–100 | Green — passed. Minor optimizations only. |
| 80–89 | Orange — usually acceptable. Check LCP specifically. |
| 70–79 | Orange — action needed. Likely a missing preload or large image. |
| 50–69 | Red — critical. Something is fundamentally wrong (blocked render, huge image, no preload). |
| <50 | Red — likely a crash-level issue (infinite loop, massive DOM, broken asset). |

**If the same page scores 65 and 92 on consecutive runs:** this is Lighthouse variability, not a code problem. Take the median of 3+ runs.

## Tools

| Tool | Use For |
|------|---------| 
| **Lighthouse CLI** | Primary testing, batch runs, CI/CD |
| **PageSpeed Insights** | Quick check with real-user data (if available) |
| **Chrome DevTools → Performance** | Runtime analysis, identify long tasks |
| **Chrome DevTools → Network** | Verify which image variant loads on mobile |
| **web-vitals library** | Real user monitoring in production |
| **WebPageTest** | Detailed waterfall, filmstrip comparison |

## Real User Monitoring

```typescript
import { onLCP, onINP, onCLS } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics endpoint
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    url: window.location.href,
  });
  navigator.sendBeacon('/api/vitals', body);
}

onLCP(sendToAnalytics);
onINP(sendToAnalytics);
onCLS(sendToAnalytics);
```

## CI/CD Integration

```bash
# In CI pipeline: fail if any page scores below 80
lighthouse https://example.com \
  --only-categories=performance --preset=perf --form-factor=mobile \
  --output=json --output-path=./lh.json --chrome-flags="--headless --no-sandbox"

score=$(cat lh.json | node -e "process.stdin.on('data',d=>console.log(Math.round(JSON.parse(d).categories.performance.score*100)))")
if [ "$score" -lt 80 ]; then
  echo "FAIL: Lighthouse score $score < 80"
  exit 1
fi
```
