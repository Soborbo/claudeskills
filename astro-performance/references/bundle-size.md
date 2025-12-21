# Bundle Size Optimization

## Target Budgets

| Asset Type | Budget |
|------------|--------|
| Total JS | <100KB (gzipped) |
| Total CSS | <50KB (gzipped) |
| Hero image | <200KB |
| Any single image | <100KB |

## Analyze Bundle

```bash
# Add to package.json
"scripts": {
  "analyze": "astro build && npx source-map-explorer dist/**/*.js"
}
```

## Tree Shaking

```typescript
// ✅ Import only what you need
import { formatDate } from 'date-fns';

// ❌ Imports entire library
import * as dateFns from 'date-fns';
```

## Dynamic Imports

```astro
---
// Only load on pages that need it
const Calculator = await import('../components/Calculator.astro');
---
```
