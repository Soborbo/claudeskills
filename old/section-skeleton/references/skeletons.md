# Section Skeletons

Full Astro component code per section type.

## Hero

```astro
---
interface Props {
  class?: string;
}
const { class: className } = Astro.props;
---

<section class:list={["hero", className]}>
  <div class="container mx-auto px-4 py-12 md:py-20">
    <div class="grid md:grid-cols-2 gap-8 items-center">
      <div class="hero__content">
        <slot name="preheadline" />
        <slot name="headline" />  <!-- required, h1 -->
        <slot name="subheadline" />
        <div class="hero__cta mt-6 flex flex-wrap gap-4">
          <slot name="cta-primary" />
          <slot name="cta-secondary" />
        </div>
        <slot name="trust-badge" />
      </div>
      <div class="hero__media">
        <slot name="image" />  <!-- alt required -->
      </div>
    </div>
  </div>
</section>
```

**Slots:** preheadline, headline (req), subheadline, cta-primary, cta-secondary, trust-badge, image

## Trust Strip

```astro
---
interface Props {
  class?: string;
}
const { class: className } = Astro.props;
---

<section class:list={["trust-strip bg-primary-100", className]}>
  <div class="container mx-auto px-4 py-4">
    <ul class="flex flex-wrap justify-center md:justify-between gap-4 md:gap-8">
      <slot name="items" />
    </ul>
  </div>
</section>
```

**Slots:** items (repeated li)

## Problem

```astro
---
interface Props {
  class?: string;
}
const { class: className } = Astro.props;
---

<section class:list={["problem py-12 md:py-20", className]}>
  <div class="container mx-auto px-4">
    <div class="grid md:grid-cols-2 gap-8 items-center">
      <div class="problem__image">
        <slot name="image" />
      </div>
      <div class="problem__content">
        <slot name="headline" />  <!-- required, h2 -->
        <div class="problem__body mt-4 space-y-4">
          <slot name="body" />
        </div>
      </div>
    </div>
  </div>
</section>
```

**Slots:** image, headline (req), body

## Solution

```astro
---
interface Props {
  class?: string;
}
const { class: className } = Astro.props;
---

<section class:list={["solution py-12 md:py-20 bg-primary-50", className]}>
  <div class="container mx-auto px-4">
    <div class="max-w-3xl mx-auto text-center">
      <slot name="headline" />  <!-- required, h2 -->
      <div class="solution__body mt-4">
        <slot name="body" />
      </div>
      <div class="solution__cta mt-8">
        <slot name="cta" />
      </div>
    </div>
  </div>
</section>
```

**Slots:** headline (req), body, cta

## Benefits

```astro
---
interface Props {
  columns?: 2 | 3;
  class?: string;
}
const { columns = 3, class: className } = Astro.props;
---

<section class:list={["benefits py-12 md:py-20", className]}>
  <div class="container mx-auto px-4">
    <div class="text-center mb-12">
      <slot name="headline" />  <!-- required, h2 -->
      <slot name="subheadline" />
    </div>
    <div class:list={["grid gap-8", columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3"]}>
      <slot name="cards" />
    </div>
    <div class="benefits__cta mt-12 text-center">
      <slot name="cta" />
    </div>
  </div>
</section>
```

**Slots:** headline (req), subheadline, cards, cta
**Props:** columns (2|3)

## How It Works

```astro
---
interface Props {
  class?: string;
}
const { class: className } = Astro.props;
---

<section class:list={["how-it-works py-12 md:py-20 bg-primary-50", className]}>
  <div class="container mx-auto px-4">
    <div class="text-center mb-12">
      <slot name="headline" />  <!-- required, h2 -->
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <slot name="steps" />
    </div>
  </div>
</section>
```

**Slots:** headline (req), steps

## Social Proof

```astro
---
interface Props {
  class?: string;
}
const { class: className } = Astro.props;
---

<section class:list={["social-proof py-12 md:py-20", className]}>
  <div class="container mx-auto px-4">
    <div class="text-center mb-12">
      <slot name="headline" />  <!-- required, h2 -->
      <slot name="rating-summary" />
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <slot name="testimonials" />
    </div>
    <div class="social-proof__cta mt-12 text-center">
      <slot name="cta" />
    </div>
  </div>
</section>
```

**Slots:** headline (req), rating-summary, testimonials, cta

## FAQ

```astro
---
interface Props {
  class?: string;
}
const { class: className } = Astro.props;
---

<section class:list={["faq py-12 md:py-20 bg-primary-50", className]}>
  <div class="container mx-auto px-4">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-12">
        <slot name="headline" />  <!-- required, h2 -->
      </div>
      <div class="faq__accordion space-y-4">
        <slot name="items" />  <!-- aria-expanded required -->
      </div>
    </div>
  </div>
</section>
```

**Slots:** headline (req), items (aria-expanded)

## Final CTA

```astro
---
interface Props {
  class?: string;
}
const { class: className } = Astro.props;
---

<section class:list={["final-cta py-16 md:py-24 bg-primary-900 text-white", className]}>
  <div class="container mx-auto px-4">
    <div class="max-w-3xl mx-auto text-center">
      <slot name="headline" />  <!-- required, h2 -->
      <slot name="subheadline" />
      <div class="final-cta__actions mt-8 flex flex-wrap justify-center gap-4">
        <slot name="cta-primary" />
        <slot name="cta-phone" />
      </div>
      <div class="final-cta__trust mt-6">
        <slot name="guarantee" />
      </div>
    </div>
  </div>
</section>
```

**Slots:** headline (req), subheadline, cta-primary, cta-phone, guarantee

## Pricing

```astro
---
interface Props {
  columns?: 2 | 3;
  class?: string;
}
const { columns = 3, class: className } = Astro.props;
---

<section class:list={["pricing py-12 md:py-20", className]}>
  <div class="container mx-auto px-4">
    <div class="text-center mb-12">
      <slot name="headline" />  <!-- required, h2 -->
      <slot name="subheadline" />
    </div>
    <div class:list={["grid gap-8", columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3"]}>
      <slot name="pricing-cards" />
    </div>
    <div class="pricing__note mt-8 text-center">
      <slot name="disclaimer" />
    </div>
  </div>
</section>
```

**Slots:** headline (req), subheadline, pricing-cards, disclaimer

## Gallery

```astro
---
interface Props {
  columns?: 2 | 3 | 4;
  class?: string;
}
const { columns = 3, class: className } = Astro.props;
---

<section class:list={["gallery py-12 md:py-20 bg-primary-50", className]}>
  <div class="container mx-auto px-4">
    <div class="text-center mb-12">
      <slot name="headline" />  <!-- required, h2 -->
    </div>
    <div class:list={["grid gap-4", `md:grid-cols-${columns}`]}>
      <slot name="images" />  <!-- alt required per image -->
    </div>
  </div>
</section>
```

**Slots:** headline (req), images (alt required)

## Footer

```astro
---
interface Props {
  class?: string;
}
const { class: className } = Astro.props;
---

<footer class:list={["footer py-12 bg-primary-900 text-white", className]}>
  <div class="container mx-auto px-4">
    <div class="grid md:grid-cols-4 gap-8">
      <slot name="brand" />
      <slot name="links" />
      <slot name="contact" />
      <slot name="legal" />
    </div>
    <div class="footer__bottom mt-8 pt-8 border-t border-primary-700">
      <slot name="copyright" />
    </div>
  </div>
</footer>
```

**Slots:** brand, links, contact, legal, copyright

---

## Variant Modifiers

### Compact Variant

Removes: subheadline, cta-secondary, image (where optional)

### Expanded Variant

Requires: image, subheadline (both mandatory)

---

## Tailwind Patterns

| Element | Classes |
|---------|---------|
| Section padding | py-12 md:py-20 |
| Container | container mx-auto px-4 |
| Grid 2-col | grid md:grid-cols-2 gap-8 |
| Grid 3-col | grid md:grid-cols-3 gap-8 |
| Text center | text-center |
| CTA group | flex flex-wrap gap-4 |
| Background alt | bg-primary-50 / bg-primary-100 |
| Dark section | bg-primary-900 text-white |
