import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'logic',
          environment: 'node',
          include: ['src/engine/**/*.test.ts', 'src/content/**/*.test.ts', 'src/app/**/*.test.ts', 'scripts/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          include: ['src/ui/**/*.test.{ts,tsx}'],
          setupFiles: ['src/ui/test/setup.ts'],
          // Vitest stubs CSS (even ?raw) unless it is processed; the contrast test reads tokens.css.
          css: { include: [/tokens\.css/] },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/app/**', 'src/ui/**'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/test-utils.ts', 'src/ui/test/**', 'src/engine/data/**'],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
});
