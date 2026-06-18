import { computeFullXPath } from './xpath.js'
import { computeLegacyNodePath } from './legacy-node-path.js'
import { countCssMatches } from './match-count.js'

const STABLE_ATTRS = [
  'data-testid',
  'data-qa-id',
  'data-qa-address',
  'data-demo-target',
  'data-test-id',
]

const DYNAMIC_ID = /^(?:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|:r[0-9]+:|react-select|headlessui-|radix-)/i
const REACT_GENERATED_ID_TOKEN = /:r[0-9]+:/i

/**
 * @typedef {object} DomRefSymbol
 * @property {'xpath' | 'css' | 'id' | 'attr' | 'nodePath' | 'xpath-relative'} kind
 * @property {string} value
 * @property {number} matchCount
 * @property {number} stability
 * @property {string} [provenance]
 */

/**
 * @param {string} ident
 */
function escapeCssIdent(ident) {
  return ident.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1')
}
function escapeAttrValue(val) {
  return String(val).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function isDynamicId(id) {
  return !id || DYNAMIC_ID.test(id) || REACT_GENERATED_ID_TOKEN.test(id)
}

/**
 * @param {Element} el
 * @param {Document | Element} root
 */
function buildShortCssPath(el, root = document) {
  const parts = []
  let cur = el
  const boundary = root.nodeType === 1 ? root : document.documentElement
  while (cur && cur.nodeType === 1 && cur !== boundary && cur !== document.documentElement) {
    let part = cur.tagName.toLowerCase()
    if (cur.id && !isDynamicId(cur.id)) {
      part = `#${escapeCssIdent(cur.id)}`
      parts.unshift(part)
      break
    }
    const classes = [...cur.classList].filter((c) => !c.startsWith('visbug-'))
    if (classes.length) {
      part += classes.slice(0, 2).map((c) => `.${escapeCssIdent(c)}`).join('')
    }
    const parent = cur.parentElement
    if (parent) {
      const sameTag = [...parent.children].filter((c) => c.tagName === cur.tagName)
      if (sameTag.length > 1) {
        const idx = sameTag.indexOf(cur) + 1
        part += `:nth-of-type(${idx})`
      }
    }
    parts.unshift(part)
    if (part.startsWith('#')) break
    cur = cur.parentElement
  }
  return parts.join(' > ')
}

/**
 * @param {string} id
 */
function idStability(id) {
  if (isDynamicId(id)) return 55
  return 85
}

/**
 * @param {Element} element
 * @param {Document | Element} root
 * @returns {DomRefSymbol[]}
 */
export function collectSymbolCandidates(element, root = document) {
  /** @type {DomRefSymbol[]} */
  const symbols = []
  const seen = new Set()

  const push = (sym) => {
    const key = `${sym.kind}:${sym.value}`
    if (seen.has(key)) return
    seen.add(key)
    symbols.push(sym)
  }

  const fullXpath = computeFullXPath(element)
  push({
    kind: 'xpath',
    value: fullXpath,
    matchCount: fullXpath ? 1 : 0,
    stability: 100,
    provenance: 'canonical',
  })

  for (const attr of STABLE_ATTRS) {
    const val = element.getAttribute(attr)
    if (!val) continue
    const css = `[${attr}="${escapeAttrValue(val)}"]`
    const matchCount = countCssMatches(css, root)
    push({
      kind: 'attr',
      value: css,
      matchCount,
      stability: matchCount === 1 ? 95 : 40,
      provenance: attr,
    })
  }

  if (element.id) {
    const css = `#${escapeCssIdent(element.id)}`
    const matchCount = countCssMatches(css, root)
    push({
      kind: 'id',
      value: css,
      matchCount,
      stability: matchCount === 1 ? idStability(element.id) : 30,
      provenance: 'id',
    })
    push({
      kind: 'xpath-relative',
      value: `//*[@id="${element.id.replace(/"/g, '\\"')}"]`,
      matchCount,
      stability: matchCount === 1 ? 50 : 20,
      provenance: 'id-xpath',
    })
  }

  const cssPath = buildShortCssPath(element, root)
  if (cssPath) {
    const matchCount = countCssMatches(cssPath, root)
    push({
      kind: 'css',
      value: cssPath,
      matchCount,
      stability: matchCount === 1 ? 75 : 35,
      provenance: 'short-css-path',
    })
  }

  const nodePath = computeLegacyNodePath(element)
  if (nodePath) {
    push({
      kind: 'nodePath',
      value: nodePath,
      matchCount: 0,
      stability: 25,
      provenance: 'legacy',
    })
  }

  return symbols.sort((a, b) => b.stability - a.stability)
}

/**
 * @param {DomRefSymbol[]} symbols
 * @param {{ excludeCanonical?: boolean }} [opts]
 * @returns {DomRefSymbol | null}
 */
export function pickPrimarySymbol(symbols, opts = {}) {
  const pool = opts.excludeCanonical
    ? symbols.filter((s) => s.provenance !== 'canonical')
    : symbols
  const unique = pool.filter((s) => s.matchCount === 1 || s.kind === 'nodePath')
  if (!unique.length) return pool[0] ?? null
  return unique.sort((a, b) => b.stability - a.stability)[0]
}
