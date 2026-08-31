import { render } from 'preact'
import { App } from './v3/App'
import { FaceDefs } from './v3/tiles/Defs'

const mount = document.getElementById('app')
// FaceDefs is a 0×0 <svg> holding the one gradient the tile artwork shares.
// It is mounted beside the app rather than inside it because App switches its
// whole root per screen, and the definitions have to outlive every switch.
if (mount) render(<><FaceDefs /><App /></>, mount)
