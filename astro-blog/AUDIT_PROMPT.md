# Astro Blog Audit Checklist

Run this checklist after creating blog content to verify compliance with the skill.

---

## 1. Human Voice Check (CRITICAL)

**Manual review required** - This cannot be automated.

### Read the article aloud:

- [ ] Would a human expert write it this way?
- [ ] Can you read 3 paragraphs without seeing a pattern?
- [ ] Do transitions feel natural or forced?
- [ ] Are components enhancing or interrupting?
- [ ] Does it sound like a person or a template?

### Component Density Count

```bash
# Count components in a blog post
POST="src/content/blog/your-post.md"

echo "Component Density Report:"
echo "========================"
echo -n "QueryAnswer: "; grep -c "<QueryAnswer" "$POST" || echo "0"
echo -n "TL;DR: "; grep -c "<TLDRBlock" "$POST" || echo "0"
echo -n "ExpertInsight: "; grep -c "<ExpertInsight" "$POST" || echo "0"
echo -n "EngagementHook: "; grep -c "<EngagementHook" "$POST" || echo "0"
echo -n "ExperienceBlock: "; grep -c "<ExperienceBlock" "$POST" || echo "0"
echo -n "CTABanner: "; grep -c "<CTABanner" "$POST" || echo "0"
echo ""
echo -n "TOTAL COMPONENTS: "
grep -cE "<(QueryAnswer|TLDRBlock|ExpertInsight|EngagementHook|ExperienceBlock|CTABanner)" "$POST" || echo "0"
echo ""
echo "Standard article (1000-1500w): Max 5-7 components"
echo "Pillar article (2500+w): Max 8-12 components"
```

**If component count is excessive (>7 for standard, >12 for pillar), article needs rewrite.**

### AI Pattern Detection

```bash
# Check for robotic answer-first pattern (first 3 words repeated)
POST="src/content/blog/your-post.md"

echo "First 3 words of each paragraph:"
grep -v "^#\|^<\|^-\|^$\|^\*\|^>" "$POST" | head -20 | awk '{print $1, $2, $3}'

# If you see the same 3-word pattern repeating, rewrite for variety
```

- [ ] NOT every paragraph starts answer-first
- [ ] Mix of narrative and answer-first styles
- [ ] No identical sentence structures repeated

---

## 2. Performance Validation (HARD-RULES)

### Build and Check Bundle Sizes

```bash
# Build the site
npm run build

# Check JS bundle size (must be < 100KB gzipped)
echo "JavaScript Bundle Sizes:"
find dist/_astro -name "*.js" -exec sh -c 'gzip -c "$1" | wc -c | awk "{printf \"%s: %d KB %s\n\", \"$1\", \$1/1024, (\$1/1024 > 100 ? \"❌ TOO LARGE\" : \"✅ OK\")}"' _ {} \;

# Check CSS bundle size (must be < 50KB gzipped)
echo ""
echo "CSS Bundle Sizes:"
find dist/_astro -name "*.css" -exec sh -c 'gzip -c "$1" | wc -c | awk "{printf \"%s: %d KB %s\n\", \"$1\", \$1/1024, (\$1/1024 > 50 ? \"❌ TOO LARGE\" : \"✅ OK\")}"' _ {} \;
```

**Acceptance criteria:**
- [ ] Total JS (gzipped) < 100KB
- [ ] Total CSS (gzipped) < 50KB

### Hydration Directive Check

```bash
# Check for forbidden client:load
echo "Checking for forbidden client:load directive..."
grep -r "client:load" src/content/blog src/components --include="*.{astro,md,mdx}" | wc -l

# Should return 0
```

```bash
# Verify proper hydration directives
echo "Interactive components using proper directives:"
grep -rE "client:(visible|idle|media)" src/components --include="*.astro"
```

- [ ] NO `client:load` found anywhere
- [ ] Interactive components use `client:visible` or `client:idle`

### Lighthouse Audit

**Run Lighthouse on published page:**

```bash
# Install Lighthouse CLI if not installed
# npm install -g lighthouse

# Run audit (replace URL with your blog post)
lighthouse https://example.com/blog/post-slug \
  --only-categories=performance,accessibility \
  --output=json \
  --output-path=./lighthouse-report.json

# Check scores
cat lighthouse-report.json | jq '.categories.performance.score * 100, .categories.accessibility.score * 100'
```

- [ ] PageSpeed Mobile ≥ 90
- [ ] PageSpeed Desktop ≥ 95
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] INP < 200ms
- [ ] Accessibility ≥ 90

---

## 3. Content Quality Checks

### H2 Quality Check

```bash
# Extract all H2 headings
POST="src/content/blog/your-post.md"
echo "H2 Headings:"
grep "^## " "$POST" | sed 's/^## //'

# Manual check: Are they specific questions or acceptable contextual headings?
```

**Forbidden H2s:**
```bash
# Check for forbidden vague H2s
grep -E "^## (Overview|Introduction|Details|Things to Know|More Information|Summary)" "$POST"

# Should return empty
```

- [ ] No "Overview", "Introduction", "Details" headers
- [ ] Prefer specific questions
- [ ] Contextual headings acceptable when natural

### External Links Validation

```bash
# Count external links
POST="src/content/blog/your-post.md"
echo -n "External link count: "
grep -oE 'https?://[^)]+' "$POST" | grep -v "example.com" | wc -l

# Minimum: 3 (citation + authority + reputation)
```

```bash
# Check for missing rel attributes
echo "External links missing rel attributes:"
grep -E 'href="http' "$POST" | grep -v 'rel="' || echo "✅ All links have rel attributes"

# Should return "All links have rel attributes"
```

```bash
# Check for vacuum anchors (click here, source, etc.)
echo "Checking for vacuum anchors..."
grep -iE '\[(here|click here|source|website|link|read more)\]' "$POST" || echo "✅ No vacuum anchors found"

# Should return "No vacuum anchors found"
```

- [ ] ≥3 external links total
- [ ] All external links have `rel="noopener noreferrer"`
- [ ] Affiliate links have `rel="noopener noreferrer nofollow sponsored"`
- [ ] No "here", "source", "click here" anchor text
- [ ] Each link has context sentence

### Internal Links Validation

```bash
# Count internal links
POST="src/content/blog/your-post.md"
echo -n "Internal link count: "
grep -oE '\[.*\]\(/[^)]+\)' "$POST" | wc -l

# Standard: 2-4, Pillar: 8-12
```

```bash
# Check first link position (should be within first 100 words)
POST="src/content/blog/your-post.md"
FIRST_100=$(sed -n '/^---/,/^---/!p' "$POST" | head -c 600)  # ~100 words
echo "$FIRST_100" | grep -E '\[.*\]\(/' && echo "✅ First link within 100 words" || echo "❌ No link in first 100 words"
```

- [ ] 2-4 internal links (standard) or 8-12 (pillar)
- [ ] First link within first 100 words
- [ ] No "click here" anchor text

### Statistics Source Check

```bash
# Find numbers/percentages without nearby sources
POST="src/content/blog/your-post.md"
echo "Checking statistics for sources..."
grep -E '[0-9]+%|£[0-9]|[0-9]+ (customers|homeowners|projects)' "$POST" | head -10

# Manual check: Does each stat have a cited source nearby?
```

- [ ] Every statistic has a source
- [ ] No "Studies show..." without citation
- [ ] No invented percentages

---

## 4. TypeScript & Code Quality

### TypeScript Strict Mode Check

```bash
# Verify strict mode enabled
grep -q '"strict": true' tsconfig.json && echo "✅ Strict mode enabled" || echo "❌ Strict mode NOT enabled"
```

### Check for Forbidden Patterns

```bash
# Check for 'any' types
echo "Checking for 'any' types..."
grep -rE ': any\b|<any>|any\[' src/components --include="*.{ts,tsx,astro}" || echo "✅ No 'any' types found"

# Check for @ts-ignore without issue links
echo "Checking for @ts-ignore without GitHub issue..."
grep -rE '@ts-ignore' src/components --include="*.{ts,tsx,astro}" | grep -v 'github.com/.*issues' || echo "✅ No improper @ts-ignore found"

# Check for generic variable names
echo "Checking for generic variable names..."
grep -rE '\b(data|result|item|temp|info|response)\b\s*=' src/components --include="*.{ts,tsx}" | head -5
```

- [ ] TypeScript strict mode enabled
- [ ] NO `any` types
- [ ] NO `@ts-ignore` without issue link
- [ ] NO generic variable names (data, result, temp, etc.)

### Component Props Interfaces

```bash
# Check all components have Props interface
echo "Components without Props interface:"
find src/components -name "*.astro" -exec sh -c 'grep -L "interface Props" "$1" && echo "$1"' _ {} \;

# Should return empty (all components should have Props)
```

- [ ] All components have `interface Props`

---

## 5. Accessibility Checks

### ARIA Attributes for Components

```bash
# Check for components missing ARIA labels
POST="src/content/blog/your-post.md"

echo "Checking ARIA attributes..."

# ExpertInsight
grep "<ExpertInsight" "$POST" | grep -v 'role="complementary"' && echo "❌ ExpertInsight missing role" || echo "✅ ExpertInsight has role"

# ExperienceBlock
grep "<ExperienceBlock" "$POST" | grep -v 'role="complementary"' && echo "❌ ExperienceBlock missing role" || echo "✅ ExperienceBlock has role"

# InternalLinks
grep "<InternalLinks" "$POST" | grep -v 'role="navigation"' && echo "❌ InternalLinks missing role" || echo "✅ InternalLinks has role"
```

### Alt Text Check

```bash
# Check for images missing alt text
POST="src/content/blog/your-post.md"
echo "Checking image alt text..."
grep -E '!\[.*\]\(' "$POST" | grep -E '!\[\]' && echo "❌ Found images with empty alt" || echo "✅ All images have alt text"

# Check for generic alt text
grep -iE 'alt="(image|photo|picture)"' "$POST" && echo "❌ Generic alt text found" || echo "✅ No generic alt text"
```

- [ ] All images have descriptive alt text
- [ ] No "image", "photo", "picture" alt text
- [ ] Components have proper ARIA roles and labels

### Skip-to-Content Link

```bash
# Check for skip link (should be in layout, not blog post)
grep -r "skip-to-content\|skip-link" src/layouts --include="*.astro" || echo "❌ No skip-to-content link found"
```

- [ ] Skip-to-content link present in layout

### Reduced Motion

```bash
# Check for prefers-reduced-motion support
grep -r "prefers-reduced-motion" src/styles --include="*.css" || echo "⚠️  No reduced-motion styles found"
```

- [ ] `prefers-reduced-motion` respected

---

## 6. Security Checks

### CSP Headers for Embeds

```bash
# Check if CSP is configured for embeds
grep -r "Content-Security-Policy" astro.config.mjs || echo "⚠️  No CSP headers configured"
```

- [ ] CSP headers configured if using embeds

### Iframe Sandbox Attributes

```bash
# Check iframes have sandbox attribute
POST="src/content/blog/your-post.md"
grep "<iframe" "$POST" | grep -v 'sandbox=' && echo "❌ iframe missing sandbox" || echo "✅ All iframes have sandbox"
```

- [ ] All iframes have `sandbox` attribute
- [ ] No sensitive data in client-side code

---

## 7. Frontmatter Validation

```bash
# Extract and validate frontmatter
POST="src/content/blog/your-post.md"

echo "Frontmatter Check:"
echo "=================="

# Required fields
for field in title description pubDate intent topic primaryCTA category author entities; do
  grep -q "^$field:" "$POST" && echo "✅ $field" || echo "❌ MISSING: $field"
done

# Check title length (max 60 chars)
TITLE_LEN=$(grep "^title:" "$POST" | sed 's/title: //' | tr -d '"' | wc -c)
[ "$TITLE_LEN" -le 61 ] && echo "✅ Title length: $((TITLE_LEN - 1)) chars" || echo "❌ Title too long: $((TITLE_LEN - 1)) chars (max 60)"

# Check description length (max 160 chars)
DESC_LEN=$(grep "^description:" "$POST" | sed 's/description: //' | tr -d '"' | wc -c)
[ "$DESC_LEN" -le 161 ] && echo "✅ Description length: $((DESC_LEN - 1)) chars" || echo "❌ Description too long: $((DESC_LEN - 1)) chars (max 160)"

# Check entities array (5-10 items)
ENTITIES=$(grep -A 10 "^entities:" "$POST" | grep -c "  - ")
echo "Entities count: $ENTITIES (target: 5-10)"
```

- [ ] All required frontmatter fields present
- [ ] Title ≤ 60 characters
- [ ] Description ≤ 160 characters
- [ ] Entities array has 5-10 items
- [ ] Intent matches CTA type

---

## 8. Schema Validation

### Check Schema Markup

```bash
# After build, test schema with Google Rich Results
# Visit: https://search.google.com/test/rich-results

# Or use schema validator
POST_URL="https://example.com/blog/post-slug"
echo "Test schema at: https://search.google.com/test/rich-results?url=$POST_URL"
```

- [ ] @graph JSON-LD block present
- [ ] @id references correct
- [ ] Speakable targets QueryAnswer/TL;DR
- [ ] Author schema includes `sameAs` links
- [ ] No schema errors in Google Rich Results Test

---

## 9. Word Count & Structure

```bash
# Count words (excluding frontmatter and HTML tags)
POST="src/content/blog/your-post.md"
WORD_COUNT=$(sed -n '/^---/,/^---/!p' "$POST" | sed 's/<[^>]*>//g' | wc -w)

echo "Word count: $WORD_COUNT"
echo "Target: 500+ (standard), 2500+ (pillar)"

# Check if TL;DR present for >1000 words
if [ "$WORD_COUNT" -gt 1000 ]; then
  grep -q "<TLDRBlock" "$POST" && echo "✅ TL;DR present" || echo "❌ TL;DR required for >1000 words"
fi
```

- [ ] Word count ≥ 500 (standard) or ≥ 2500 (pillar)
- [ ] TL;DR present if > 1000 words
- [ ] QueryAnswer block present

---

## 10. AI Hallucination Check (CRITICAL)

### ExperienceBlock Verification

```bash
# Flag unverified experience blocks
POST="src/content/blog/your-post.md"

# Check experienceVerified flag in frontmatter
grep -q "experienceVerified: true" "$POST" && echo "✅ Experience verified" || echo "⚠️  Experience NOT verified - manual check required"

# List all ExperienceBlocks
echo ""
echo "ExperienceBlock instances found:"
grep -n "<ExperienceBlock" "$POST"
```

**Manual verification required:**
- [ ] All numbers in ExperienceBlock are real (from CRM/records)
- [ ] No invented client names or case studies
- [ ] All statistics have verifiable sources
- [ ] `experienceVerified: true` in frontmatter (only after human check)

---

## Quick Pass/Fail Summary

| Check | Status |
|-------|--------|
| **Human voice (manual review)** | ☐ |
| Component density within limits | ☐ |
| Performance: JS < 100KB, CSS < 50KB | ☐ |
| Lighthouse ≥90 mobile, ≥95 desktop | ☐ |
| NO `client:load` directives | ☐ |
| H2s are specific or contextual (not generic) | ☐ |
| External links ≥3 with proper rel attrs | ☐ |
| Internal links present (first within 100w) | ☐ |
| All statistics have sources | ☐ |
| TypeScript strict mode, no `any` | ☐ |
| All components have Props interface | ☐ |
| ARIA labels on components | ☐ |
| All images have descriptive alt text | ☐ |
| Skip-to-content link present | ☐ |
| CSP headers configured (if embeds) | ☐ |
| All frontmatter fields present | ☐ |
| Schema markup valid | ☐ |
| Word count meets target | ☐ |
| TL;DR present if >1000 words | ☐ |
| **Experience data verified (manual)** | ☐ |

---

## If Audit Fails

1. Identify which check(s) failed
2. Refer to the specific phase reference file:
   - Human voice issues → `references/human-voice.md`
   - Writing issues → `references/writing-rules.md`
   - Structure issues → `references/content-structure.md`
   - Technical issues → `references/technical.md`
3. Fix according to guidelines
4. Re-run failed checks
5. Full audit must pass before deployment

---

## Automated Audit Script

Save this as `audit-blog-post.sh`:

```bash
#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./audit-blog-post.sh src/content/blog/your-post.md"
  exit 1
fi

POST="$1"

if [ ! -f "$POST" ]; then
  echo "Error: File not found: $POST"
  exit 1
fi

echo "========================================="
echo "  Astro Blog Post Audit"
echo "========================================="
echo "File: $POST"
echo ""

# Component density
echo "1. COMPONENT DENSITY"
echo "--------------------"
COMPONENTS=$(grep -cE "<(QueryAnswer|TLDRBlock|ExpertInsight|EngagementHook|ExperienceBlock|CTABanner)" "$POST" || echo "0")
echo "Total components: $COMPONENTS"
echo "Standard max: 7, Pillar max: 12"
[ "$COMPONENTS" -le 7 ] && echo "✅ PASS" || echo "⚠️  CHECK if pillar"
echo ""

# H2 quality
echo "2. H2 HEADINGS"
echo "--------------------"
grep "^## " "$POST" | sed 's/^## /  - /'
VAGUE_H2=$(grep -cE "^## (Overview|Introduction|Details|Things to Know|More Information)" "$POST" || echo "0")
[ "$VAGUE_H2" -eq 0 ] && echo "✅ No forbidden H2s" || echo "❌ FAIL: Found $VAGUE_H2 vague H2(s)"
echo ""

# External links
echo "3. EXTERNAL LINKS"
echo "--------------------"
EXT_LINKS=$(grep -oE 'https?://[^)]+' "$POST" | grep -v "example.com" | wc -l || echo "0")
echo "External links: $EXT_LINKS (min 3)"
[ "$EXT_LINKS" -ge 3 ] && echo "✅ PASS" || echo "❌ FAIL"

# Check rel attributes
MISSING_REL=$(grep -cE 'href="http' "$POST" | grep -v 'rel="' || echo "0")
[ "$MISSING_REL" -eq 0 ] && echo "✅ All have rel attributes" || echo "❌ $MISSING_REL links missing rel"

# Vacuum anchors
VACUUM=$(grep -ciE '\[(here|click here|source|website|link|read more)\]' "$POST" || echo "0")
[ "$VACUUM" -eq 0 ] && echo "✅ No vacuum anchors" || echo "❌ FAIL: Found $VACUUM vacuum anchor(s)"
echo ""

# Frontmatter
echo "4. FRONTMATTER"
echo "--------------------"
for field in title description pubDate intent topic primaryCTA category author entities; do
  grep -q "^$field:" "$POST" && echo "  ✅ $field" || echo "  ❌ $field"
done
echo ""

# Word count
echo "5. WORD COUNT"
echo "--------------------"
WORDS=$(sed -n '/^---/,/^---/!p' "$POST" | sed 's/<[^>]*>//g' | wc -w || echo "0")
echo "Words: $WORDS (min 500 standard, 2500 pillar)"
[ "$WORDS" -ge 500 ] && echo "✅ PASS" || echo "❌ FAIL"

# TL;DR check
if [ "$WORDS" -gt 1000 ]; then
  grep -q "<TLDRBlock" "$POST" && echo "✅ TL;DR present" || echo "❌ TL;DR required"
fi
echo ""

# Experience verification
echo "6. EXPERIENCE VERIFICATION"
echo "--------------------"
grep -q "experienceVerified: true" "$POST" && echo "✅ Verified" || echo "⚠️  NOT verified - manual check needed"
echo ""

# Hydration check
echo "7. HYDRATION DIRECTIVES"
echo "--------------------"
CLIENT_LOAD=$(grep -c "client:load" "$POST" || echo "0")
[ "$CLIENT_LOAD" -eq 0 ] && echo "✅ No client:load found" || echo "❌ FAIL: Found $CLIENT_LOAD client:load"
echo ""

echo "========================================="
echo "  Audit Complete"
echo "========================================="
echo ""
echo "⚠️  MANUAL CHECKS STILL REQUIRED:"
echo "  - Human voice review (read aloud)"
echo "  - Lighthouse performance audit"
echo "  - TypeScript strict compliance"
echo "  - Accessibility manual testing"
echo "  - Experience data verification"
echo ""
```

Make executable:
```bash
chmod +x audit-blog-post.sh
```

Run:
```bash
./audit-blog-post.sh src/content/blog/your-post.md
```
