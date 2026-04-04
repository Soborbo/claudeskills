/**
 * Structured JSON logging with request correlation
 */

export function createLogger(requestId?: string) {
  const id = requestId || crypto.randomUUID().slice(0, 8);

  return {
    info: (message: string, data?: Record<string, unknown>) => {
      console.log(JSON.stringify({ level: 'info', requestId: id, message, ...data, timestamp: new Date().toISOString() }));
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      console.warn(JSON.stringify({ level: 'warn', requestId: id, message, ...data, timestamp: new Date().toISOString() }));
    },
    error: (message: string, data?: Record<string, unknown>) => {
      console.error(JSON.stringify({ level: 'error', requestId: id, message, ...data, timestamp: new Date().toISOString() }));
    },
  };
}
