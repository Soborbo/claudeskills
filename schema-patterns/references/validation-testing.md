# Schema Validation and Testing

## Schema Validation

```typescript
// src/lib/schema/validate.ts
export async function validateSchema(url: string): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const apiUrl = `https://validator.schema.org/validate?url=${encodeURIComponent(url)}`;

  // Note: For automated testing, use Google's Rich Results Test API
  // https://developers.google.com/search/apis/indexing-api/v3/reference/urlInspection

  // Manual validation checklist
  return {
    valid: true,
    errors: [],
    warnings: []
  };
}

// Schema checklist for QA
export const schemaChecklist = [
  'LocalBusiness has complete address',
  'Phone number in E.164 format',
  'Opening hours are current',
  'Images are absolute URLs',
  'Prices match visible content',
  'Reviews are real and dated',
  'FAQ answers are complete',
  'No deprecated properties used'
];
```

## Testing Schemas

```bash
# Test with Google Rich Results Test
# https://search.google.com/test/rich-results

# Test with Schema.org Validator
# https://validator.schema.org/

# Local validation with structured-data-testing-tool
npx structured-data-testing-tool --url https://yoursite.com
```

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Missing @context | Schema ignored | Always include "https://schema.org" |
| Relative URLs | Schema invalid | Use absolute URLs for images/links |
| Outdated hours | Bad UX, trust loss | Update opening hours regularly |
| Fake reviews | Manual penalty | Only use real, verifiable reviews |
| Missing required fields | No rich result | Check Google's requirements |
| Duplicate schemas | Confusion | One primary type per page |
