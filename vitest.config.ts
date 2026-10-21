import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Тесты: те же алиасы (@ -> src), что и у сборки; DOM — jsdom
export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 30000,
  },
}));
