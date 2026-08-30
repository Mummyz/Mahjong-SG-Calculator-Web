import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import preact from '@preact/preset-vite'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))
const fromRoot = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  root: projectRoot,
  plugins: [preact()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // `/` — the v2 mobile app. Took over the root in Run 2.
        main: fromRoot('index.html'),
        // `/app/` — the plain Run 1 engine harness, kept for driving the
        // engine by hand. Not the product.
        harness: fromRoot('app/index.html'),
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
