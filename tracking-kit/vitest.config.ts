import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@/lib/tracking/server': path.resolve(here, 'src/lib/tracking/server.ts'),
      '@/lib/tracking/config': path.resolve(here, 'src/lib/tracking/config.ts'),
      '@/lib/tracking': path.resolve(here, 'src/lib/tracking'),
      'next/server': path.resolve(here, 'tests/_stubs/next-server.ts'),
      'cloudflare:workers': path.resolve(here, 'tests/_stubs/cloudflare-workers.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    include: ['tests/unit/**/*.test.ts', 'tests/api/**/*.test.ts', 'tests/cloudflare/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/tracking/**/*.ts'],
      exclude: ['src/lib/tracking/index.ts', 'src/lib/tracking/boot.ts'],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
  },
});
