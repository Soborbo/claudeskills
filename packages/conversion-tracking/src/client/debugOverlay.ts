/**
 * @leadgen/conversion-tracking - Debug Overlay
 *
 * Visual debugging panel for tracking events.
 */

import { getOrCreateSessionId } from './session';
import { getFirstTouch, getLastTouch } from './params';
import { getConsentState } from './consent';
import { isZarazAvailable } from './zaraz';
import { TRACKING_VERSION } from './constants';
import { getQueueStats } from './offlineQueue';

interface DebugEvent {
  timestamp: number;
  type: 'event' | 'conversion' | 'phone' | 'error' | 'info';
  name: string;
  data?: Record<string, unknown>;
}

const MAX_EVENTS = 50;
const events: DebugEvent[] = [];
let overlayElement: HTMLElement | null = null;
let isVisible = false;

// =============================================================================
// Event Logging
// =============================================================================

export function logDebugEvent(
  type: DebugEvent['type'],
  name: string,
  data?: Record<string, unknown>
): void {
  events.unshift({
    timestamp: Date.now(),
    type,
    name,
    data,
  });

  // Keep only last N events
  if (events.length > MAX_EVENTS) {
    events.pop();
  }

  // Update overlay if visible
  if (isVisible) {
    updateOverlay();
  }
}

// =============================================================================
// Overlay UI
// =============================================================================

function createOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = 'lg-tracking-debug';
  overlay.innerHTML = `
    <style>
      #lg-tracking-debug {
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 380px;
        max-height: 500px;
        background: #1a1a2e;
        color: #eee;
        font-family: 'SF Mono', Monaco, 'Courier New', monospace;
        font-size: 11px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        z-index: 999999;
        overflow: hidden;
      }
      #lg-tracking-debug * {
        box-sizing: border-box;
      }
      .lg-debug-header {
        background: #16213e;
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #0f3460;
        cursor: move;
      }
      .lg-debug-title {
        font-weight: 600;
        color: #00d9ff;
      }
      .lg-debug-close {
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
        font-size: 16px;
        padding: 0 4px;
      }
      .lg-debug-close:hover {
        color: #fff;
      }
      .lg-debug-tabs {
        display: flex;
        background: #16213e;
        border-bottom: 1px solid #0f3460;
      }
      .lg-debug-tab {
        padding: 6px 12px;
        cursor: pointer;
        color: #888;
        border: none;
        background: none;
        font-size: 11px;
      }
      .lg-debug-tab.active {
        color: #00d9ff;
        border-bottom: 2px solid #00d9ff;
      }
      .lg-debug-content {
        max-height: 350px;
        overflow-y: auto;
        padding: 8px;
      }
      .lg-debug-section {
        margin-bottom: 12px;
      }
      .lg-debug-section-title {
        color: #888;
        font-size: 10px;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .lg-debug-row {
        display: flex;
        justify-content: space-between;
        padding: 2px 0;
        border-bottom: 1px solid #2a2a4a;
      }
      .lg-debug-key {
        color: #888;
      }
      .lg-debug-value {
        color: #4ade80;
        text-align: right;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .lg-debug-value.error {
        color: #f87171;
      }
      .lg-debug-value.warning {
        color: #fbbf24;
      }
      .lg-debug-event {
        padding: 6px 8px;
        margin: 4px 0;
        background: #2a2a4a;
        border-radius: 4px;
        border-left: 3px solid #4ade80;
      }
      .lg-debug-event.conversion {
        border-left-color: #00d9ff;
      }
      .lg-debug-event.error {
        border-left-color: #f87171;
      }
      .lg-debug-event.phone {
        border-left-color: #a78bfa;
      }
      .lg-debug-event-name {
        font-weight: 600;
        margin-bottom: 2px;
      }
      .lg-debug-event-time {
        color: #666;
        font-size: 10px;
      }
      .lg-debug-event-data {
        color: #888;
        font-size: 10px;
        margin-top: 4px;
        word-break: break-all;
      }
      .lg-debug-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        margin-left: 4px;
      }
      .lg-debug-badge.ok {
        background: #065f46;
        color: #4ade80;
      }
      .lg-debug-badge.warn {
        background: #78350f;
        color: #fbbf24;
      }
      .lg-debug-badge.error {
        background: #7f1d1d;
        color: #f87171;
      }
    </style>
    <div class="lg-debug-header">
      <span class="lg-debug-title">🔍 Tracking Debug</span>
      <button class="lg-debug-close" onclick="window.__lgDebug?.hide()">✕</button>
    </div>
    <div class="lg-debug-tabs">
      <button class="lg-debug-tab active" data-tab="events">Events</button>
      <button class="lg-debug-tab" data-tab="state">State</button>
      <button class="lg-debug-tab" data-tab="attribution">Attribution</button>
    </div>
    <div class="lg-debug-content" id="lg-debug-content"></div>
  `;

  // Tab switching
  overlay.querySelectorAll('.lg-debug-tab').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      overlay.querySelectorAll('.lg-debug-tab').forEach((t) => t.classList.remove('active'));
      target.classList.add('active');
      updateOverlay(target.dataset.tab);
    });
  });

  return overlay;
}

async function updateOverlay(tab = 'events'): Promise<void> {
  if (!overlayElement) return;

  const content = overlayElement.querySelector('#lg-debug-content');
  if (!content) return;

  if (tab === 'events') {
    content.innerHTML = renderEventsTab();
  } else if (tab === 'state') {
    content.innerHTML = await renderStateTab();
  } else if (tab === 'attribution') {
    content.innerHTML = renderAttributionTab();
  }
}

function renderEventsTab(): string {
  if (events.length === 0) {
    return '<div style="color: #666; text-align: center; padding: 20px;">No events yet</div>';
  }

  return events
    .map((event) => {
      const time = new Date(event.timestamp).toLocaleTimeString();
      const dataStr = event.data ? JSON.stringify(event.data, null, 0).slice(0, 100) : '';

      return `
        <div class="lg-debug-event ${event.type}">
          <div class="lg-debug-event-name">${event.name}</div>
          <div class="lg-debug-event-time">${time}</div>
          ${dataStr ? `<div class="lg-debug-event-data">${dataStr}${dataStr.length >= 100 ? '...' : ''}</div>` : ''}
        </div>
      `;
    })
    .join('');
}

async function renderStateTab(): Promise<string> {
  const consent = getConsentState();
  const sessionId = getOrCreateSessionId();
  const zarazOk = isZarazAvailable();
  const queueStats = await getQueueStats();

  return `
    <div class="lg-debug-section">
      <div class="lg-debug-section-title">Session</div>
      <div class="lg-debug-row">
        <span class="lg-debug-key">Session ID</span>
        <span class="lg-debug-value">${sessionId.slice(0, 20)}...</span>
      </div>
      <div class="lg-debug-row">
        <span class="lg-debug-key">Version</span>
        <span class="lg-debug-value">${TRACKING_VERSION}</span>
      </div>
    </div>

    <div class="lg-debug-section">
      <div class="lg-debug-section-title">Consent</div>
      <div class="lg-debug-row">
        <span class="lg-debug-key">Analytics</span>
        <span class="lg-debug-value">${consent.analytics ? '✓' : '✗'}</span>
      </div>
      <div class="lg-debug-row">
        <span class="lg-debug-key">Marketing</span>
        <span class="lg-debug-value">${consent.marketing ? '✓' : '✗'}</span>
      </div>
    </div>

    <div class="lg-debug-section">
      <div class="lg-debug-section-title">Integrations</div>
      <div class="lg-debug-row">
        <span class="lg-debug-key">GTM</span>
        <span class="lg-debug-value">${typeof window.dataLayer !== 'undefined' ? '✓ Ready' : '✗ Missing'}</span>
      </div>
      <div class="lg-debug-row">
        <span class="lg-debug-key">Zaraz</span>
        <span class="lg-debug-value">${zarazOk ? '✓ Ready' : '✗ Missing'}</span>
      </div>
      <div class="lg-debug-row">
        <span class="lg-debug-key">Offline Queue</span>
        <span class="lg-debug-value">${queueStats.pending} pending</span>
      </div>
    </div>

    <div class="lg-debug-section">
      <div class="lg-debug-section-title">Network</div>
      <div class="lg-debug-row">
        <span class="lg-debug-key">Online</span>
        <span class="lg-debug-value">${navigator.onLine ? '✓ Yes' : '✗ Offline'}</span>
      </div>
    </div>
  `;
}

function renderAttributionTab(): string {
  const first = getFirstTouch();
  const last = getLastTouch();

  const renderAttribution = (data: typeof first, label: string) => {
    if (!data) {
      return `<div style="color: #666; padding: 8px;">No ${label.toLowerCase()} data</div>`;
    }

    return `
      <div class="lg-debug-section">
        <div class="lg-debug-section-title">${label}</div>
        ${data.utm_source ? `<div class="lg-debug-row"><span class="lg-debug-key">Source</span><span class="lg-debug-value">${data.utm_source}</span></div>` : ''}
        ${data.utm_medium ? `<div class="lg-debug-row"><span class="lg-debug-key">Medium</span><span class="lg-debug-value">${data.utm_medium}</span></div>` : ''}
        ${data.utm_campaign ? `<div class="lg-debug-row"><span class="lg-debug-key">Campaign</span><span class="lg-debug-value">${data.utm_campaign}</span></div>` : ''}
        ${data.gclid ? `<div class="lg-debug-row"><span class="lg-debug-key">GCLID</span><span class="lg-debug-value">${data.gclid.slice(0, 20)}...</span></div>` : ''}
        ${data.fbclid ? `<div class="lg-debug-row"><span class="lg-debug-key">FBCLID</span><span class="lg-debug-value">${data.fbclid.slice(0, 20)}...</span></div>` : ''}
        ${data.referrer ? `<div class="lg-debug-row"><span class="lg-debug-key">Referrer</span><span class="lg-debug-value">${data.referrer}</span></div>` : ''}
        ${data.landingPage ? `<div class="lg-debug-row"><span class="lg-debug-key">Landing</span><span class="lg-debug-value">${data.landingPage}</span></div>` : ''}
      </div>
    `;
  };

  return renderAttribution(first, 'First Touch') + renderAttribution(last, 'Last Touch');
}

// =============================================================================
// Public API
// =============================================================================

export function showDebugOverlay(): void {
  if (typeof document === 'undefined') return;

  if (!overlayElement) {
    overlayElement = createOverlay();
    document.body.appendChild(overlayElement);
  }

  overlayElement.style.display = 'block';
  isVisible = true;
  updateOverlay();

  // Expose hide function globally
  (window as unknown as Record<string, unknown>).__lgDebug = { hide: hideDebugOverlay };
}

export function hideDebugOverlay(): void {
  if (overlayElement) {
    overlayElement.style.display = 'none';
  }
  isVisible = false;
}

export function toggleDebugOverlay(): void {
  if (isVisible) {
    hideDebugOverlay();
  } else {
    showDebugOverlay();
  }
}

export function isDebugOverlayVisible(): boolean {
  return isVisible;
}

/**
 * Initialize debug mode with keyboard shortcut
 */
export function initDebugMode(): void {
  // Ctrl+Shift+T to toggle
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      toggleDebugOverlay();
    }
  });

  logDebugEvent('info', 'Debug mode enabled', { shortcut: 'Ctrl+Shift+T' });
}
