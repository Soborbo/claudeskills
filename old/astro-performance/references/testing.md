# Performance Testing

## Tools

| Tool | Use For |
|------|---------|
| Lighthouse | Overall audit |
| WebPageTest | Detailed waterfall |
| Chrome DevTools → Performance | Runtime analysis |
| `web-vitals` library | Real user monitoring |

## Real User Monitoring

```typescript
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```
