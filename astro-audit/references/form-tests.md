# Form Testing Protocol

## 10 Required Test Scenarios

Every form must pass ALL tests before release.

### Test 1: Valid Submission
```
Input: All fields valid, real data
Action: Submit form
Expected:
  - Loading state shows
  - Success message/redirect
  - Email received (check inbox)
  - Data in Google Sheets (if used)
  - GTM event fires
```

### Test 2: Empty Required Fields
```
Input: Leave required fields empty
Action: Click submit
Expected:
  - Form does NOT submit
  - Validation errors shown
  - Errors are accessible (screen reader)
  - Focus moves to first error
```

### Test 3: Invalid Email
```
Input: "notanemail", "test@", "@test.com", "test@test"
Action: Submit each
Expected:
  - Email validation error
  - Clear message: "Please enter a valid email"
  - No submission
```

### Test 4: Invalid Phone
```
Input: "abc", "123", "++44", special chars
Action: Submit each
Expected:
  - Phone validation error (if required)
  - Accepts: +44 7911 123456, 07911123456
```

### Test 5: XSS Attack
```
Input: 
  Name: <script>alert('xss')</script>
  Message: <img src=x onerror=alert('xss')>
  Email: test@<script>.com
Action: Submit
Expected:
  - Form submits (or rejects gracefully)
  - NO script execution
  - Data sanitized in email/sheets
  - No error page with stack trace
```

### Test 6: SQL Injection
```
Input:
  Name: '; DROP TABLE users; --
  Email: test@test.com' OR '1'='1
  Message: 1; DELETE FROM contacts
Action: Submit
Expected:
  - No database error
  - Data stored as literal string
  - No server error
```

### Test 7: Honeypot Trigger
```
Setup: Find hidden honeypot field (inspect HTML)
Input: Fill honeypot field with any value
Action: Submit with honeypot filled
Expected:
  - HTTP 200 response (silent fail)
  - NO email sent
  - NO data stored
  - User sees "success" (deception)
```

### Test 8: Missing Turnstile
```
Setup: Block Turnstile script in DevTools
Input: Valid form data
Action: Submit without Turnstile token
Expected:
  - Form submission rejected
  - Error message shown
  - No email sent
```

### Test 9: Rate Limiting
```
Action: Submit form 5+ times rapidly (within 1 minute)
Expected:
  - First submissions succeed
  - After threshold: "Too many requests"
  - HTTP 429 response
  - User asked to wait
```

### Test 10: Mobile Keyboard Submit
```
Device: Real iOS/Android device
Action: Fill form, tap "Done"/"Go" on keyboard
Expected:
  - Form submits correctly
  - Keyboard dismisses
  - Success state visible
  - No stuck loading
```

## Additional Form Checks

### Accessibility
- [ ] All fields have labels
- [ ] Labels linked via `for` attribute
- [ ] Error messages have `aria-live="polite"`
- [ ] Focus visible on all inputs
- [ ] Tab order logical
- [ ] Enter key submits form

### UX States
- [ ] Empty state clear
- [ ] Focus state visible
- [ ] Error state distinct (not color alone)
- [ ] Loading state shows spinner/text
- [ ] Success state obvious
- [ ] Disabled state prevents double-submit

### Progressive Enhancement
- [ ] Form works without JavaScript
- [ ] Graceful fallback if JS fails
- [ ] Server-side validation always runs

### Data Handling
- [ ] Sensitive data not logged
- [ ] GDPR consent checkbox (if required)
- [ ] Data stored correctly in destination
- [ ] Email formatting correct
- [ ] Special characters preserved (émojis, ñ, ü)

## Testing Script

```javascript
// Browser console - quick form test
async function testForm(url, data) {
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => formData.append(k, v));
  
  try {
    const res = await fetch(url, { method: 'POST', body: formData });
    console.log('Status:', res.status);
    console.log('Response:', await res.text());
  } catch (e) {
    console.error('Error:', e);
  }
}

// XSS test
testForm('/api/contact', {
  name: '<script>alert(1)</script>',
  email: 'test@test.com',
  message: '<img src=x onerror=alert(1)>'
});

// SQL injection test
testForm('/api/contact', {
  name: "'; DROP TABLE users; --",
  email: 'test@test.com',
  message: 'test'
});
```

## Bug Report Template

```markdown
## Form Bug

**Form:** Contact form
**URL:** /contact
**Test:** #5 XSS Attack
**Input:** <script>alert(1)</script> in name field
**Expected:** Sanitized, no execution
**Actual:** Script executed / Error page shown
**Severity:** CRITICAL
**Screenshot:** [attached]
```

## Definition of Done

- [ ] All 10 scenarios pass
- [ ] Accessibility checks pass
- [ ] Mobile tested on real device
- [ ] Email delivery confirmed
- [ ] Data storage confirmed
- [ ] GTM tracking confirmed
