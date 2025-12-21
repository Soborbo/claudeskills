# FAQ and HowTo Schemas

## FAQPage Schema

```astro
---
// src/components/schema/FAQSchema.astro
interface FAQ {
  question: string;
  answer: string;
}

interface Props {
  faqs: FAQ[];
}

const { faqs } = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

## FAQ Component with Schema

```astro
---
import FAQSchema from './schema/FAQSchema.astro';

interface Props {
  faqs: { question: string; answer: string }[];
}

const { faqs } = Astro.props;
---

<section class="faq-section">
  <h2>Frequently Asked Questions</h2>

  <div class="faq-list">
    {faqs.map((faq, index) => (
      <details class="faq-item">
        <summary class="faq-question">{faq.question}</summary>
        <div class="faq-answer" set:html={faq.answer} />
      </details>
    ))}
  </div>
</section>

<FAQSchema faqs={faqs} />
```

## HowTo Schema

```astro
---
// src/components/schema/HowToSchema.astro
interface Step {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

interface Props {
  name: string;
  description: string;
  steps: Step[];
  totalTime?: string; // ISO 8601 duration, e.g., "PT30M"
  estimatedCost?: {
    currency: string;
    value: string;
  };
  image?: string;
}

const props = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": props.name,
  "description": props.description,
  ...(props.totalTime && { "totalTime": props.totalTime }),
  ...(props.estimatedCost && {
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": props.estimatedCost.currency,
      "value": props.estimatedCost.value
    }
  }),
  ...(props.image && { "image": props.image }),
  "step": props.steps.map((step, index) => ({
    "@type": "HowToStep",
    "position": index + 1,
    "name": step.name,
    "text": step.text,
    ...(step.image && { "image": step.image }),
    ...(step.url && { "url": step.url })
  }))
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```
