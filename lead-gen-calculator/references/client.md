# Calculator Client Logic

## Overview

All client-side JavaScript for calculator functionality.

---

## State Management

### localStorage Persistence

```typescript
// src/calculator/lib/client.ts

const STORAGE_KEY = 'calculator_state';

interface CalculatorState {
  currentStep: number;
  answers: Record<string, unknown>;
  startedAt: number;
}

export function getState(): CalculatorState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    currentStep: 0,
    answers: {},
    startedAt: Date.now(),
  };
}

export function setState(state: Partial<CalculatorState>) {
  const current = getState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...current,
    ...state,
  }));
}

export function setAnswer(stepId: string, value: unknown) {
  const state = getState();
  state.answers[stepId] = value;
  setState({ answers: state.answers });
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}
```

---

## Browser Back Handling

```typescript
// Handle popstate for browser back button
export function initBackHandler() {
  // Push initial state
  history.replaceState(
    { calculatorStep: getCurrentStepId() },
    '',
    window.location.href
  );

  // Listen for back/forward
  window.addEventListener('popstate', (event) => {
    if (event.state?.calculatorStep) {
      restoreStep(event.state.calculatorStep);
    }
  });
}

function restoreStep(stepId: string) {
  const state = getState();
  // Restore UI to match state
  const stepIndex = getStepIndex(stepId);
  navigateToStep(stepIndex);
}

// Push state on navigation
export function pushStepState(stepId: string, url: string) {
  history.pushState(
    { calculatorStep: stepId },
    '',
    url
  );
}
```

---

## Auto-Advance Logic

### Radio Buttons (200ms delay)

```typescript
export function initRadioAutoAdvance() {
  document.querySelectorAll('[data-auto-advance]').forEach(container => {
    const delay = parseInt(container.dataset.autoAdvance) || 200;
    
    container.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        
        // Save answer
        setAnswer(target.name, target.value);
        
        // Track selection
        trackOptionSelect(target.name, target.value);
        
        // Auto-advance after delay
        setTimeout(() => {
          navigateToNextStep();
        }, delay);
      });
    });
  });
}
```

### Checkboxes (When Required Selected)

```typescript
export function initCheckboxAutoAdvance() {
  document.querySelectorAll('[data-min-select]').forEach(container => {
    const minSelect = parseInt(container.dataset.minSelect) || 1;
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const checked = container.querySelectorAll('input:checked');
        
        // Update state
        const values = Array.from(checked).map((el) => (el as HTMLInputElement).value);
        setAnswer(checkbox.name, values);
        
        // Show/hide continue button based on min selection
        const continueBtn = container.querySelector('[data-next-step]');
        if (continueBtn) {
          continueBtn.disabled = checked.length < minSelect;
        }
      });
    });
  });
}
```

### Dropdown (Immediate)

```typescript
export function initDropdownAutoAdvance() {
  document.querySelectorAll('select[data-auto-advance]').forEach(select => {
    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      
      if (target.value) {
        setAnswer(target.name, target.value);
        trackOptionSelect(target.name, target.value);
        navigateToNextStep();
      }
    });
  });
}
```

---

## Navigation

```typescript
let currentStepIndex = 0;
const steps: string[] = []; // Populated from config

export function navigateToNextStep() {
  if (currentStepIndex < steps.length - 1) {
    currentStepIndex++;
    const nextStep = steps[currentStepIndex];
    
    // Prefetch was already done, now navigate
    window.location.href = `/calculator/${nextStep}`;
  }
}

export function navigateToPrevStep() {
  if (currentStepIndex > 0) {
    currentStepIndex--;
    history.back();
  }
}

export function navigateToStep(index: number) {
  currentStepIndex = index;
  window.location.href = `/calculator/${steps[index]}`;
}
```

---

## Prefetching

```typescript
export function prefetchNextStep() {
  if (currentStepIndex < steps.length - 1) {
    const nextStep = steps[currentStepIndex + 1];
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/calculator/${nextStep}`;
    document.head.appendChild(link);
  }
}

// Use requestIdleCallback for non-blocking prefetch
export function initPrefetch() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => prefetchNextStep());
  } else {
    setTimeout(() => prefetchNextStep(), 100);
  }
}
```

---

## City Autofill Animation

```typescript
export function initCityAutofill() {
  const postcodeInput = document.querySelector('[data-lookup]');
  const cityInput = document.querySelector('[data-autofill-target]');
  
  if (!postcodeInput || !cityInput) return;
  
  let debounceTimer: number;
  
  postcodeInput.addEventListener('input', (e) => {
    const value = (e.target as HTMLInputElement).value;
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const city = await lookupPostcode(value);
      if (city) {
        cityInput.value = city;
        // Green flash animation
        cityInput.classList.add('autofill-flash');
        setTimeout(() => {
          cityInput.classList.remove('autofill-flash');
        }, 1000);
      }
    }, 300); // 300ms debounce
  });
}
```

```css
.autofill-flash {
  animation: greenFlash 1s ease-out;
}

@keyframes greenFlash {
  0% { background-color: #22c55e33; }
  100% { background-color: transparent; }
}
```

---

## Toast Notifications

```typescript
export function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });
  
  // Remove after 3s
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

---

## Initialize All

```typescript
// Main entry point
export function initCalculator() {
  initBackHandler();
  initRadioAutoAdvance();
  initCheckboxAutoAdvance();
  initDropdownAutoAdvance();
  initCityAutofill();
  initPrefetch();
  
  // Track step view
  trackStepView(getCurrentStepId(), currentStepIndex);
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculator);
} else {
  initCalculator();
}
```

---

## Checklist

- [ ] localStorage state management
- [ ] Browser back/forward handling
- [ ] Radio auto-advance (200ms)
- [ ] Checkbox continue button
- [ ] Dropdown auto-advance
- [ ] Next step prefetching
- [ ] City autofill with animation
- [ ] Toast notifications
- [ ] GTM event tracking
