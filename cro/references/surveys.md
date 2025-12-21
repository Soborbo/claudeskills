# User Feedback Survey Component

## Complete Feedback Survey Implementation

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
