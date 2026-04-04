# Button Component

```astro
---
// src/components/ui/Button.astro
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  fullWidth?: boolean;
  class?: string;
}

const {
  variant = 'primary',
  size = 'md',
  href,
  type = 'button',
  disabled = false,
  fullWidth = false,
  class: className,
} = Astro.props;

const Tag = href ? 'a' : 'button';

const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-button transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary: 'bg-accent hover:bg-accent-hover text-white shadow-button hover:shadow-button-hover',
  secondary: 'bg-primary-100 hover:bg-primary-200 text-primary-900',
  outline: 'border-2 border-primary-300 hover:border-primary-400 text-primary-900 hover:bg-primary-50',
  ghost: 'text-primary-700 hover:text-primary-900 hover:bg-primary-100',
};

const sizes = {
  sm: 'text-sm px-4 py-2 min-h-[36px]',
  md: 'text-base px-6 py-3 min-h-[44px]',
  lg: 'text-lg px-8 py-4 min-h-[52px]',
};
---

<Tag
  href={href}
  type={!href ? type : undefined}
  disabled={disabled}
  class:list={[
    baseStyles,
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className,
  ]}
>
  <slot />
</Tag>
```

## Usage

```astro
<Button>Primary Button</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline" size="lg">Large Outline</Button>
<Button href="/contact">Link Button</Button>
<Button type="submit" fullWidth>Submit Form</Button>
```
