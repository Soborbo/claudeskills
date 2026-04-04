# Form Error States

## Inline Field Errors

```astro
---
interface Props {
  error?: string;
  touched?: boolean;
}

const { error, touched } = Astro.props;
const showError = touched && error;
---

<div class="form-field">
  <label for="email" class:list={['label', { 'label-error': showError }]}>
    Email Address <span class="text-red-500">*</span>
  </label>

  <input
    type="email"
    id="email"
    name="email"
    class:list={['input', { 'input-error': showError }]}
    aria-invalid={showError ? 'true' : undefined}
    aria-describedby={showError ? 'email-error' : undefined}
  />

  {showError && (
    <p id="email-error" class="error-message" role="alert">
      <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {error}
    </p>
  )}
</div>

<style>
  .label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .label-error {
    color: #dc2626;
  }

  .input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    transition: border-color 0.2s;
  }

  .input:focus {
    border-color: var(--color-primary);
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
  }

  .input-error {
    border-color: #dc2626;
  }

  .input-error:focus {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.5rem;
    color: #dc2626;
    font-size: 0.875rem;
  }

  .error-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }
</style>
```

## Form Error Summary

```astro
---
interface Props {
  errors: Record<string, string>;
}

const { errors } = Astro.props;
const errorList = Object.entries(errors);
---

{errorList.length > 0 && (
  <div
    class="error-summary"
    role="alert"
    aria-labelledby="error-summary-title"
  >
    <h2 id="error-summary-title" class="error-summary-title">
      There's a problem
    </h2>
    <p class="error-summary-body">
      Please fix the following errors:
    </p>
    <ul class="error-summary-list">
      {errorList.map(([field, message]) => (
        <li>
          <a href={`#${field}`} class="error-link">
            {message}
          </a>
        </li>
      ))}
    </ul>
  </div>
)}

<style>
  .error-summary {
    padding: 1rem;
    margin-bottom: 1.5rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
  }

  .error-summary-title {
    font-weight: 600;
    color: #991b1b;
    margin-bottom: 0.5rem;
  }

  .error-summary-body {
    color: #7f1d1d;
    margin-bottom: 0.5rem;
  }

  .error-summary-list {
    list-style: disc;
    padding-left: 1.5rem;
    color: #991b1b;
  }

  .error-link {
    color: #991b1b;
    text-decoration: underline;
  }

  .error-link:hover {
    color: #7f1d1d;
  }
</style>
```
