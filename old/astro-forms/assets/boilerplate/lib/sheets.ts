/**
 * Google Sheets Integration
 * Sends form data to Google Sheets via webhook
 */

const SHEETS_URL = import.meta.env.GOOGLE_SHEETS_WEBHOOK_URL;

interface SheetData {
  [key: string]: string | number | boolean | null;
}

export async function saveToSheets(
  data: SheetData,
  options?: { timeout?: number }
): Promise<{ success: boolean; error?: string }> {
  if (!SHEETS_URL) {
    console.warn('GOOGLE_SHEETS_WEBHOOK_URL not configured');
    return { success: false, error: 'Sheets not configured' };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options?.timeout || 5000
    );
    
    const response = await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    return { success: response.ok };
  } catch (error) {
    console.error('Sheets error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Non-blocking save - fire and forget
 */
export function saveToSheetsAsync(data: SheetData): void {
  saveToSheets(data).catch(err => 
    console.error('Async sheets save failed:', err)
  );
}
