# Client Logic Reference

⚠️ **ALL client JavaScript in ONE file**: `src/calculator/lib/client.ts`

No inline `<script>` blocks in components. Import from client.ts.

## State Management

```typescript
// src/calculator/lib/client.ts

const STORAGE_KEY = 'calculator_state';
const UTM_KEY = 'calculator_utm';

export interface CalculatorState {
  sessionId: string;
  currentStep: string;
  answers: Record<string, unknown>;
  startedAt: number;
}

export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function loadState(): CalculatorState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  
  return {
    sessionId: generateSessionId(),
    currentStep: '',
    answers: {},
    startedAt: Date.now(),
  };
}

export function saveState(updates: Partial<CalculatorState>): void {
  const current = loadState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...updates }));
}

export function saveAnswer(stepId: string, value: unknown): void {
  const state = loadState();
  state.answers[stepId] = value;
  saveState(state);
}

export function getAnswer<T = unknown>(stepId: string): T | undefined {
  return loadState().answers[stepId] as T | undefined;
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

## UTM Capture

```typescript
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'];

export function captureUTM(): void {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  let hasUTM = false;
  
  UTM_PARAMS.forEach(param => {
    const value = params.get(param);
    if (value) {
      utm[param.replace('utm_', '')] = value;
      hasUTM = true;
    }
  });
  
  if (hasUTM) {
    localStorage.setItem(UTM_KEY, JSON.stringify(utm));
  }
}

export function getUTM(): Record<string, string> | null {
  try {
    const stored = localStorage.getItem(UTM_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
```

## Calculator Controller

```typescript
interface ControllerOptions {
  stepId: string;
  nextStepSlug?: string;
  prevStepSlug?: string;
  autoAdvanceDelay?: number;
  totalCheckboxOptions?: number; // For all-selected auto-advance
}

export function initCalculator(options: ControllerOptions): void {
  const { stepId, nextStepSlug, autoAdvanceDelay = 200, totalCheckboxOptions } = options;
  
  // Restore existing answers
  restoreAnswers(stepId);
  
  // Radio cards - auto advance
  document.querySelectorAll<HTMLInputElement>('[data-auto-advance="true"]')
    .forEach(input => {
      input.addEventListener('change', () => {
        saveAnswer(stepId, input.value);
        
        if (nextStepSlug) {
          setTimeout(() => {
            window.location.href = `/calculator/${nextStepSlug}`;
          }, autoAdvanceDelay);
        }
      });
    });
  
  // Dropdown - auto advance on selection
  document.querySelectorAll<HTMLSelectElement>('[data-auto-advance-dropdown="true"]')
    .forEach(select => {
      select.addEventListener('change', () => {
        if (select.value) {
          saveAnswer(stepId, select.value);
          
          if (nextStepSlug) {
            setTimeout(() => {
              window.location.href = `/calculator/${nextStepSlug}`;
            }, autoAdvanceDelay);
          }
        }
      });
    });
  
  // Checkbox - auto advance when ALL selected
  if (totalCheckboxOptions) {
    document.querySelectorAll<HTMLInputElement>(`input[name="${stepId}[]"]`)
      .forEach(input => {
        input.addEventListener('change', () => {
          const checkedCount = document.querySelectorAll<HTMLInputElement>(
            `input[name="${stepId}[]"]:checked`
          ).length;
          
          if (checkedCount === totalCheckboxOptions) {
            const values = Array.from(
              document.querySelectorAll<HTMLInputElement>(`input[name="${stepId}[]"]:checked`)
            ).map(i => i.value);
            
            saveAnswer(stepId, values);
            
            if (nextStepSlug) {
              setTimeout(() => {
                window.location.href = `/calculator/${nextStepSlug}`;
              }, autoAdvanceDelay);
            }
          }
        });
      });
  }
  
  // Manual next buttons (for checkbox when not all selected)
  document.querySelectorAll<HTMLButtonElement>('[data-action="next"]')
    .forEach(btn => {
      btn.addEventListener('click', () => handleCheckboxNext(stepId, nextStepSlug));
    });
  
  // Progress bar - prevent forward clicks
  document.querySelectorAll<HTMLAnchorElement>('[data-step-link]')
    .forEach(link => {
      const target = parseInt(link.dataset.stepIndex || '0', 10);
      const current = parseInt(link.dataset.currentIndex || '0', 10);
      
      if (target >= current) {
        link.addEventListener('click', e => e.preventDefault());
        link.style.cursor = 'not-allowed';
      }
    });
}

function restoreAnswers(stepId: string): void {
  const answer = getAnswer(stepId);
  if (!answer) return;
  
  if (Array.isArray(answer)) {
    answer.forEach(val => {
      const input = document.querySelector<HTMLInputElement>(`input[value="${val}"]`);
      if (input) input.checked = true;
    });
  } else {
    const input = document.querySelector<HTMLInputElement>(`input[value="${answer}"]`);
    if (input) input.checked = true;
  }
}

function handleCheckboxNext(stepId: string, nextStepSlug?: string): void {
  const checked = Array.from(
    document.querySelectorAll<HTMLInputElement>(`input[name="${stepId}[]"]:checked`)
  ).map(input => input.value);
  
  saveAnswer(stepId, checked);
  
  if (nextStepSlug) {
    window.location.href = `/calculator/${nextStepSlug}`;
  }
}
```

## Email Typo Check

Uses `requestIdleCallback` for non-blocking check.

```typescript
import { getSuggestion } from './email-typo';

export function initEmailTypoCheck(): void {
  const emailInput = document.getElementById('email') as HTMLInputElement | null;
  const suggestionDiv = document.getElementById('email-suggestion');
  const fixBtn = document.getElementById('email-fix-btn');
  
  if (!emailInput || !suggestionDiv || !fixBtn) return;
  
  let suggestedEmail = '';
  
  emailInput.addEventListener('blur', () => {
    const check = () => {
      const suggestion = getSuggestion(emailInput.value);
      
      if (suggestion) {
        suggestedEmail = suggestion;
        fixBtn.textContent = suggestion;
        suggestionDiv.classList.remove('hidden');
      } else {
        suggestionDiv.classList.add('hidden');
      }
    };
    
    // Non-blocking
    if ('requestIdleCallback' in window) {
      requestIdleCallback(check, { timeout: 500 });
    } else {
      setTimeout(check, 0);
    }
  });
  
  fixBtn.addEventListener('click', () => {
    emailInput.value = suggestedEmail;
    suggestionDiv.classList.add('hidden');
    emailInput.focus();
  });
}
```

## Postcode Lookup

Debounced API call with sync fallback for HU.

```typescript
export function initPostcodeLookup(locale: 'hu-HU' | 'en-GB'): void {
  const postcodeInput = document.getElementById('postcode') as HTMLInputElement | null;
  const cityInput = document.getElementById('city') as HTMLInputElement | null;
  const loadingEl = document.getElementById('postcode-loading');
  
  if (!postcodeInput || !cityInput) return;
  
  const triggerLength = locale === 'hu-HU' ? 4 : 5;
  let debounceTimer: number;
  
  postcodeInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const value = postcodeInput.value.trim();
    
    if (value.length >= triggerLength) {
      debounceTimer = window.setTimeout(async () => {
        loadingEl?.classList.remove('hidden');
        
        try {
          const response = await fetch(`/api/calculator/postcode?code=${encodeURIComponent(value)}`);
          const data = await response.json();
          
          if (data.city && !cityInput.value) {
            cityInput.value = data.city;
            cityInput.classList.add('bg-green-50');
            setTimeout(() => cityInput.classList.remove('bg-green-50'), 1000);
          }
        } catch (e) {
          console.error('Postcode lookup failed:', e);
        } finally {
          loadingEl?.classList.add('hidden');
        }
      }, 300);
    }
  });
}
```

## Form Submission

```typescript
export async function submitForm(formEl: HTMLFormElement): Promise<{ 
  success: boolean; 
  quoteId?: string; 
  errors?: Record<string, string[]> 
}> {
  const state = loadState();
  const formData = new FormData(formEl);
  
  const payload = {
    sessionId: state.sessionId,
    answers: state.answers,
    contact: {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      postcode: formData.get('postcode'),
      city: formData.get('city'),
      company: formData.get('company'), // honeypot
      formStartTime: formData.get('formStartTime'),
    },
    utm: getUTM(),
    meta: {
      landingPage: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    },
  };
  
  const response = await fetch('/api/calculator/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  const result = await response.json();
  
  if (result.success) {
    clearState();
  }
  
  return result;
}
```

## Usage in Step Pages

```astro
<!-- src/pages/calculator/[step].astro -->
<script 
  type="module"
  define:vars={{ 
    stepId: stepConfig.id, 
    nextStepSlug: nextStep?.slug || null,
    locale: siteConfig.locale,
    isFormStep: stepConfig.type === 'form',
  }}
>
  import { 
    initCalculator, 
    initEmailTypoCheck, 
    initPostcodeLookup,
    captureUTM,
  } from '/src/lib/calculator/client.ts';
  
  captureUTM();
  initCalculator({ stepId, nextStepSlug });
  
  if (isFormStep) {
    initEmailTypoCheck();
    initPostcodeLookup(locale);
  }
</script>
```

## Email Typo Helper

```typescript
// src/lib/calculator/email-typo.ts
import emailTypos from '@/data/email-typos';

const COMMON_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'freemail.hu', 'citromail.hu', 'vipmail.hu', // HU
];

export function getSuggestion(email: string): string | null {
  const [local, domain] = email.toLowerCase().split('@');
  if (!domain) return null;
  
  // Check exact typo map first
  if (emailTypos[domain]) {
    return `${local}@${emailTypos[domain]}`;
  }
  
  // Levenshtein distance for close matches
  for (const correct of COMMON_DOMAINS) {
    if (levenshtein(domain, correct) <= 2 && domain !== correct) {
      return `${local}@${correct}`;
    }
  }
  
  return null;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1] 
        ? dp[i-1][j-1] 
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  
  return dp[m][n];
}
```

```typescript
// src/data/email-typos.ts
export default {
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'fremail.hu': 'freemail.hu',
  'freemal.hu': 'freemail.hu',
} as Record<string, string>;
```

## Browser Back Handling

Restore state when user navigates back:

```typescript
// Add to initCalculator()
export function initBrowserBackHandling(stepId: string, stepIndex: number): void {
  // Push current state to history
  if (!history.state?.calculatorStep) {
    history.replaceState(
      { calculatorStep: stepId, stepIndex },
      '',
      window.location.href
    );
  }
  
  // Handle popstate (back/forward)
  window.addEventListener('popstate', (e) => {
    if (e.state?.calculatorStep) {
      // Redirect to the step from history
      const targetStep = e.state.calculatorStep;
      const currentPath = window.location.pathname;
      
      if (!currentPath.includes(targetStep)) {
        window.location.href = `/calculator/${targetStep}`;
      }
    }
  });
}

// Navigate to next step with history
export function navigateToStep(stepSlug: string, stepIndex: number): void {
  history.pushState(
    { calculatorStep: stepSlug, stepIndex },
    '',
    `/calculator/${stepSlug}`
  );
  window.location.href = `/calculator/${stepSlug}`;
}
```

## GTM Integration

```typescript
// src/calculator/lib/gtm.ts

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

function push(data: Record<string, unknown>): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}

export const gtm = {
  start(sessionId: string) {
    push({ event: 'calculator_start', sessionId });
  },
  
  step(stepId: string, stepIndex: number) {
    push({ 
      event: 'calculator_step', 
      step: stepId, 
      stepIndex,
    });
  },
  
  option(stepId: string, value: string | string[]) {
    push({ 
      event: 'calculator_option', 
      step: stepId, 
      value: Array.isArray(value) ? value.join(',') : value,
    });
  },
  
  submit(quoteId: string) {
    push({ 
      event: 'calculator_submit', 
      quoteId,
    });
  },
  
  value(amount: number, currency: string = 'HUF') {
    push({ 
      event: 'calculator_value', 
      value: amount,
      currency,
    });
  },
};

// Usage in initCalculator:
// gtm.step(stepId, stepIndex);
// 
// In radio/checkbox handler:
// gtm.option(stepId, value);
```
