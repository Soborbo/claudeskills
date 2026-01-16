/**
 * @leadgen/tracking-v2 - Offline Queue
 *
 * Queue failed requests in IndexedDB and retry when online.
 */

import { log } from './constants';

const DB_NAME = 'lg_tracking_queue';
const STORE_NAME = 'pending_requests';
const DB_VERSION = 1;
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff

interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'GET';
  body?: string;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

let db: IDBDatabase | null = null;
let isProcessing = false;

/**
 * Initialize the offline queue database
 */
export async function initOfflineQueue(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') {
    log('IndexedDB not available - offline queue disabled');
    return false;
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        log('Failed to open offline queue DB');
        resolve(false);
      };

      request.onsuccess = () => {
        db = request.result;
        log('Offline queue initialized');

        // Process any pending requests
        processQueue();

        // Listen for online events
        window.addEventListener('online', () => {
          log('Back online - processing queue');
          processQueue();
        });

        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    } catch {
      log('IndexedDB error - offline queue disabled');
      resolve(false);
    }
  });
}

/**
 * Queue a request for later retry
 */
export async function queueRequest(
  url: string,
  options: RequestInit = {}
): Promise<string> {
  const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const queuedRequest: QueuedRequest = {
    id,
    url,
    method: (options.method as 'POST' | 'GET') || 'POST',
    body: options.body as string | undefined,
    headers: options.headers as Record<string, string> | undefined,
    timestamp: Date.now(),
    retries: 0,
  };

  if (!db) {
    await initOfflineQueue();
  }

  if (!db) {
    log('Cannot queue request - DB not available');
    return id;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(queuedRequest);

      request.onsuccess = () => {
        log('Request queued:', id);
        resolve(id);
      };

      request.onerror = () => {
        log('Failed to queue request');
        resolve(id);
      };
    } catch {
      resolve(id);
    }
  });
}

/**
 * Process all pending requests in the queue
 */
export async function processQueue(): Promise<void> {
  if (!db || isProcessing || !navigator.onLine) return;

  isProcessing = true;

  try {
    const requests = await getAllPendingRequests();

    for (const req of requests) {
      try {
        const response = await fetch(req.url, {
          method: req.method,
          body: req.body,
          headers: req.headers,
        });

        if (response.ok) {
          await removeRequest(req.id);
          log('Queued request succeeded:', req.id);
        } else if (response.status >= 500) {
          // Server error - retry later
          await updateRetryCount(req);
        } else {
          // Client error - remove from queue
          await removeRequest(req.id);
          log('Queued request failed permanently:', req.id, response.status);
        }
      } catch {
        // Network error - retry later
        await updateRetryCount(req);
      }
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Fetch with offline queue fallback
 */
export async function fetchWithQueue(
  url: string,
  options: RequestInit = {}
): Promise<Response | null> {
  try {
    const response = await fetch(url, options);

    if (response.ok) {
      return response;
    }

    // Server error - queue for retry
    if (response.status >= 500) {
      await queueRequest(url, options);
    }

    return response;
  } catch {
    // Network error - queue for retry
    if (!navigator.onLine) {
      await queueRequest(url, options);
      log('Offline - request queued for later');
    }
    return null;
  }
}

// =============================================================================
// Internal helpers
// =============================================================================

async function getAllPendingRequests(): Promise<QueuedRequest[]> {
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const transaction = db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function removeRequest(id: string): Promise<void> {
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const transaction = db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(id);
      resolve();
    } catch {
      resolve();
    }
  });
}

async function updateRetryCount(req: QueuedRequest): Promise<void> {
  if (!db) return;

  if (req.retries >= MAX_RETRIES) {
    await removeRequest(req.id);
    log('Max retries reached, removing:', req.id);
    return;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put({ ...req, retries: req.retries + 1 });

      // Schedule retry with backoff
      const delay = RETRY_DELAYS[req.retries] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      setTimeout(() => processQueue(), delay);

      resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{ pending: number; oldest: number | null }> {
  const requests = await getAllPendingRequests();
  return {
    pending: requests.length,
    oldest: requests.length > 0 ? Math.min(...requests.map((r) => r.timestamp)) : null,
  };
}

/**
 * Clear all pending requests
 */
export async function clearQueue(): Promise<void> {
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const transaction = db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      log('Queue cleared');
      resolve();
    } catch {
      resolve();
    }
  });
}
