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
        // `/` — THE APP. v3.0.0 promoted it here from /v3/; its UI is src/v3/.
        main: fromRoot('index.html'),
        // `/v3/` — no longer the app. A static forward to the root, kept
        // because /v3/ was the preview address for four runs and is in
        // bookmarks and in every report written before the promotion.
        v3: fromRoot('v3/index.html'),
        // The Run 3 root app (src/ui/) and the /app/ engine harness were
        // retired here. They are preserved at the v2-legacy tag.
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
