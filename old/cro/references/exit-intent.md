# Exit Intent Modal

## Complete Exit Intent Component

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
