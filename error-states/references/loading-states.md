# Loading and Offline States

## Loading State Component

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

## Offline Fallback Page

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
