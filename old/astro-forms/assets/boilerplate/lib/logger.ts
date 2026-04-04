/**
 * Structured Logging
 */

export interface LogContext {
  requestId: string;
  ip?: string;
  path?: string;
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createLogger(context: LogContext) {
  const base = { timestamp: new Date().toISOString(), ...context };
  
  return {
    info: (message: string, data?: Record<string, unknown>) => {
      console.log(JSON.stringify({ level: 'info', message, ...base, ...data }));
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      console.warn(JSON.stringify({ level: 'warn', message, ...base, ...data }));
    },
    error: (message: string, error?: unknown, data?: Record<string, unknown>) => {
      console.error(JSON.stringify({
        level: 'error',
        message,
        error: error instanceof Error 
          ? { name: error.name, message: error.message } 
          : error,
        ...base,
        ...data,
      }));
    },
  };
}
