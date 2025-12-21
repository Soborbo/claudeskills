# Analytics Debugging

## Testing Workflow

### 1. GTM Preview Mode

```
1. GTM → Preview → Enter URL
2. Click through site
3. Verify each event in "Tags Fired"
4. Check "Data Layer" tab for parameters
```

### 2. GA4 DebugView

```
1. GA4 → Configure → DebugView
2. Enable debug mode (see below)
3. Perform actions on site
4. Verify events appear in timeline
```

### 3. Enable Debug Mode

**Option A: URL Parameter**
```
https://yoursite.com?debug_mode=true
```

**Option B: Browser Console**
```javascript
// Enable
localStorage.setItem('debug_mode', 'true');

// Disable
localStorage.removeItem('debug_mode');
```

**Option C: GTM Variable**
Create a constant variable `debug_mode` = `true` for testing.

## Common Issues & Fixes

### Event Not Firing

| Check | Solution |
|-------|----------|
| Is GTM loaded? | Check Network tab for gtm.js |
| Is Partytown working? | Check console for errors |
| Is trigger correct? | Verify event name matches |
| Is consent blocking? | Test with consent granted |

### Double-Firing

| Cause | Fix |
|-------|-----|
| Multiple triggers | Use trigger exception |
| Event bubbling | Stop propagation in handler |
| Multiple GTM containers | Remove duplicate container |

### Missing Parameters

| Check | Solution |
|-------|----------|
| DLV name matches? | Case-sensitive check |
| Push before trigger? | Move dataLayer.push earlier |
| Undefined value? | Add fallback in code |

### Consent Issues

| Symptom | Solution |
|---------|----------|
| No tracking at all | Check consent default is set |
| Tracking before consent | Check GA4 tag trigger |
| Consent not updating | Check CookieYes integration |

## Validation Checklist

### Before Deploy

```
For each required event:
□ Fires in GTM Preview
□ Fires exactly once per action
□ All parameters populated
□ Correct parameter values
□ Visible in GA4 DebugView
□ Works with consent denied then granted
```

### After Deploy

```
□ Real-time report shows activity
□ Events report shows new events (24-48h delay)
□ Conversions marked correctly
□ No alerts in GA4
```

## Console Commands

```javascript
// Check if GTM loaded
console.log(window.google_tag_manager);

// Check dataLayer contents
console.log(window.dataLayer);

// Manual event push (test)
dataLayer.push({
  event: 'cta_click',
  cta_location: 'test',
  cta_text: 'Test Button'
});

// Check consent state
console.log(window.dataLayer.find(e => e.event === 'consent_default'));
```

## Browser Extensions

| Extension | Use |
|-----------|-----|
| Google Tag Assistant | GTM debugging |
| GA Debugger | GA4 hit inspection |
| dataslayer | DataLayer viewer |
| Omnibug | Multi-platform tag debugger |

## Reporting Issues

When reporting analytics bugs, include:
1. Event name
2. Expected behavior
3. Actual behavior
4. GTM Preview screenshot
5. Console errors (if any)
6. Browser + device
