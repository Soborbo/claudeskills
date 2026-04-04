# Input Component

```astro
---
// src/components/ui/Input.astro
interface Props {
  type?: 'text' | 'email' | 'tel' | 'number' | 'password';
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  class?: string;
}

const {
  type = 'text',
  name,
  label,
  placeholder,
  required = false,
  disabled = false,
  error,
  class: className,
} = Astro.props;

const inputId = `input-${name}`;
---

<div class:list={['flex flex-col gap-1.5', className]}>
  <label for={inputId} class="text-sm font-medium text-primary-700">
    {label}
    {required && <span class="text-error ml-0.5">*</span>}
  </label>
  <input
    type={type}
    id={inputId}
    name={name}
    placeholder={placeholder}
    required={required}
    disabled={disabled}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={error ? `${inputId}-error` : undefined}
    class:list={[
      'w-full px-4 py-3 min-h-[44px] text-base rounded-md border transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
      'disabled:bg-neutral-100 disabled:cursor-not-allowed',
      error
        ? 'border-error bg-error/5'
        : 'border-primary-200 hover:border-primary-300',
    ]}
  />
  {error && (
    <p id={`${inputId}-error`} class="text-sm text-error" role="alert">
      {error}
    </p>
  )}
</div>
```

## Usage

```astro
<Input name="email" label="Email Address" type="email" required />
<Input name="phone" label="Phone" type="tel" placeholder="07xxx xxx xxx" />
<Input name="name" label="Name" error="Name is required" />
```
