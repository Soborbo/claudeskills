# Form Modifiers

## Overview

Modifiers adapt the base form for different contexts.

| Modifier | Use Case |
|----------|----------|
| `compact` | Sidebar, footer forms |
| `inline` | Single-line newsletter |
| `modal` | Popup/overlay forms |
| `calculator` | Multi-step with calc |

---

## Compact Form

Reduced fields, minimal layout.

```yaml
modifier: compact
fields: [name, email, phone]
layout: stacked
cta: "Kérjen ajánlatot"
```

```astro
<form class="form form--compact">
  <input name="name" placeholder="Név" required />
  <input name="email" type="email" placeholder="Email" required />
  <input name="phone" type="tel" placeholder="Telefon" />
  <label class="gdpr">
    <input type="checkbox" name="gdprConsent" required />
    <span>Elfogadom az <a href="/privacy">adatvédelmi szabályzatot</a></span>
  </label>
  <button type="submit">Kérjen ajánlatot</button>
</form>
```

**Use:** Sidebar, footer, landing page sections

---

## Inline Form

Single-line, newsletter style.

```yaml
modifier: inline
fields: [email]
layout: horizontal
cta: "Feliratkozás"
```

```astro
<form class="form form--inline">
  <input name="email" type="email" placeholder="Email cím" required />
  <button type="submit">Feliratkozás</button>
</form>

<style>
  .form--inline {
    @apply flex gap-2;
  }
  .form--inline input {
    @apply flex-1;
  }
</style>
```

**Use:** Newsletter, exit intent popup

---

## Modal Form

Overlay with backdrop.

```yaml
modifier: modal
trigger: button | scroll | exit_intent | delay
fields: [name, email, phone, message]
```

```astro
<dialog id="contact-modal" class="form-modal">
  <form method="dialog" class="form form--modal">
    <button type="button" class="modal-close" aria-label="Bezárás">×</button>
    <h2>Kapcsolatfelvétel</h2>
    <!-- fields -->
  </form>
</dialog>

<script>
  // Open triggers
  document.querySelectorAll('[data-modal="contact"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('contact-modal').showModal();
    });
  });
</script>
```

**Use:** CTA clicks, exit intent, timed popup

---

## Calculator Form (Final Step)

Contact fields as final calculator step.

```yaml
modifier: calculator_final
fields: [name, email, phone]
includes: [quote_summary, price_breakdown]
```

```astro
<form class="form form--calculator-final">
  <div class="quote-summary">
    <h3>Az Ön ajánlata</h3>
    <div class="price-breakdown">
      <!-- Calculated values -->
    </div>
  </div>
  
  <div class="contact-fields">
    <input name="name" placeholder="Név" required />
    <input name="email" type="email" placeholder="Email" required />
    <input name="phone" type="tel" placeholder="Telefon" required />
  </div>
  
  <label class="gdpr">
    <input type="checkbox" name="gdprConsent" required />
    <span>Elfogadom az adatvédelmi szabályzatot</span>
  </label>
  
  <button type="submit">Ajánlat kérése</button>
</form>
```

---

## Field Variations

### Phone with Country Code

```astro
<div class="phone-field">
  <select name="phoneCountry">
    <option value="+36">🇭🇺 +36</option>
    <option value="+44">🇬🇧 +44</option>
  </select>
  <input name="phone" type="tel" placeholder="30 123 4567" />
</div>
```

### Postcode with Autofill

```astro
<div class="postcode-field" data-autofill="city">
  <input name="postcode" placeholder="Irányítószám" data-lookup />
  <input name="city" placeholder="Város" readonly />
</div>
```

### Message with Counter

```astro
<div class="message-field">
  <textarea name="message" maxlength="500"></textarea>
  <span class="counter"><span data-count>0</span>/500</span>
</div>
```

---

## Modifier Classes

| Class | Effect |
|-------|--------|
| `.form--compact` | Reduced padding, smaller fields |
| `.form--inline` | Horizontal layout |
| `.form--modal` | Centered, max-width |
| `.form--dark` | Dark background variant |
| `.form--sticky` | Fixed position on mobile |

---

## Modifier × Page Matrix

| Page Type | Recommended Modifier |
|-----------|---------------------|
| Landing | default, compact |
| Service | default |
| Contact | default |
| Footer | compact, inline |
| Popup | modal |
| Calculator | calculator_final |
