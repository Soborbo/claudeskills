# Form Accessibility

## Labels (Required)

Every form input must have an associated label:

```html
<!-- ✅ Explicit label -->
<label for="email">Email address</label>
<input type="email" id="email" name="email" required>

<!-- ✅ Implicit label -->
<label>
  Email address
  <input type="email" name="email" required>
</label>

<!-- ❌ No label -->
<input type="email" placeholder="Email">
```

## Error Messages

Announce errors to screen readers using `aria-describedby` and `aria-invalid`:

```html
<label for="phone">Phone number</label>
<input
  type="tel"
  id="phone"
  aria-describedby="phone-error"
  aria-invalid="true"
>
<p id="phone-error" role="alert" class="text-red-600">
  Please enter a valid UK phone number
</p>
```

## Required Fields

Indicate required fields both visually and programmatically:

```html
<label for="name">
  Name <span aria-hidden="true">*</span>
  <span class="sr-only">(required)</span>
</label>
<input type="text" id="name" required aria-required="true">
```

## Form Validation Best Practices

- Validate on blur, not on every keystroke
- Show inline errors near the field
- Use `role="alert"` for dynamic error messages
- Provide clear, actionable error text
- Don't rely on color alone to indicate errors
- Move focus to first error on submit
