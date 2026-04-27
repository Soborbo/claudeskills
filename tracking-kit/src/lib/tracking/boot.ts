/**
 * One-shot client bootstrap. Imported from a bundled `<script>` block in
 * page layouts so it runs once per page-load.
 *
 * Order matters: `restoreUserDataFromStorage()` MUST run before
 * `resumeConversionTimer()`, because the timer may immediately fire a
 * late `primary_conversion` whose Meta CAPI mirror reads user data from
 * the DOM element. If the user closed the tab and reopened later, the
 * DOM element doesn't exist on a fresh page-load — restoring from
 * localStorage rebuilds it so CAPI still has hashed identifiers.
 *
 * No View Transitions / SPA-router hooks: this module is written for
 * hard-navigation MPAs. Adapt for soft navigation if needed.
 */

import { resumeConversionTimer } from './conversion-state';
import { initGlobalListeners } from './global-listeners';
import { restoreUserDataFromStorage } from './tracking';

restoreUserDataFromStorage();
resumeConversionTimer();
initGlobalListeners();
