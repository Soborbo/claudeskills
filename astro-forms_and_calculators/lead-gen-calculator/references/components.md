# Components Reference

All components are Astro components. Ask before adding external UI libraries.

## Layout Rules

- **No menu** on calculator pages
- **No CTA buttons** except step navigation
- **Vertical + horizontal centering** for questions (viewport > 768px)
- **No description** under question title

## Visual Rules

- **Option images**: Always 1:1 aspect ratio
- **Image cards**: Primary brand color background, white text underneath
- **Social proof**: Different, relevant element under EVERY step

## RadioCard

Single-select option with 1:1 image. Auto-advances on click.

**Visual rules:**
- Image: always 1:1 aspect ratio
- Background: primary brand color
- Text: white, underneath image
- No description text

```astro
---
// src/calculator/components/RadioCard.astro
import { siteConfig } from '../config/site';

interface Props {
  id: string;
  name: string;
  value: string;
  title: string;
  image?: string;
  icon?: string;
}

const { id, name, value, title, image, icon } = Astro.props;
const bgColor = siteConfig.brand.primaryColor;
---

<label 
  for={id}
  class="group relative flex flex-col items-center cursor-pointer transition-all duration-200"
>
  <input
    type="radio"
    id={id}
    name={name}
    value={value}
    class="sr-only"
    data-auto-advance="true"
  />
  
  <!-- Image container - 1:1 ratio -->
  <div 
    class="aspect-square w-full rounded-xl overflow-hidden transition-transform group-hover:scale-105 group-has-[:checked]:ring-4 group-has-[:checked]:ring-white/50"
    style={`background-color: ${bgColor}`}
  >
    {image && (
      <img 
        src={image} 
        alt={title}
        class="w-full h-full object-cover"
        loading="lazy"
      />
    )}
    
    {icon && !image && (
      <div class="w-full h-full flex items-center justify-center">
        <span class="text-6xl">{icon}</span>
      </div>
    )}
  </div>
  
  <!-- Title - white on primary color -->
  <div 
    class="w-full py-3 text-center rounded-b-xl -mt-2"
    style={`background-color: ${bgColor}`}
  >
    <span class="font-medium text-white">{title}</span>
  </div>
  
  <!-- Check indicator -->
  <div class="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 border-2 border-white transition-all group-has-[:checked]:bg-white">
    <svg class="w-full h-full text-primary opacity-0 group-has-[:checked]:opacity-100 p-0.5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
    </svg>
  </div>
</label>
```

## ChecklistCard

Multi-select option with optional price display.

```astro
---
// src/components/calculator/ChecklistCard.astro
import { siteConfig } from '@/config/calculator/site';
import { formatPrice } from '@/config/calculator/i18n';

interface Props {
  id: string;
  name: string;
  value: string;
  title: string;
  description?: string;
  price?: number;
}

const { id, name, value, title, description, price } = Astro.props;
---

<label 
  for={id}
  class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer transition-all hover:border-primary hover:bg-gray-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
>
  <input
    type="checkbox"
    id={id}
    name={name}
    value={value}
    class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
  />
  
  <div class="flex-1">
    <span class="font-medium text-gray-900">{title}</span>
    {description && (
      <span class="block text-sm text-gray-500 mt-0.5">{description}</span>
    )}
  </div>
  
  {price !== undefined && (
    <span class="text-sm font-medium text-gray-600">
      +{formatPrice(price, siteConfig.locale)}
    </span>
  )}
</label>
```

## ProgressBar

Clickable progress indicator. Only backwards navigation allowed.

```astro
---
// src/components/calculator/ProgressBar.astro
import { STEPS } from '@/config/calculator/steps';

interface Props {
  currentStep: number;
}

const { currentStep } = Astro.props;
const progress = ((currentStep + 1) / STEPS.length) * 100;
---

<div class="mb-8">
  <!-- Progress line -->
  <div class="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
    <div 
      class="h-full bg-primary transition-all duration-300 ease-out"
      style={`width: ${progress}%`}
    ></div>
  </div>
  
  <!-- Step indicators -->
  <div class="flex justify-between">
    {STEPS.map((step, index) => (
      <a
        href={index < currentStep ? `/calculator/${step.slug}` : undefined}
        data-step-link
        data-step-index={index}
        data-current-index={currentStep}
        class:list={[
          'flex flex-col items-center gap-1 text-xs transition-colors',
          index < currentStep && 'text-primary cursor-pointer hover:text-primary-dark',
          index === currentStep && 'text-primary font-medium',
          index > currentStep && 'text-gray-400 cursor-not-allowed',
        ]}
      >
        <div class:list={[
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors',
          index < currentStep && 'bg-primary border-primary text-white',
          index === currentStep && 'bg-white border-primary text-primary',
          index > currentStep && 'bg-gray-100 border-gray-200 text-gray-400',
        ]}>
          {index < currentStep ? '✓' : index + 1}
        </div>
        <span class="hidden sm:block max-w-[80px] text-center truncate">{step.shortTitle || step.title}</span>
      </a>
    ))}
  </div>
</div>
```

## ContactForm

Final step form with all anti-spam protections.

```astro
---
// src/components/calculator/ContactForm.astro
import { siteConfig } from '@/config/calculator/site';
import { i18n } from '@/config/calculator/i18n';
import TextInput from './forms/TextInput.astro';
import EmailInput from './forms/EmailInput.astro';
import PhoneInput from './forms/PhoneInput.astro';
import PostcodeInput from './forms/PostcodeInput.astro';
import CityInput from './forms/CityInput.astro';

interface Props {
  prevStepSlug?: string;
}

const { prevStepSlug } = Astro.props;
const t = i18n[siteConfig.locale];
---

<form id="contact-form" class="space-y-4" novalidate>
  <div class="grid grid-cols-2 gap-4">
    <TextInput name="firstName" label={t.firstName} required />
    <TextInput name="lastName" label={t.lastName} required />
  </div>
  
  <EmailInput name="email" label={t.email} required />
  <PhoneInput name="phone" label={t.phone} required />
  
  <div class="grid grid-cols-2 gap-4">
    <PostcodeInput name="postcode" label={t.postcode} required />
    <CityInput name="city" label={t.city} required />
  </div>
  
  <!-- Honeypot (invisible) -->
  <div class="absolute -left-[9999px]" aria-hidden="true">
    <input type="text" name="company" tabindex="-1" autocomplete="off" />
  </div>
  
  <!-- Time check -->
  <input type="hidden" name="formStartTime" value="" id="form-start-time" />
  
  <div class="flex items-center justify-between pt-4">
    {prevStepSlug && (
      <a href={`/calculator/${prevStepSlug}`} class="text-gray-600 hover:text-gray-900">
        ← {t.back}
      </a>
    )}
    
    <button
      type="submit"
      class="ml-auto px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {t.submit}
    </button>
  </div>
  
  <!-- Error display -->
  <div id="form-errors" class="hidden mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"></div>
</form>

<script>
  // Set form start time on load
  document.getElementById('form-start-time')?.setAttribute('value', Date.now().toString());
</script>
```

## StickyMobileCTA

Fixed bottom button for checkbox steps on mobile.

```astro
---
// src/components/calculator/StickyMobileCTA.astro
interface Props {
  label: string;
}

const { label } = Astro.props;
---

<div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
  <button
    type="button"
    data-action="next"
    class="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
  >
    {label}
  </button>
</div>

<!-- Spacer to prevent content overlap -->
<div class="h-20 md:hidden"></div>
```

## Toast

Notification component for success/error messages.

```astro
---
// src/components/calculator/Toast.astro
interface Props {
  id?: string;
}

const { id = 'toast' } = Astro.props;
---

<div
  id={id}
  class="fixed bottom-4 right-4 transform translate-y-full opacity-0 transition-all duration-300 z-50 hidden"
  role="alert"
>
  <div class="px-6 py-4 rounded-lg shadow-lg" data-toast-content>
    <span data-toast-message></span>
  </div>
</div>

<style>
  [data-toast-type="success"] [data-toast-content] {
    @apply bg-green-600 text-white;
  }
  [data-toast-type="error"] [data-toast-content] {
    @apply bg-red-600 text-white;
  }
</style>
```

## Form Inputs

### TextInput

```astro
---
interface Props {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}

const { name, label, required, placeholder } = Astro.props;
---

<div>
  <label for={name} class="block text-sm font-medium text-gray-700 mb-1">
    {label}{required && <span class="text-red-500 ml-0.5">*</span>}
  </label>
  <input
    type="text"
    id={name}
    name={name}
    placeholder={placeholder}
    required={required}
    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
  />
  <p class="text-sm text-red-600 mt-1 hidden" data-error={name}></p>
</div>
```

### EmailInput (with typo suggestion)

```astro
---
import { siteConfig } from '@/config/calculator/site';
import { i18n } from '@/config/calculator/i18n';

interface Props {
  name: string;
  label: string;
  required?: boolean;
}

const { name, label, required } = Astro.props;
const t = i18n[siteConfig.locale];
---

<div>
  <label for={name} class="block text-sm font-medium text-gray-700 mb-1">
    {label}{required && <span class="text-red-500 ml-0.5">*</span>}
  </label>
  <input
    type="email"
    id={name}
    name={name}
    required={required}
    autocomplete="email"
    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
  />
  
  <!-- Typo suggestion -->
  <div id="email-suggestion" class="hidden mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
    {t.emailSuggestion}
    <button type="button" id="email-fix-btn" class="font-medium underline hover:no-underline"></button>
  </div>
  
  <p class="text-sm text-red-600 mt-1 hidden" data-error={name}></p>
</div>
```

## LoadingSkeleton

Animated placeholder during API calls.

```astro
---
// src/calculator/components/LoadingSkeleton.astro
interface Props {
  variant?: 'card' | 'text' | 'button' | 'form';
  count?: number;
}

const { variant = 'card', count = 1 } = Astro.props;
---

{variant === 'card' && (
  <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
    {Array.from({ length: count }).map(() => (
      <div class="animate-pulse">
        <div class="aspect-square bg-gray-200 rounded-xl mb-2"></div>
        <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
      </div>
    ))}
  </div>
)}

{variant === 'form' && (
  <div class="space-y-4 animate-pulse">
    <div class="grid grid-cols-2 gap-4">
      <div class="h-11 bg-gray-200 rounded-lg"></div>
      <div class="h-11 bg-gray-200 rounded-lg"></div>
    </div>
    <div class="h-11 bg-gray-200 rounded-lg"></div>
    <div class="h-12 bg-gray-200 rounded-xl mt-6"></div>
  </div>
)}
```

## DropdownSelect

Select menu with auto-advance.

```astro
---
// src/calculator/components/DropdownSelect.astro
interface Props {
  id: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

const { id, name, options, placeholder = 'Válasszon...' } = Astro.props;
---

<select
  id={id}
  name={name}
  data-auto-advance-dropdown="true"
  class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none cursor-pointer"
>
  <option value="" disabled selected>{placeholder}</option>
  {options.map(opt => (
    <option value={opt.value}>{opt.label}</option>
  ))}
</select>
```
