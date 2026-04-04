# Funnel Tracking Implementation

## Full Funnel Tracker Class

```typescript
// src/lib/cro/funnel.ts
interface FunnelStep {
  name: string;
  timestamp: number;
}

class FunnelTracker {
  private steps: FunnelStep[] = [];
  private funnelName: string;

  constructor(funnelName: string) {
    this.funnelName = funnelName;
    this.loadFromSession();
  }

  private loadFromSession(): void {
    const saved = sessionStorage.getItem(`funnel_${this.funnelName}`);
    if (saved) {
      this.steps = JSON.parse(saved);
    }
  }

  private saveToSession(): void {
    sessionStorage.setItem(`funnel_${this.funnelName}`, JSON.stringify(this.steps));
  }

  trackStep(stepName: string): void {
    const step: FunnelStep = {
      name: stepName,
      timestamp: Date.now()
    };

    this.steps.push(step);
    this.saveToSession();

    // Send to analytics
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'funnel_step',
        funnel_name: this.funnelName,
        step_name: stepName,
        step_number: this.steps.length,
        time_from_start: this.steps.length > 1
          ? step.timestamp - this.steps[0].timestamp
          : 0
      });
    }
  }

  complete(): void {
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'funnel_complete',
        funnel_name: this.funnelName,
        total_steps: this.steps.length,
        total_time: Date.now() - this.steps[0].timestamp
      });
    }
    sessionStorage.removeItem(`funnel_${this.funnelName}`);
  }

  abandon(): void {
    if (window.dataLayer && this.steps.length > 0) {
      window.dataLayer.push({
        event: 'funnel_abandon',
        funnel_name: this.funnelName,
        last_step: this.steps[this.steps.length - 1].name,
        steps_completed: this.steps.length
      });
    }
  }
}

// Usage
const quoteFunnel = new FunnelTracker('quote_request');
quoteFunnel.trackStep('landing_page');
quoteFunnel.trackStep('form_started');
quoteFunnel.trackStep('form_step_1');
quoteFunnel.trackStep('form_step_2');
quoteFunnel.complete();
```
