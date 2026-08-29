import { render } from 'preact'

/**
 * v2 entry point. Run 2 replaces this with the real mobile UI.
 *
 * CONSTITUTION: from the first UI commit, every user-visible string goes
 * through t(). No hardcoded UI text, ever. See CLAUDE.md.
 */
function App() {
  return null
}

const mount = document.getElementById('app')
if (mount) render(<App />, mount)
