---
name: error-states
description: Error handling patterns for Astro sites. 404/500 pages, form errors, offline states, loading failures. Use for graceful degradation and user experience.
---

# Error States Skill

## Purpose

Provides error handling patterns that maintain trust and guide users when things go wrong.

## Core Rules

1. **Never blame the user** — "We couldn't find that" not "Invalid request"
2. **Offer next steps** — Always provide a way forward
3. **Keep branding** — Error pages should match site design
4. **Be helpful** — Search, popular links, contact info
5. **Log errors** — Track 404s to fix broken links

## 404 Page

```astro
---
// src/pages/404.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

// Get popular pages for suggestions
const popularPages = [
  { title: 'Home', href: '/' },
  { title: 'Services', href: '/services' },
  { title: 'Get a Quote', href: '/quote' },
  { title: 'Contact Us', href: '/contact' },
];

// Get recent blog posts
const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .slice(0, 3);
---

<BaseLayout title="Page Not Found" description="The page you're looking for doesn't exist.">
  <main class="min-h-[60vh] flex items-center py-16">
    <div class="container mx-auto px-4 text-center">
      <!-- Error illustration -->
      <div class="mb-8">
        <span class="text-8xl font-bold text-gray-200">404</span>
      </div>

      <h1 class="text-3xl md:text-4xl font-bold mb-4">
        Page not found
      </h1>

      <p class="text-xl text-gray-600 mb-8 max-w-md mx-auto">
        Sorry, we couldn't find the page you're looking for. It may have been moved or deleted.
      </p>

      <!-- Search -->
      <form action="/search" method="get" class="max-w-md mx-auto mb-8">
        <div class="flex gap-2">
          <input
            type="search"
            name="q"
            placeholder="Search our site..."
            class="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <button type="submit" class="btn btn-primary">
            Search
          </button>
        </div>
      </form>

      <!-- Popular links -->
      <div class="mb-12">
        <p class="text-gray-500 mb-4">Or try one of these popular pages:</p>
        <div class="flex flex-wrap justify-center gap-3">
          {popularPages.map((page) => (
            <a
              href={page.href}
              class="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              {page.title}
            </a>
          ))}
        </div>
      </div>

      <!-- Contact info -->
      <p class="text-gray-500">
        Need help? <a href="/contact" class="text-primary hover:underline">Contact us</a>
        or call <a href="tel:+441onal234567890" class="text-primary hover:underline">01onal23 456 890</a>
      </p>
    </div>
  </main>

  <!-- Track 404s -->
  <script>
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'page_not_found',
        page_url: window.location.href,
        referrer: document.referrer,
      });
    }
  </script>
</BaseLayout>
```

## 500 Error Page

```astro
---
// src/pages/500.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
---

<BaseLayout title="Something went wrong" description="An error occurred on our end.">
  <main class="min-h-[60vh] flex items-center py-16">
    <div class="container mx-auto px-4 text-center">
      <div class="mb-8">
        <span class="text-8xl font-bold text-gray-200">500</span>
      </div>

      <h1 class="text-3xl md:text-4xl font-bold mb-4">
        Something went wrong
      </h1>

      <p class="text-xl text-gray-600 mb-8 max-w-md mx-auto">
        We're experiencing technical difficulties. Our team has been notified and is working on it.
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <button
          onclick="window.location.reload()"
          class="btn btn-primary"
        >
          Try again
        </button>
        <a href="/" class="btn btn-secondary">
          Go to homepage
        </a>
      </div>

      <p class="text-gray-500">
        If this problem persists, please <a href="/contact" class="text-primary hover:underline">contact us</a>
      </p>
    </div>
  </main>
</BaseLayout>
```

## Form Error States

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

## Loading States

```astro
---
interface Props {
  message?: string;
}

const { message = 'Loading...' } = Astro.props;
---

<div class="loading-state" role="status" aria-live="polite">
  <div class="spinner" aria-hidden="true">
    <svg class="spinner-icon" viewBox="0 0 24 24">
      <circle
        class="spinner-track"
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke-width="3"
      />
      <circle
        class="spinner-head"
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
  </div>
  <p class="loading-text">{message}</p>
</div>

<style>
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .spinner-icon {
    width: 2.5rem;
    height: 2.5rem;
    animation: rotate 1s linear infinite;
  }

  .spinner-track {
    stroke: #e5e7eb;
  }

  .spinner-head {
    stroke: var(--color-primary);
    stroke-dasharray: 60;
    stroke-dashoffset: 50;
    animation: dash 1.5s ease-in-out infinite;
  }

  .loading-text {
    margin-top: 0.75rem;
    color: #6b7280;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash {
    0% {
      stroke-dashoffset: 60;
    }
    50% {
      stroke-dashoffset: 15;
    }
    100% {
      stroke-dashoffset: 60;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner-icon {
      animation-duration: 3s;
    }
    .spinner-head {
      animation: none;
      stroke-dashoffset: 15;
    }
  }
</style>
```

## Offline State

```astro
---
// Offline fallback page for service worker
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>You're Offline</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: system-ui, -apple-system, sans-serif;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f9fafb;
        padding: 1rem;
      }

      .offline-container {
        text-align: center;
        max-width: 400px;
      }

      .offline-icon {
        width: 4rem;
        height: 4rem;
        color: #9ca3af;
        margin-bottom: 1.5rem;
      }

      h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #1f2937;
      }

      p {
        color: #6b7280;
        margin-bottom: 1.5rem;
      }

      .btn {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-weight: 500;
        cursor: pointer;
      }

      .btn:hover {
        background: #2563eb;
      }
    </style>
  </head>
  <body>
    <div class="offline-container">
      <svg class="offline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>

      <h1>You're offline</h1>
      <p>Please check your internet connection and try again.</p>

      <button class="btn" onclick="window.location.reload()">
        Try again
      </button>
    </div>

    <script>
      // Auto-reload when back online
      window.addEventListener('online', () => {
        window.location.reload();
      });
    </script>
  </body>
</html>
```

## Empty States

```astro
---
interface Props {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  icon?: 'search' | 'inbox' | 'folder' | 'calendar';
}

const { title, description, action, icon = 'inbox' } = Astro.props;

const icons = {
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  inbox: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
  folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
};
---

<div class="empty-state">
  <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
    <path d={icons[icon]} stroke-linecap="round" stroke-linejoin="round" />
  </svg>

  <h3 class="empty-title">{title}</h3>
  <p class="empty-description">{description}</p>

  {action && (
    <a href={action.href} class="btn btn-primary">
      {action.label}
    </a>
  )}
</div>

<style>
  .empty-state {
    text-align: center;
    padding: 3rem 1.5rem;
  }

  .empty-icon {
    width: 3rem;
    height: 3rem;
    color: #9ca3af;
    margin: 0 auto 1rem;
  }

  .empty-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .empty-description {
    color: #6b7280;
    margin-bottom: 1.5rem;
    max-width: 20rem;
    margin-left: auto;
    margin-right: auto;
  }
</style>
```

## Network Error Handler

```typescript
// src/lib/errors/network.ts
interface FetchResult<T> {
  data: T | null;
  error: string | null;
  status: 'success' | 'error' | 'offline';
}

export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<FetchResult<T>> {
  // Check if offline
  if (!navigator.onLine) {
    return {
      data: null,
      error: 'You appear to be offline. Please check your connection.',
      status: 'offline',
    };
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      const errorMessages: Record<number, string> = {
        400: 'There was a problem with your request.',
        401: 'Please log in to continue.',
        403: 'You don\'t have permission to do this.',
        404: 'The requested resource was not found.',
        429: 'Too many requests. Please wait and try again.',
        500: 'Something went wrong on our end. Please try again.',
        503: 'Service temporarily unavailable. Please try again later.',
      };

      return {
        data: null,
        error: errorMessages[response.status] || `Error: ${response.status}`,
        status: 'error',
      };
    }

    const data = await response.json();
    return { data, error: null, status: 'success' };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          data: null,
          error: 'Request timed out. Please try again.',
          status: 'error',
        };
      }
      if (error.message.includes('NetworkError')) {
        return {
          data: null,
          error: 'Network error. Please check your connection.',
          status: 'offline',
        };
      }
    }

    return {
      data: null,
      error: 'Something went wrong. Please try again.',
      status: 'error',
    };
  }
}
```

## Toast Notifications

```astro
---
// Toast container - add to base layout
---

<div id="toast-container" class="toast-container" role="region" aria-label="Notifications"></div>

<style>
  .toast-container {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
  }

  .toast-success {
    border-left: 4px solid #22c55e;
  }

  .toast-error {
    border-left: 4px solid #ef4444;
  }

  .toast-warning {
    border-left: 4px solid #f59e0b;
  }

  .toast-info {
    border-left: 4px solid #3b82f6;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .toast {
      animation: none;
    }
  }
</style>

<script>
  type ToastType = 'success' | 'error' | 'warning' | 'info';

  function showToast(message: string, type: ToastType = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span>${message}</span>
      <button type="button" class="toast-close" aria-label="Dismiss">&times;</button>
    `;

    container.appendChild(toast);

    // Auto-dismiss
    const timeout = setTimeout(() => {
      toast.remove();
    }, duration);

    // Manual dismiss
    toast.querySelector('.toast-close')?.addEventListener('click', () => {
      clearTimeout(timeout);
      toast.remove();
    });
  }

  // Expose globally
  (window as any).showToast = showToast;
</script>
```

## Error Logging

```typescript
// src/lib/errors/logger.ts
interface ErrorLog {
  message: string;
  stack?: string;
  url: string;
  timestamp: string;
  userAgent: string;
}

export function logError(error: Error, context?: Record<string, any>): void {
  const errorLog: ErrorLog = {
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error logged:', errorLog, context);
    return;
  }

  // Send to error tracking service in production
  // Example: Sentry, LogRocket, etc.
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...errorLog, context }),
  }).catch(() => {
    // Fail silently - don't create error loops
  });
}

// Global error handler
window.addEventListener('error', (event) => {
  logError(event.error || new Error(event.message));
});

window.addEventListener('unhandledrejection', (event) => {
  logError(
    event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason))
  );
});
```

## Forbidden

- ❌ Technical jargon in error messages
- ❌ Blaming users for errors
- ❌ Generic "Something went wrong" with no next steps
- ❌ Error pages without navigation
- ❌ Silent failures (no feedback)
- ❌ Ignoring 404 tracking

## Definition of Done

- [ ] Custom 404 page with search and links
- [ ] Custom 500 page with recovery options
- [ ] Form validation with inline errors
- [ ] Loading states for async operations
- [ ] Offline fallback page
- [ ] Empty states for lists/search
- [ ] Toast notifications for actions
- [ ] Error logging in production
- [ ] All error pages match site branding
