/**
 * A VNode flattener, for tests only.
 *
 * The project has no DOM test environment and no render-to-string dependency,
 * and adding one to check that a bird has a beak is not a trade worth making.
 * This walks the tree the components return — calling nested components as it
 * goes — and emits every tag name, every attribute value and every text node
 * as one string. Enough to assert what is drawn; nothing more is needed.
 */


type Node = any

function walk(node: Node, out: string[]): void {
  if (node == null || typeof node === 'boolean') return
  if (Array.isArray(node)) { for (const n of node) walk(n, out); return }
  if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return }
  const { type, props } = node as { type: unknown; props: Record<string, Node> }
  // A component — including Fragment, which is one — is called and walked.
  if (typeof type === 'function') { walk((type as (p: unknown) => Node)(props), out); return }
  out.push(`<${String(type)}`)
  for (const [k, v] of Object.entries(props ?? {})) {
    if (k === 'children' || v == null || typeof v === 'boolean') continue
    out.push(`${k}="${String(v)}"`)
  }
  walk(props?.children, out)
}

export function renderText(node: Node): string {
  const out: string[] = []
  walk(node, out)
  return out.join(' ')
}

/**
 * Every drawn leaf of a face, with the colours it was given and the colours
 * used anywhere else inside its nearest group.
 *
 * Used by the "a shadow is never the only colour" lint. contrast.test.ts can
 * only audit TOKENS in the stylesheet; it cannot see that the centipede's
 * legs were painted in --gy-green-dp with nothing under them.
 */
export interface Mark {
  tag: string
  fill?: string
  stroke?: string
  transform?: string
  /** Every colour used anywhere in the nearest enclosing <g>. */
  group: Set<string>
}

const DRAWN = new Set(['path', 'circle', 'ellipse', 'rect', 'line', 'polygon', 'text'])

interface Ctx { fill?: string; stroke?: string; transform?: string }

/** Resolve components and build a plain tree of elements. */
interface El { tag: string; props: Record<string, Node>; kids: El[] }

function tree(node: Node, out: El[]): void {
  if (node == null || typeof node === 'boolean') return
  if (Array.isArray(node)) { for (const n of node) tree(n, out); return }
  if (typeof node === 'string' || typeof node === 'number') return
  const { type, props } = node as { type: unknown; props: Record<string, Node> }
  if (typeof type === 'function') { tree((type as (p: unknown) => Node)(props), out); return }
  const kids: El[] = []
  tree(props?.children, kids)
  out.push({ tag: String(type), props: props ?? {}, kids })
}

const colours = (el: El, into: Set<string>): void => {
  for (const k of ['fill', 'stroke'] as const) {
    const v = el.props[k]
    if (typeof v === 'string' && v !== 'none') into.add(v)
  }
  for (const k of el.kids) colours(k, into)
}

function walkEls(els: El[], ctx: Ctx, group: Set<string>, out: Mark[]): void {
  for (const el of els) {
    const here: Ctx = {
      fill: (el.props.fill as string) ?? ctx.fill,
      stroke: (el.props.stroke as string) ?? ctx.stroke,
      transform: (el.props.transform as string) ?? ctx.transform,
    }
    if (DRAWN.has(el.tag)) out.push({ tag: el.tag, ...here, group })
    if (el.kids.length) {
      const g = el.tag === 'g' ? new Set<string>() : group
      if (el.tag === 'g') colours(el, g)
      walkEls(el.kids, here, g, out)
    }
  }
}

export function marks(node: Node): Mark[] {
  const els: El[] = []
  tree(node, els)
  const root = new Set<string>()
  for (const e of els) colours(e, root)
  const out: Mark[] = []
  walkEls(els, {}, root, out)
  return out
}
