/**
 * @leadgen/conversion-tracking - Idempotency
 */

export function generateLeadId(): string {
  const date = new Date().toISOString().slice(0, 10);
  const random = Math.random().toString(36).slice(2, 7);
  return `LD-${date}-${random}`;
}

export function generateIdempotencyKey(email: string, eventType: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const normalized = email.trim().toLowerCase();
  return simpleHash(`${normalized}:${eventType}:${date}`);
}

function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

// Phone click deduplication (per session, in memory)
const firedPhoneClicks = new Set<string>();

export function shouldFirePhoneClick(sessionId: string): boolean {
  const key = `phone:${sessionId}`;
  if (firedPhoneClicks.has(key)) return false;
  firedPhoneClicks.add(key);
  return true;
}

export function resetPhoneClickTracking(): void {
  firedPhoneClicks.clear();
}
