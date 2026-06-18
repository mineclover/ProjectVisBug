/** edit-log entry.js 와 동일 — legacy nodePath 심볼용 */
export function computeLegacyNodePath(node) {
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
