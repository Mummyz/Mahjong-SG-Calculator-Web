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
        // `/` — the Run 3 app. FROZEN this run: Run 4 ships to /v3/ only, so
        // the root keeps serving exactly what the owner left it serving.
        // Its UI lives in src/ui/ and nothing in Run 4 touches it.
        main: fromRoot('index.html'),
        // `/v3/` — the Run 4 preview. Its UI lives in src/v3/.
        v3: fromRoot('v3/index.html'),
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
