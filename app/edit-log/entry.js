import { buildDomRefCatalog } from '../dom-ref/index.js'

const BUCKET_MS = 100

let _entrySeq = 0

export function computeNodePath(node) {
  if (!node || node.nodeType !== 1) return ''
  const segments = []
  let cur = node
  while (cur && cur.nodeType === 1 && cur !== document.documentElement.parentNode) {
    const parent = cur.parentNode
    if (!parent || parent === document) {
      segments.unshift(cur.tagName.toLowerCase())
      break
    }
    const siblings = Array.from(parent.children).filter((c) => c.tagName === cur.tagName)
    const idx = siblings.indexOf(cur)
    segments.unshift(`${cur.tagName.toLowerCase()}[${idx}]`)
    cur = parent
  }
  return segments.join('>')
}

export function snapshotComputedStyle(node, props) {
  if (!node) return {}
  const style = node.ownerDocument.defaultView.getComputedStyle(node)
  const snap = {}
  for (const p of props) {
    snap[p] = style.getPropertyValue(p).trim()
  }
  return snap
}

export function diffSnapshots(before, after) {
  const changed = []
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])
  for (const k of allKeys) {
    if (before?.[k] !== after?.[k]) changed.push(k)
  }
  return changed.sort()
}

export function snapshotTextContent(node) {
  if (!node) return {}
  return { textContent: node.textContent ?? '' }
}

export function snapshotSiblingOrder(node) {
  if (!node?.parentNode) return {}
  const parent = node.parentNode
  return {
    parentPath: computeNodePath(parent),
    index: Array.from(parent.children).indexOf(node),
    nodePath: computeNodePath(node),
  }
}

/** swapElements용 — src/target 쌍의 형제 인덱스 */
export function snapshotSwapPair(src, target) {
  return {
    src: snapshotSiblingOrder(src),
    target: snapshotSiblingOrder(target),
  }
}

export function diffDomSnapshots(before, after) {
  const changed = []
  if (!before && !after) return changed
  if (JSON.stringify(before ?? {}) !== JSON.stringify(after ?? {})) {
    changed.push('dom')
  }
  return changed
}

export function computeCorrelationId(nodePath, changedProps, ts) {
  const bucket = Math.floor(ts / BUCKET_MS)
  const propKey = [...changedProps].sort().join(',')
  return `${nodePath}|${propKey}|${bucket}`
}

export function createEntry({
  target,
  feature,
  args,
  beforeCSS,
  afterCSS,
  beforeDOM,
  afterDOM,
  source,
  ts,
  domRefRoot,
  targetRegistry,
  domRefSymbols,
  resolveDomRefSymbols,
}) {
  const nodePath = computeNodePath(target)
  const catalog = target
    ? (targetRegistry?.register?.(target, { symbols: domRefSymbols }) ?? buildDomRefCatalog(target, {
      root: domRefRoot,
      symbols: domRefSymbols,
      resolveSymbols: resolveDomRefSymbols,
    }))
    : null
  const primary = catalog?.primary ?? null
  const cssChanged = diffSnapshots(beforeCSS || {}, afterCSS || {})
  const domChanged = diffDomSnapshots(beforeDOM, afterDOM)
  const changedProps = [...cssChanged, ...domChanged]
  const identityPath = catalog?.canonical?.value ?? nodePath
  const correlationId = computeCorrelationId(identityPath, changedProps, ts)
  const id = `e_${ts}_${++_entrySeq}`
  const entry = {
    id,
    ts,
    feature,
    args,
    target: Object.freeze({
      selector: primary?.value ?? (target?.id ? `#${target.id}` : nodePath),
      nodePath,
      ...(catalog ? { catalog } : {}),
      ...(primary ? { primary: Object.freeze({ ...primary }) } : {}),
      weakRef: target ? new WeakRef(target) : null,
    }),
    beforeCSS: Object.freeze({ ...(beforeCSS || {}) }),
    afterCSS: Object.freeze({ ...(afterCSS || {}) }),
    source,
    correlationId,
  }
  if (beforeDOM != null) entry.beforeDOM = Object.freeze({ ...beforeDOM })
  if (afterDOM != null) entry.afterDOM = Object.freeze({ ...afterDOM })
  return Object.freeze(entry)
}
