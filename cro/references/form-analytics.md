# Form Analytics Tracking

## Complete Form Analytics Implementation

```typescript
// src/lib/cro/form-analytics.ts
interface FormFieldMetrics {
  fieldName: string;
  focusTime: number;
  blurTime: number;
  timeSpent: number;
  corrections: number;
  abandoned: boolean;
}

export function trackFormAnalytics(formId: string): void {
  const form = document.getElementById(formId);
  if (!form) return;

  const fieldMetrics: Map<string, FormFieldMetrics> = new Map();
  let currentField: string | null = null;
  let fieldFocusTime = 0;

  // Track field focus
  form.addEventListener('focusin', (e) => {
    const target = e.target as HTMLInputElement;
    if (!target.name) return;

    currentField = target.name;
    fieldFocusTime = Date.now();

    if (!fieldMetrics.has(target.name)) {
      fieldMetrics.set(target.name, {
        fieldName: target.name,
        focusTime: Date.now(),
        blurTime: 0,
        timeSpent: 0,
        corrections: 0,
        abandoned: true
      });
    }
  });

  // Track field blur
  form.addEventListener('focusout', (e) => {
    const target = e.target as HTMLInputElement;
    if (!target.name || !currentField) return;

    const metrics = fieldMetrics.get(target.name);
    if (metrics) {
      metrics.blurTime = Date.now();
      metrics.timeSpent += Date.now() - fieldFocusTime;
      metrics.abandoned = !target.value;
    }
    currentField = null;
  });

  // Track corrections (backspace/delete)
  form.addEventListener('keydown', (e) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && currentField) {
      const metrics = fieldMetrics.get(currentField);
      if (metrics) {
        metrics.corrections++;
      }
    }
  });

  // Track form submission
  form.addEventListener('submit', () => {
    const analyticsData = {
      formId,
      fields: Array.from(fieldMetrics.values()),
      totalTime: Date.now() - (fieldMetrics.values().next().value?.focusTime || Date.now())
    };

    // Send to analytics
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'form_analytics',
        ...analyticsData
      });
    }
  });

  // Track abandonment
  window.addEventListener('beforeunload', () => {
    const hasStarted = fieldMetrics.size > 0;
    const isComplete = form.querySelector(':invalid') === null;

    if (hasStarted && !isComplete) {
      const lastField = Array.from(fieldMetrics.values()).pop();

      navigator.sendBeacon('/api/analytics/form-abandon', JSON.stringify({
        formId,
        lastField: lastField?.fieldName,
        fieldsCompleted: Array.from(fieldMetrics.values()).filter(f => !f.abandoned).length,
        totalFields: fieldMetrics.size
      }));
    }
  });
}
```
