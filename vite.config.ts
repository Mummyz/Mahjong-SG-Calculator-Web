import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vitest/config'
import preact from '@preact/preset-vite'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))
const fromRoot = (p: string) => fileURLToPath(new URL(p, import.meta.url))

/**
 * TRANSITIONAL SHIM — DELETE IN RUN 2.
 *
 * The constitution requires that `/` keeps serving the legacy v1 calculator,
 * byte-for-byte, until the Run 2 mobile UI ships. The v2 app is therefore built
 * to `dist/app/index.html`, and this plugin stamps the pristine v1 file over
 * `dist/index.html` after the bundle closes.
 *
 * Run 2 removes this plugin and points `rollupOptions.input` at the root, so
 * Vite's own entry takes over `dist/index.html`. `/v1/` is untouched by any of
 * this — it is served straight out of `public/v1/` and is permanent.
 */
function serveV1AtRoot(): Plugin {
  return {
    name: 'mahjongyuk:serve-v1-at-root',
    apply: 'build',
    closeBundle() {
      copyFileSync(fromRoot('public/v1/index.html'), fromRoot('dist/index.html'))
      this.info?.('v1 legacy calculator stamped over dist/index.html')
    },
  }
}

export default defineConfig({
  root: projectRoot,
  plugins: [preact(), serveV1AtRoot()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // RUN 2: change to the root index.html and drop serveV1AtRoot().
      input: { app: fromRoot('app/index.html') },
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
