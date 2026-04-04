/**
 * Session/attribution persistence
 * First touch + last touch UTM tracking via sessionStorage
 */

interface Attribution {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  referrer: string;
  landing_page: string;
  timestamp: string;
}

const FIRST_TOUCH_KEY = 'ft_attribution';
const LAST_TOUCH_KEY = 'lt_attribution';

function captureAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    referrer: document.referrer || '',
    landing_page: window.location.pathname,
    timestamp: new Date().toISOString(),
  };
}

export function initAttribution(): void {
  if (typeof window === 'undefined') return;

  const current = captureAttribution();

  // First touch — only set if not already present
  if (!sessionStorage.getItem(FIRST_TOUCH_KEY)) {
    sessionStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(current));
  }

  // Last touch — always update if UTM params present
  if (current.utm_source) {
    sessionStorage.setItem(LAST_TOUCH_KEY, JSON.stringify(current));
  }
}

export function getFirstTouch(): Attribution | null {
  try {
    const data = sessionStorage.getItem(FIRST_TOUCH_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function getLastTouch(): Attribution | null {
  try {
    const data = sessionStorage.getItem(LAST_TOUCH_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
