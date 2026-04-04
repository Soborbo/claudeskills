# Performance Budgets

## Lighthouse CI Budget File

```javascript
// budget.json - Lighthouse CI budget file
[
  {
    "path": "/*",
    "timings": [
      { "metric": "first-contentful-paint", "budget": 1800 },
      { "metric": "largest-contentful-paint", "budget": 2500 },
      { "metric": "interactive", "budget": 3800 },
      { "metric": "total-blocking-time", "budget": 200 },
      { "metric": "cumulative-layout-shift", "budget": 0.1 },
      { "metric": "speed-index", "budget": 3400 }
    ],
    "resourceSizes": [
      { "resourceType": "document", "budget": 50 },
      { "resourceType": "script", "budget": 200 },
      { "resourceType": "stylesheet", "budget": 50 },
      { "resourceType": "image", "budget": 500 },
      { "resourceType": "font", "budget": 100 },
      { "resourceType": "total", "budget": 800 }
    ],
    "resourceCounts": [
      { "resourceType": "script", "budget": 10 },
      { "resourceType": "stylesheet", "budget": 3 },
      { "resourceType": "font", "budget": 4 },
      { "resourceType": "third-party", "budget": 5 }
    ]
  },
  {
    "path": "/",
    "timings": [
      { "metric": "largest-contentful-paint", "budget": 2000 }
    ]
  }
]
```

## Bundle Size Monitoring Script

```javascript
// scripts/bundle-stats.js
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { globSync } from 'glob';
import { gzipSync } from 'zlib';

const BUDGET = {
  js: 200 * 1024,      // 200KB
  css: 50 * 1024,      // 50KB
  total: 800 * 1024    // 800KB
};

function getFileSize(filePath) {
  const content = readFileSync(filePath);
  return {
    raw: content.length,
    gzip: gzipSync(content).length
  };
}

function analyzeBundles() {
  const jsFiles = globSync('dist/**/*.js');
  const cssFiles = globSync('dist/**/*.css');

  let totalJs = 0;
  let totalCss = 0;

  console.log('\n📦 Bundle Analysis\n');
  console.log('JavaScript:');
  jsFiles.forEach(file => {
    const size = getFileSize(file);
    totalJs += size.gzip;
    console.log(`  ${file}: ${(size.gzip / 1024).toFixed(2)}KB (gzip)`);
  });

  console.log('\nCSS:');
  cssFiles.forEach(file => {
    const size = getFileSize(file);
    totalCss += size.gzip;
    console.log(`  ${file}: ${(size.gzip / 1024).toFixed(2)}KB (gzip)`);
  });

  console.log('\n📊 Summary:');
  console.log(`  Total JS: ${(totalJs / 1024).toFixed(2)}KB / ${(BUDGET.js / 1024)}KB budget`);
  console.log(`  Total CSS: ${(totalCss / 1024).toFixed(2)}KB / ${(BUDGET.css / 1024)}KB budget`);
  console.log(`  Total: ${((totalJs + totalCss) / 1024).toFixed(2)}KB / ${(BUDGET.total / 1024)}KB budget`);

  // Check budgets
  const errors = [];
  if (totalJs > BUDGET.js) errors.push(`JS over budget by ${((totalJs - BUDGET.js) / 1024).toFixed(2)}KB`);
  if (totalCss > BUDGET.css) errors.push(`CSS over budget by ${((totalCss - BUDGET.css) / 1024).toFixed(2)}KB`);

  if (errors.length > 0) {
    console.log('\n❌ Budget exceeded:');
    errors.forEach(e => console.log(`  - ${e}`));
    process.exit(1);
  }

  console.log('\n✅ All budgets passed!');

  // Save for comparison
  const stats = {
    timestamp: new Date().toISOString(),
    js: totalJs,
    css: totalCss,
    total: totalJs + totalCss
  };

  writeFileSync('.bundle-stats.json', JSON.stringify(stats, null, 2));
}

analyzeBundles();
```

## Bundle Size CI Check

```yaml
# Add to .github/workflows/lighthouse.yml
      - name: Build and analyze bundle
        run: |
          npm run build
          node scripts/bundle-stats.js

      - name: Compare bundle size
        run: |
          if [ -f ".bundle-stats-main.json" ]; then
            node scripts/compare-bundles.js
          fi
```
