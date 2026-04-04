# Micro-Interactions

Small, focused animations for interactive elements.

## Button Hover States

```css
.btn {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Ripple effect */
.btn-ripple::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%);
  transform: scale(0);
  opacity: 0;
}

.btn-ripple:active::after {
  transform: scale(2);
  opacity: 1;
  transition: transform 0.3s, opacity 0.3s;
}

@media (prefers-reduced-motion: reduce) {
  .btn {
    transition: none;
  }
  .btn:hover {
    transform: none;
  }
}
```

## Form Field Focus Animation

```css
.input-animated {
  border: 2px solid #e5e7eb;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-animated:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
  outline: none;
}

/* Floating label */
.floating-label-group {
  position: relative;
}

.floating-label-group input {
  padding-top: 1.5rem;
}

.floating-label-group label {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.2s ease-out;
  pointer-events: none;
  color: #9ca3af;
}

.floating-label-group input:focus + label,
.floating-label-group input:not(:placeholder-shown) + label {
  top: 0.75rem;
  transform: translateY(0);
  font-size: 0.75rem;
  color: var(--color-primary);
}
```

## Success/Error State Animations

```css
.success-shake {
  animation: successPop 0.3s ease-out;
}

.error-shake {
  animation: errorShake 0.3s ease-out;
}

@keyframes successPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@media (prefers-reduced-motion: reduce) {
  .success-shake,
  .error-shake {
    animation: none;
  }
}
```

## Usage

```html
<!-- Button with hover effect -->
<button class="btn btn-ripple">Click me</button>

<!-- Animated input -->
<div class="floating-label-group">
  <input type="text" class="input-animated" placeholder=" " />
  <label>Email address</label>
</div>

<!-- Success/error feedback -->
<div class="success-shake">Saved successfully!</div>
<div class="error-shake">Invalid email</div>
```
