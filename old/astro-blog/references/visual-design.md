# Visual Design Guidelines

## Design Philosophy

Clean, professional, trust-building design that prioritizes readability and conversion. No decorative fluff — every element serves a purpose.

---

## Color System

### Primary Palette

```css
:root {
  /* Primary - Trust Blue */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  
  /* Secondary - Professional Dark */
  --secondary-800: #1e293b;
  --secondary-900: #0f172a;
  
  /* Accent - Success Green (for trust signals) */
  --accent-green-50: #f0fdf4;
  --accent-green-500: #22c55e;
  --accent-green-600: #16a34a;
  
  /* Warning/Highlight - Amber */
  --accent-amber-50: #fffbeb;
  --accent-amber-400: #fbbf24;
  --accent-amber-500: #f59e0b;
  
  /* Neutral */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-900: #111827;
}
```

### Usage Rules

| Element | Color | Usage |
|---------|-------|-------|
| Primary CTA | `primary-600` | Buttons, links |
| Headings | `secondary-900` | H1, H2, H3 |
| Body text | `gray-600` | Paragraphs |
| Backgrounds | `gray-50` | Cards, sections |
| Trust signals | `accent-green-500` | Badges, checkmarks |
| Highlights | `accent-amber-50` | TL;DR, tips |
| Borders | `gray-200` | Cards, dividers |

---

## Typography

### Font Stack

```css
:root {
  --font-heading: 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 2.5rem (40px) | 700 | 1.2 |
| H2 | 1.75rem (28px) | 600 | 1.3 |
| H3 | 1.25rem (20px) | 600 | 1.4 |
| Body | 1.125rem (18px) | 400 | 1.65 |
| Small | 0.875rem (14px) | 400 | 1.5 |
| Caption | 0.75rem (12px) | 500 | 1.4 |

### Prose Constraints

```css
.prose {
  max-width: 65ch;
  font-size: 1.125rem;
  line-height: 1.65;
}

.prose p {
  margin-bottom: 1.5em;
}

.prose h2 {
  margin-top: 2.5em;
  margin-bottom: 0.75em;
}
```

---

## Component Designs

### QueryAnswer Block

Primary answer component — high visibility, above the fold.

```css
.query-answer {
  background: linear-gradient(135deg, var(--primary-50) 0%, white 100%);
  border-left: 4px solid var(--primary-500);
  border-radius: 0 12px 12px 0;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.query-answer p {
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--gray-900);
}

.query-answer strong {
  color: var(--primary-700);
}
```

**Visual:**
```
┌────────────────────────────────────────────┐
│▌                                           │
│▌  UK [service] costs range from            │
│▌  **£X for basic** to **£Y+ for premium**. │
│▌                                           │
└────────────────────────────────────────────┘
  ↑ 4px primary-500 border
```

---

### TL;DR Block

Summary block — amber highlight for scannability.

```css
.tldr-block {
  background: var(--accent-amber-50);
  border-left: 4px solid var(--accent-amber-400);
  border-radius: 0 12px 12px 0;
  padding: 1.25rem 1.5rem;
  margin: 1.5rem 0;
}

.tldr-block .title {
  font-weight: 700;
  color: var(--accent-amber-800);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.tldr-block ul {
  margin: 0;
  padding-left: 1.25rem;
}

.tldr-block li {
  margin-bottom: 0.5rem;
  color: var(--gray-700);
}
```

**Visual:**
```
┌────────────────────────────────────────────┐
│▌  KEY TAKEAWAYS                            │
│▌                                           │
│▌  • Average cost for standard: £X-£Y       │
│▌  • Book 4-6 weeks ahead for best rates    │
│▌  • Off-peak timing saves 10-15%           │
│▌                                           │
└────────────────────────────────────────────┘
  ↑ amber-400 border    amber-50 background
```

---

### EngagementHook Variants

#### Stat Hook
```css
.hook-stat {
  background: var(--primary-50);
  border: 1px solid var(--primary-100);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.hook-stat .icon {
  font-size: 1.5rem;
}

.hook-stat strong {
  color: var(--primary-700);
}
```

#### Tip Hook
```css
.hook-tip {
  background: var(--accent-green-50);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 1rem 1.25rem;
}

.hook-tip .label {
  color: var(--accent-green-600);
  font-weight: 600;
  font-size: 0.875rem;
}
```

#### Question Hook
```css
.hook-question {
  background: var(--accent-amber-50);
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 1rem 1.25rem;
}
```

**Visual Reference:**
```
┌─ STAT ─────────────────────────────────────┐
│ 📊  **Did you know?** 73% of customers     │
│     underestimate project costs by 20-30%. │
└────────────────────────────────────────────┘
          primary-50 bg, primary-100 border

┌─ TIP ──────────────────────────────────────┐
│ 💡  **Pro tip:** Book 4-6 weeks ahead      │
│     for the best rates and availability.   │
└────────────────────────────────────────────┘
          green-50 bg, green border

┌─ QUESTION ─────────────────────────────────┐
│ ❓  **Ask yourself:** Have you compared    │
│     at least 3 different providers?        │
└────────────────────────────────────────────┘
          amber-50 bg, amber border
```

---

### ExpertInsight Component

Simplified pro tip with just author photo. Name/role only shown once at article top.

```css
.expert-insight {
  background: linear-gradient(135deg, var(--gray-50) 0%, white 100%);
  border: 2px solid var(--primary-100);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  margin: 2rem 0;
}

.expert-insight__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.expert-insight__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-200);
}

.expert-insight__label {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary-600);
  background: var(--primary-50);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.expert-insight__content {
  margin: 0;
  padding: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--gray-700);
  font-style: normal;
}
```

**Visual:**
```
┌────────────────────────────────────────────┐
│                                            │
│  ┌────┐  ┌──────────┐                      │
│  │ 👤 │  │ PRO TIP  │                      │
│  └────┘  └──────────┘                      │
│                                            │
│  "Always ask for the supervisor's direct   │
│   number before the job starts. If         │
│   anything goes wrong, you want to reach   │
│   decision-makers, not a call center."     │
│                                            │
└────────────────────────────────────────────┘
    primary-100 border, compact layout
```

**Tailwind Implementation:**
```html
<aside class="bg-gradient-to-br from-gray-50 to-white border-2 border-primary-100 rounded-2xl p-5 my-8">
  <div class="flex items-center gap-3 mb-3">
    <img src="..." alt="" class="w-12 h-12 rounded-full object-cover border-2 border-primary-200" aria-hidden="true" />
    <span class="text-sm font-bold uppercase tracking-wide text-primary-600 bg-primary-50 px-3 py-1 rounded">Pro Tip</span>
  </div>
  <p class="text-gray-700 leading-relaxed m-0">
    "Always ask for the supervisor's direct number..."
  </p>
</aside>
```

---

### ExperienceBlock (E-E-A-T)

Trust-building proof of experience.

```css
.experience-block {
  background: white;
  border: 2px solid var(--accent-green-200);
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
}

.experience-block::before {
  content: "✓ VERIFIED EXPERIENCE";
  position: absolute;
  top: -0.75rem;
  left: 1rem;
  background: var(--accent-green-500);
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.experience-block .title {
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 0.75rem;
}

.experience-block .data {
  background: var(--gray-50);
  border-radius: 8px;
  padding: 1rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
}
```

**Visual:**
```
        ┌ ✓ VERIFIED EXPERIENCE ┐
┌───────┴───────────────────────────────────┐
│                                           │
│  **Real Client Example:**                 │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ Project: [Type]                     │  │
│  │ Client: [Anonymized]                │  │
│  │                                     │  │
│  │ Total: £X,XXX                       │  │
│  │ • Service A: £XXX                   │  │
│  │ • Service B: £XXX                   │  │
│  │ • Add-ons: £XXX                     │  │
│  └─────────────────────────────────────┘  │
│                                           │
└───────────────────────────────────────────┘
    green border + verified badge
```

---

### Trust Badges

```css
.trust-badges {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  background: var(--gray-50);
  border-radius: 12px;
  border: 1px solid var(--gray-200);
}

.trust-badges .label {
  font-size: 0.75rem;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.trust-badges img {
  height: 2.5rem;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.trust-badges img:hover {
  opacity: 1;
}
```

**Visual:**
```
┌────────────────────────────────────────────┐
│  VERIFIED BY:                              │
│                                            │
│  [BAR Logo]  [Which? Logo]  [Checkatrade]  │
│                                            │
└────────────────────────────────────────────┘
```

---

### CTA Banner

```css
.cta-banner {
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  color: white;
}

.cta-banner h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.cta-banner p {
  opacity: 0.9;
  margin-bottom: 1.5rem;
}

.cta-banner .btn {
  display: inline-block;
  background: white;
  color: var(--primary-700);
  font-weight: 600;
  padding: 0.875rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cta-banner .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

**Visual:**
```
┌────────────────────────────────────────────┐
│                                            │
│         Ready to Get Started?              │
│                                            │
│    Get an instant quote tailored to        │
│    your specific needs.                    │
│                                            │
│         ┌──────────────────┐               │
│         │  Get Free Quote  │               │
│         └──────────────────┘               │
│                                            │
└────────────────────────────────────────────┘
    Gradient primary-600 → primary-700
```

---

### Author Card

```css
.author-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--gray-50);
  border-radius: 16px;
  border: 1px solid var(--gray-200);
}

.author-card .avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  object-fit: cover;
}

.author-card .name {
  font-weight: 700;
  color: var(--gray-900);
}

.author-card .role {
  font-size: 0.875rem;
  color: var(--primary-600);
  margin-bottom: 0.5rem;
}

.author-card .credentials {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.author-card .credential {
  font-size: 0.75rem;
  background: var(--accent-green-50);
  color: var(--accent-green-700);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.author-card .bio {
  font-size: 0.875rem;
  color: var(--gray-600);
  line-height: 1.5;
}
```

**Visual:**
```
┌────────────────────────────────────────────┐
│  ┌────┐                                    │
│  │    │  John Smith                        │
│  │ 👤 │  Senior Moving Consultant          │
│  │    │                                    │
│  └────┘  ┌──────────┐ ┌────────────────┐   │
│          │BAR Cert. │ │15+ Years Exp.  │   │
│          └──────────┘ └────────────────┘   │
│                                            │
│  Expert in residential moves with over     │
│  1,200 successful relocations completed.   │
│                                            │
│  🔗 LinkedIn  🔗 Verify Credentials        │
│                                            │
└────────────────────────────────────────────┘
```

---

### Comparison Table

```css
.comparison-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--gray-200);
}

.comparison-table th {
  background: var(--gray-900);
  color: white;
  font-weight: 600;
  padding: 1rem;
  text-align: left;
}

.comparison-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--gray-100);
}

.comparison-table tr:nth-child(even) {
  background: var(--gray-50);
}

.comparison-table tr:last-child td {
  border-bottom: none;
}

.comparison-table .highlight {
  background: var(--accent-green-50);
  font-weight: 600;
}

.comparison-table .winner {
  color: var(--accent-green-600);
}

.comparison-table .winner::before {
  content: "✓ ";
}
```

**Visual:**
```
┌─────────────┬─────────────┬─────────────┐
│   Factor    │     DIY     │Professional │
├─────────────┼─────────────┼─────────────┤
│ Cost        │ £100-£300   │ £500-£1,500 │
├─────────────┼─────────────┼─────────────┤
│ Time        │ 1-2 days    │ ✓ 4-6 hours │
├─────────────┼─────────────┼─────────────┤
│ Risk        │ High        │ ✓ Low       │
├─────────────┼─────────────┼─────────────┤
│ Best for    │ Students    │ Families    │
└─────────────┴─────────────┴─────────────┘
```

---

### Internal Links Block

```css
.internal-links {
  background: var(--gray-50);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin: 2rem 0;
}

.internal-links .title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 0.75rem;
}

.internal-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.internal-links li {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--gray-200);
}

.internal-links li:last-child {
  border-bottom: none;
}

.internal-links a {
  color: var(--primary-600);
  text-decoration: none;
  font-weight: 500;
}

.internal-links a:hover {
  text-decoration: underline;
}

.internal-links .description {
  font-size: 0.875rem;
  color: var(--gray-500);
}
```

---

## Spacing System

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

### Component Spacing

| Between | Spacing |
|---------|---------|
| Paragraphs | `space-6` (24px) |
| H2 sections | `space-10` (40px) top |
| Components (hooks, CTAs) | `space-8` (32px) |
| List items | `space-2` (8px) |
| Card padding | `space-6` (24px) |

---

## Shadows

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --shadow-card: 0 2px 8px rgba(0,0,0,0.08);
  --shadow-card-hover: 0 8px 24px rgba(0,0,0,0.12);
}
```

---

## Border Radius

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

| Element | Radius |
|---------|--------|
| Buttons | `radius-md` |
| Cards | `radius-xl` |
| Badges | `radius-sm` |
| Avatars | `radius-full` |
| Input fields | `radius-md` |

---

## Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Typography Scaling

| Element | Mobile | Desktop |
|---------|--------|---------|
| H1 | 2rem | 2.5rem |
| H2 | 1.5rem | 1.75rem |
| Body | 1rem | 1.125rem |

---

## Accessibility

### Color Contrast
- Body text on white: minimum 4.5:1
- Large text (H1, H2): minimum 3:1
- Interactive elements: minimum 4.5:1

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### ARIA Requirements for Complex Components

#### ExpertInsight
```html
<aside 
  class="expert-insight" 
  role="complementary"
  aria-label="Expert tip from John Smith"
>
  <blockquote>
    <!-- tip content -->
  </blockquote>
</aside>
```

#### ExperienceBlock
```html
<aside 
  class="experience-block" 
  role="complementary"
  aria-labelledby="exp-title-{id}"
>
  <span id="exp-title-{id}" class="sr-only">Verified experience example</span>
  <div class="verified-badge" aria-label="Verified first-hand experience">
    ✓ VERIFIED EXPERIENCE
  </div>
  <!-- content -->
</aside>
```

#### InternalLinks Block
```html
<nav 
  class="internal-links" 
  role="navigation" 
  aria-labelledby="related-links-{id}"
>
  <h3 id="related-links-{id}">Related Resources</h3>
  <ul role="list">
    <li><a href="...">Link text</a></li>
  </ul>
</nav>
```

#### TrustBadges
```html
<aside 
  class="trust-badges" 
  role="complementary"
  aria-label="Verification and accreditation badges"
>
  <a href="..." aria-label="Verify BAR membership (opens in new tab)">
    <img src="..." alt="Industry Association member badge" />
  </a>
</aside>
```

#### EngagementHook
```html
<aside 
  class="hook-stat" 
  role="note"
  aria-label="Key statistic"
>
  <!-- content -->
</aside>
```

#### Comparison Tables
```html
<table role="table" aria-label="Comparison of Option A vs Option B">
  <thead>
    <tr>
      <th scope="col">Factor</th>
      <th scope="col">DIY</th>
      <th scope="col">Professional</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Cost</th>
      <td>£100-£300</td>
      <td>£500-£1,500</td>
    </tr>
  </tbody>
</table>
```

### Screen Reader Only Text
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Required ARIA Checklist

| Component | Role | aria-label/labelledby | Notes |
|-----------|------|----------------------|-------|
| ExperienceBlock | complementary | labelledby | Links to title |
| InternalLinks | navigation | labelledby | Describe as related resources |
| TrustBadges | complementary | label | Describe purpose |
| EngagementHook | note | label | Describe hook type |
| Comparison Table | table | label | Describe what's compared |
| CTA Banner | region | labelledby | Links to heading |
```
