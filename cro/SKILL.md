---
name: cro
description: Conversion Rate Optimization patterns beyond A/B testing. Heatmaps, session recordings, funnel analysis, form analytics, exit intent. Data-driven optimization.
---

# CRO (Conversion Rate Optimization) Skill

## Purpose

Provides patterns for understanding user behavior and optimizing conversion funnels beyond basic A/B testing.

## Core Rules

1. **Measure before optimizing** — Understand current behavior first
2. **Qualitative + Quantitative** — Numbers + user feedback
3. **Funnel thinking** — Optimize the whole journey, not just CTAs
4. **Privacy first** — Anonymize data, respect consent
5. **Continuous process** — CRO is ongoing, not one-time

## CRO Tool Stack

| Purpose | Tools | Priority |
|---------|-------|----------|
| Heatmaps | Hotjar, Microsoft Clarity, PostHog | P0 |
| Session Recording | Hotjar, FullStory, LogRocket | P0 |
| Funnel Analysis | GA4, Mixpanel, Amplitude | P0 |
| Form Analytics | Hotjar, Formisimo, Zuko | P1 |
| Surveys | Hotjar, Typeform, SurveyMonkey | P1 |
| Exit Intent | OptinMonster, Sleeknote | P2 |
| Social Proof | Fomo, Proof, UseProof | P2 |

## Microsoft Clarity Setup (Free)

```astro
---
// src/components/analytics/Clarity.astro
interface Props {
  projectId: string;
}

const { projectId } = Astro.props;
---

<script define:vars={{ projectId }}>
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", projectId);
</script>
```

### Clarity Custom Tags

```typescript
// src/lib/cro/clarity.ts
declare global {
  interface Window {
    clarity: (...args: any[]) => void;
  }
}

export function tagClaritySession(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('set', key, value);
  }
}

// Usage examples
tagClaritySession('user_type', 'returning');
tagClaritySession('form_started', 'quote_form');
tagClaritySession('pricing_viewed', 'true');
```

## Hotjar Setup

```astro
---
// src/components/analytics/Hotjar.astro
interface Props {
  siteId: string;
}

const { siteId } = Astro.props;
---

<script define:vars={{ siteId }}>
  (function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:siteId,hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>
```

### Hotjar Events & Triggers

```typescript
// src/lib/cro/hotjar.ts
declare global {
  interface Window {
    hj: (...args: any[]) => void;
  }
}

// Trigger a recording for specific user actions
export function triggerHotjarRecording(eventName: string): void {
  if (typeof window !== 'undefined' && window.hj) {
    window.hj('trigger', eventName);
  }
}

// Tag user for filtering recordings
export function tagHotjarUser(userId: string, attributes?: Record<string, any>): void {
  if (typeof window !== 'undefined' && window.hj) {
    window.hj('identify', userId, attributes);
  }
}

// Track virtual pageviews (SPAs)
export function trackHotjarPageview(path: string): void {
  if (typeof window !== 'undefined' && window.hj) {
    window.hj('stateChange', path);
  }
}

// Usage
triggerHotjarRecording('form_abandoned');
triggerHotjarRecording('pricing_page_bounce');
tagHotjarUser('user_123', { plan: 'premium', signup_date: '2024-01-15' });
```

## Funnel Tracking

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

## Form Analytics

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

## Exit Intent Detection

```astro
---
// src/components/cro/ExitIntent.astro
interface Props {
  delay?: number; // ms before enabling
  cookieDays?: number; // days to suppress after shown
}

const { delay = 5000, cookieDays = 7 } = Astro.props;
---

<div id="exit-intent-modal" class="exit-modal" hidden>
  <div class="exit-modal-backdrop"></div>
  <div class="exit-modal-content" role="dialog" aria-modal="true" aria-labelledby="exit-title">
    <button class="exit-modal-close" aria-label="Close">&times;</button>

    <h2 id="exit-title">Wait! Before you go...</h2>
    <p>Get 10% off your first booking when you request a quote today.</p>

    <form class="exit-form">
      <input type="email" placeholder="Enter your email" required />
      <button type="submit" class="btn btn-primary">Get My Discount</button>
    </form>

    <p class="exit-note">No spam. Unsubscribe anytime.</p>
  </div>
</div>

<style>
  .exit-modal {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .exit-modal[hidden] {
    display: none;
  }

  .exit-modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
  }

  .exit-modal-content {
    position: relative;
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    max-width: 400px;
    text-align: center;
    animation: slideUp 0.3s ease-out;
  }

  .exit-modal-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>

<script define:vars={{ delay, cookieDays }}>
  function initExitIntent() {
    const modal = document.getElementById('exit-intent-modal');
    if (!modal) return;

    // Check if already shown
    const cookieName = 'exit_intent_shown';
    if (document.cookie.includes(cookieName)) return;

    let enabled = false;
    let shown = false;

    // Enable after delay
    setTimeout(() => {
      enabled = true;
    }, delay);

    // Detect exit intent (mouse leaving viewport at top)
    document.addEventListener('mouseout', (e) => {
      if (!enabled || shown) return;
      if (e.clientY <= 0 && e.relatedTarget === null) {
        showModal();
      }
    });

    // Mobile: detect back button or tab switch
    document.addEventListener('visibilitychange', () => {
      if (!enabled || shown) return;
      if (document.visibilityState === 'hidden') {
        // User is leaving - could show on return
      }
    });

    function showModal() {
      shown = true;
      modal.hidden = false;

      // Set cookie
      const expires = new Date();
      expires.setDate(expires.getDate() + cookieDays);
      document.cookie = `${cookieName}=1; expires=${expires.toUTCString()}; path=/`;

      // Track
      if (window.dataLayer) {
        window.dataLayer.push({ event: 'exit_intent_shown' });
      }

      // Focus trap
      const firstFocusable = modal.querySelector('input, button');
      firstFocusable?.focus();
    }

    // Close handlers
    modal.querySelector('.exit-modal-close')?.addEventListener('click', () => {
      modal.hidden = true;
    });

    modal.querySelector('.exit-modal-backdrop')?.addEventListener('click', () => {
      modal.hidden = true;
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) {
        modal.hidden = true;
      }
    });
  }

  initExitIntent();
</script>
```

## Scroll Depth Tracking

```typescript
// src/lib/cro/scroll-tracking.ts
export function trackScrollDepth(): void {
  const thresholds = [25, 50, 75, 90, 100];
  const tracked = new Set<number>();

  function getScrollPercent(): number {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.round((scrollTop / docHeight) * 100);
  }

  function checkThresholds(): void {
    const percent = getScrollPercent();

    thresholds.forEach((threshold) => {
      if (percent >= threshold && !tracked.has(threshold)) {
        tracked.add(threshold);

        if (window.dataLayer) {
          window.dataLayer.push({
            event: 'scroll_depth',
            scroll_percent: threshold,
            page_path: window.location.pathname
          });
        }
      }
    });
  }

  // Throttled scroll handler
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        checkThresholds();
        ticking = false;
      });
      ticking = true;
    }
  });
}
```

## Element Visibility Tracking

```typescript
// src/lib/cro/visibility-tracking.ts
export function trackElementVisibility(
  selector: string,
  eventName: string,
  threshold = 0.5
): void {
  const elements = document.querySelectorAll(selector);
  const tracked = new WeakSet<Element>();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !tracked.has(entry.target)) {
          tracked.add(entry.target);

          if (window.dataLayer) {
            window.dataLayer.push({
              event: eventName,
              element_id: entry.target.id,
              element_class: entry.target.className
            });
          }

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold }
  );

  elements.forEach((el) => observer.observe(el));
}

// Usage
trackElementVisibility('.pricing-section', 'pricing_viewed');
trackElementVisibility('.testimonials', 'testimonials_viewed');
trackElementVisibility('.cta-banner', 'cta_viewed');
```

## User Feedback Survey

```astro
---
// src/components/cro/FeedbackSurvey.astro
interface Props {
  trigger: 'exit' | 'time' | 'scroll' | 'conversion';
  delay?: number;
}

const { trigger, delay = 30000 } = Astro.props;
---

<div id="feedback-survey" class="survey" hidden>
  <div class="survey-content">
    <button class="survey-close" aria-label="Close">&times;</button>

    <h3>Quick question</h3>
    <p>What almost stopped you from requesting a quote today?</p>

    <div class="survey-options">
      <button data-answer="price">Unsure about pricing</button>
      <button data-answer="trust">Needed more reviews</button>
      <button data-answer="info">Couldn't find information</button>
      <button data-answer="compare">Still comparing options</button>
      <button data-answer="other">Something else</button>
    </div>

    <textarea
      id="survey-details"
      placeholder="Tell us more (optional)"
      rows="2"
      hidden
    ></textarea>
  </div>
</div>

<script define:vars={{ trigger, delay }}>
  function initSurvey() {
    const survey = document.getElementById('feedback-survey');
    if (!survey) return;
    if (sessionStorage.getItem('survey_shown')) return;

    function showSurvey() {
      survey.hidden = false;
      sessionStorage.setItem('survey_shown', '1');

      if (window.dataLayer) {
        window.dataLayer.push({ event: 'feedback_survey_shown' });
      }
    }

    // Trigger based on type
    if (trigger === 'time') {
      setTimeout(showSurvey, delay);
    } else if (trigger === 'scroll') {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          showSurvey();
          observer.disconnect();
        }
      });
      const footer = document.querySelector('footer');
      if (footer) observer.observe(footer);
    }

    // Handle responses
    survey.querySelectorAll('[data-answer]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const answer = (e.target as HTMLElement).dataset.answer;

        if (window.dataLayer) {
          window.dataLayer.push({
            event: 'feedback_survey_response',
            survey_answer: answer
          });
        }

        // Show textarea for details
        const textarea = document.getElementById('survey-details');
        if (textarea) {
          textarea.hidden = false;
          textarea.focus();
        }

        // Auto-close after 5s
        setTimeout(() => {
          survey.hidden = true;
        }, 5000);
      });
    });

    // Close button
    survey.querySelector('.survey-close')?.addEventListener('click', () => {
      survey.hidden = true;
    });
  }

  initSurvey();
</script>
```

## CRO Dashboard Metrics

```typescript
// Key metrics to track
interface CROMetrics {
  // Traffic
  sessions: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;

  // Engagement
  scrollDepth: { [key: string]: number }; // % reaching each depth
  timeOnPage: number;
  pagesPerSession: number;

  // Conversion Funnel
  landingPageViews: number;
  formStarts: number;
  formCompletions: number;
  conversionRate: number;

  // Form Analytics
  avgFormTime: number;
  fieldDropoffs: { [fieldName: string]: number };
  errorRates: { [fieldName: string]: number };

  // Qualitative
  exitIntentShown: number;
  exitIntentConverted: number;
  surveyResponses: { [answer: string]: number };
}
```

## Forbidden

- ❌ Recording without consent notice
- ❌ Capturing sensitive form fields (passwords, CC)
- ❌ Aggressive exit popups
- ❌ Tracking PII in analytics
- ❌ Making changes without data
- ❌ Ignoring mobile users

## Definition of Done

- [ ] Heatmap tool installed (Clarity/Hotjar)
- [ ] Session recording enabled with consent
- [ ] Funnel tracking for main conversion path
- [ ] Form analytics on key forms
- [ ] Scroll depth tracking
- [ ] Exit intent (if appropriate for audience)
- [ ] Key element visibility tracked
- [ ] Weekly CRO review process established
