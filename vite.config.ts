import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  resolve: { preserveSymlinks: true },
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.ts', css: false,
    coverage: { provider: 'v8', reporter: ['text', 'html'], include: ['src/services/**', 'src/store/**', 'src/components/atoms/**', 'src/utils/**'] } },
});
