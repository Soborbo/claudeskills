# Heatmap & Session Recording Setup

## Microsoft Clarity Setup (Free)

### Base Integration

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

### Base Integration

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
