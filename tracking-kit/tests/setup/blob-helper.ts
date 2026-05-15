/**
 * jsdom's Blob lacks `.text()` natively — we patch it in
 * vitest.setup.ts so tests can read sendBeacon payloads back without
 * needing FileReader (which is async via setTimeout and breaks under
 * fake timers).
 */

function looksLikeBlob(v: unknown): boolean {
  return (
    !!v &&
    typeof v === 'object' &&
    typeof (v as { size?: number }).size === 'number' &&
    typeof (v as { type?: string }).type === 'string' &&
    typeof (v as { text?: () => Promise<string> }).text === 'function'
  );
}

export async function readBlob(blob: unknown): Promise<string> {
  if (looksLikeBlob(blob)) {
    return (blob as Blob).text();
  }
  if (typeof blob === 'string') return blob;
  return String(blob);
}

export async function readBlobJSON<T = unknown>(blob: unknown): Promise<T> {
  return JSON.parse(await readBlob(blob));
}
