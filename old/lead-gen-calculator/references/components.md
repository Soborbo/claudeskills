# Calculator Components

## Directory Structure

```
src/calculator/components/
├── RadioCard.astro        # Single-select option
├── ChecklistCard.astro    # Multi-select option
├── DropdownSelect.astro   # Dropdown menu
├── ProgressBar.astro      # Step progress
├── StickyMobileCTA.astro  # Mobile continue button
├── Toast.astro            # Submit feedback
├── LoadingSkeleton.astro  # Loading state
└── PriceBreakdown.astro   # Result pricing
```

## RadioCard

Single-select option with image and auto-advance.

```astro
---
interface Props {
  name: string;
  value: string;
  label: string;
  image?: string;
  checked?: boolean;
}
const { name, value, label, image, checked } = Astro.props;
---

<label class="radio-card" data-auto-advance="200">
  <input type="radio" name={name} value={value} checked={checked} />
  {image && <img src={image} alt="" class="aspect-square object-cover" />}
  <span class="label">{label}</span>
</label>

<style>
  .radio-card {
    @apply flex flex-col items-center p-4 rounded-lg cursor-pointer
           bg-primary-100 hover:bg-primary-200 transition-colors;
  }
  .radio-card:has(input:checked) {
    @apply bg-primary-900 text-white;
  }
  input { @apply sr-only; }
</style>
```

## ChecklistCard

Multi-select with "Next" button when all selected.

```astro
---
interface Props {
  name: string;
  options: Array<{ value: string; label: string; image?: string }>;
}
const { name, options } = Astro.props;
---

<div class="checklist" data-min-select="1">
  {options.map(opt => (
    <label class="checkbox-card">
      <input type="checkbox" name={name} value={opt.value} />
      {opt.image && <img src={opt.image} alt="" />}
      <span>{opt.label}</span>
    </label>
  ))}
</div>
```

## ProgressBar

Step indicator at top.

```astro
---
interface Props {
  current: number;
  total: number;
}
const { current, total } = Astro.props;
const percent = (current / total) * 100;
---

<div class="progress-bar">
  <div class="progress-fill" style={`width: ${percent}%`}></div>
  <span class="progress-text">{current} / {total}</span>
</div>
```

## StickyMobileCTA

Mobile-only continue button for checkbox steps.

```astro
---
interface Props {
  label?: string;
}
const { label = 'Tovább' } = Astro.props;
---

<div class="sticky-cta md:hidden">
  <button type="button" class="btn-primary w-full" data-next-step>
    {label}
  </button>
</div>

<style>
  .sticky-cta {
    @apply fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg;
  }
</style>
```

## LoadingSkeleton

Loading state during navigation.

```astro
<div class="loading-skeleton animate-pulse">
  <div class="h-8 bg-primary-100 rounded w-3/4 mb-4"></div>
  <div class="grid grid-cols-2 gap-4">
    <div class="aspect-square bg-primary-100 rounded"></div>
    <div class="aspect-square bg-primary-100 rounded"></div>
  </div>
</div>
```

## Visual Rules

| Element | Rule |
|---------|------|
| Images | 1:1 aspect ratio always |
| Selected card | bg-primary-900 + white text |
| Unselected | bg-primary-100 |
| Hover | bg-primary-200 |
| Progress | Top of page, subtle |
