# Network Error Handling

## Safe Fetch Utility

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
