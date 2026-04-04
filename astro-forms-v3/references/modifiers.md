# Form Modifiers

**Note:** This is UI/layout reference. The astro-forms skill is primarily backend, but these patterns document how forms are typically presented across projects.

## Modifier Types

| Modifier | Use Case | Fields |
|----------|----------|--------|
| `default` | Full contact form | name, email, phone, message |
| `compact` | Sidebar, footer | name, email, phone |
| `inline` | Newsletter, exit intent | email only |
| `modal` | Popup/overlay | name, email, phone, message |
| `calculator-final` | Last step of a calculator | name, email, phone + quote summary |

## Modifier × Page Matrix

| Page Type | Recommended |
|-----------|-------------|
| Landing | default, compact |
| Service | default |
| Contact | default |
| Footer | compact, inline |
| Popup | modal |
| Calculator | calculator-final |

## Layout Patterns

### Default

Full-width stacked form. All fields visible.

### Compact

Reduced padding, smaller fields. Typically 3 fields (name, email, phone) + submit. Used in sidebars and footers where space is limited.

### Inline

Single horizontal row: email input + submit button. Used for newsletter signup and exit intent popups. Cookie consent handled by CookieYes banner.

### Modal

Uses native `<dialog>` element with `showModal()`. Triggered by CTA click, scroll threshold, or exit intent. Must include close button with `aria-label`.

### Calculator Final

Contact fields shown as the last step after the user has seen their quote/estimate. Includes a quote summary section above the contact fields. This modifier only handles the contact capture — calculator logic lives in the `lead-gen-calculator` skill.

## Common Field Variants

**Phone with country code:** Select for `+44`/`+36` prefix + phone input. Adapts to project locale.

**Postcode with autofill:** Postcode input triggers city autofill via `/api/postcode`. Client: `boilerplate/lib/postcode.ts`. Server endpoint: `boilerplate/lib/postcode-api.ts` (HU: static JSON map, UK: proxies postcodes.io). Wire as `src/pages/api/postcode.ts`: `export { GET } from '@/lib/forms/postcode-api';`

**Message with character counter:** Textarea with `maxlength="2000"` and live counter display.

## Required Elements on Every Form

Regardless of modifier, every form must include:

- Hidden `formId` field
- Hidden `sourcePage` field (current URL path)
- Hidden `honeypot` field (visually hidden, `tabindex="-1"`, `autocomplete="off"`)
- Turnstile widget (`<div class="cf-turnstile" ...>`)
- Submit button with descriptive text (not "Submit" — use "Get a quote", "Send enquiry" etc.)
