/**
 * full XPath (positional, 1-based among same-tag element siblings)
 * @param {Element | null | undefined} node
 * @returns {string}
 */
export function computeFullXPath(node) {
  if (!node || node.nodeType !== 1) return ''

  const segments = []
  let cur = node

  while (cur && cur.nodeType === 1) {
    const tag = cur.tagName.toLowerCase()
    let index = 1
    let sib = cur.previousElementSibling
    while (sib) {
      if (sib.tagName === cur.tagName) index += 1
      sib = sib.previousElementSibling
    }
    segments.unshift(`${tag}[${index}]`)

    const parent = cur.parentElement
    if (!parent || parent === cur.ownerDocument?.documentElement?.parentNode) break
    cur = parent
  }

  return `/${segments.join('/')}`
}

/**
 * @param {string} xpath
 * @param {Document | Element} [root]
 * @returns {Element | null}
 */
export function resolveFullXPath(xpath, root = document) {
  if (!xpath || typeof xpath !== 'string') return null
  const doc = root.nodeType === 9 ? root : root.ownerDocument
  if (!doc) return null
  try {
    const result = doc.evaluate(
      xpath,
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    )
    const node = result.singleNodeValue
    return node?.nodeType === 1 ? node : null
  } catch {
    return null
  }
}
