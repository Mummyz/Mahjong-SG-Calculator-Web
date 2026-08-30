import { render } from 'preact'
import { App } from './v3/App'

const mount = document.getElementById('app')
if (mount) render(<App />, mount)
