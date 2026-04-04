# Number and Date Formatting

Use `Intl` API for locale-aware formatting.

## Formatter Functions

```typescript
// src/i18n/formatters.ts
import type { Lang } from './config';
import { languages } from './config';

export function formatNumber(lang: Lang, value: number): string {
  return new Intl.NumberFormat(languages[lang].code).format(value);
}

export function formatCurrency(
  lang: Lang,
  value: number,
  currency = 'GBP'
): string {
  return new Intl.NumberFormat(languages[lang].code, {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatDate(lang: Lang, date: Date): string {
  return new Intl.DateTimeFormat(languages[lang].code, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatRelativeTime(lang: Lang, date: Date): string {
  const rtf = new Intl.RelativeTimeFormat(languages[lang].code, {
    numeric: 'auto',
  });

  const diff = date.getTime() - Date.now();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (Math.abs(days) < 1) {
    const hours = Math.round(diff / (1000 * 60 * 60));
    return rtf.format(hours, 'hour');
  }
  if (Math.abs(days) < 30) {
    return rtf.format(days, 'day');
  }
  const months = Math.round(days / 30);
  return rtf.format(months, 'month');
}
```

## Usage Examples

```astro
---
import { formatNumber, formatCurrency, formatDate } from '@/i18n/formatters';
const lang = getLangFromUrl(Astro.url);
---

<p>Price: {formatCurrency(lang, 1299.99, 'EUR')}</p>
<!-- en: £1,299.99 -->
<!-- de: 1.299,99 € -->

<p>Downloads: {formatNumber(lang, 1000000)}</p>
<!-- en: 1,000,000 -->
<!-- de: 1.000.000 -->

<p>Published: {formatDate(lang, new Date('2024-01-15'))}</p>
<!-- en: 15 January 2024 -->
<!-- de: 15. Januar 2024 -->
```

## Currency by Market

```typescript
const currencyByLang: Record<Lang, string> = {
  en: 'GBP',
  de: 'EUR',
  fr: 'EUR',
};

formatCurrency(lang, price, currencyByLang[lang]);
```
