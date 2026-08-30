import { render } from 'preact'
import { DevHarness } from './ui/DevHarness'
import './ui/harness.css'

const mount = document.getElementById('app')
if (mount) render(<DevHarness />, mount)
