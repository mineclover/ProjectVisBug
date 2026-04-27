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
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const k of allKeys) {
    if (before[k] !== after[k]) changed.push(k)
  }
  return changed.sort()
}

export function computeCorrelationId(nodePath, changedProps, ts) {
  const bucket = Math.floor(ts / BUCKET_MS)
  const propKey = [...changedProps].sort().join(',')
  return `${nodePath}|${propKey}|${bucket}`
}

export function createEntry({ target, feature, args, beforeCSS, afterCSS, source, ts }) {
  const nodePath = computeNodePath(target)
  const changedProps = diffSnapshots(beforeCSS, afterCSS)
  const correlationId = computeCorrelationId(nodePath, changedProps, ts)
  const id = `e_${ts}_${++_entrySeq}`
  return Object.freeze({
    id,
    ts,
    feature,
    args,
    target: Object.freeze({
      selector: target?.id ? `#${target.id}` : nodePath,
      nodePath,
      weakRef: target ? new WeakRef(target) : null,
    }),
    beforeCSS: Object.freeze({ ...beforeCSS }),
    afterCSS: Object.freeze({ ...afterCSS }),
    source,
    correlationId,
  })
}
