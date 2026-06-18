import { resolveFullXPath } from './xpath.js'

/**
 * @typedef {import('./symbols.js').DomRefSymbol} DomRefSymbol
 * @typedef {import('./catalog.js').DomRefCatalog} DomRefCatalog
 */

/**
 * @param {DomRefSymbol} symbol
 * @param {Document | Element} root
 * @returns {Element | null}
 */
export function resolveSymbol(symbol, root = document) {
  if (!symbol?.value) return null
  switch (symbol.kind) {
    case 'xpath':
    case 'xpath-relative':
      return resolveFullXPath(symbol.value, root)
    case 'css':
    case 'id':
    case 'attr':
      try {
        const el = root.querySelector(symbol.value)
        return el?.nodeType === 1 ? el : null
      } catch {
        return null
      }
    case 'nodePath':
      return null
    default:
      return null
  }
}

/**
 * @param {DomRefCatalog} catalog
 * @param {object} [opts]
 * @param {Document | Element} [opts.root]
 * @param {'prefer-stable' | 'canonical-only'} [opts.strategy]
 * @returns {Element | null}
 */
export function resolveDomRef(catalog, opts = {}) {
  if (!catalog) return null
  const root = opts.root ?? document
  const strategy = opts.strategy ?? 'prefer-stable'

  if (strategy === 'canonical-only') {
    return resolveFullXPath(catalog.canonical?.value, root)
  }

  const ordered = [...(catalog.symbols ?? [])]
    .filter((s) => s.matchCount === 1 || s.kind === 'xpath')
    .sort((a, b) => b.stability - a.stability)

  for (const sym of ordered) {
    if (sym.kind === 'nodePath') continue
    const el = resolveSymbol(sym, root)
    if (el) return el
  }

  return resolveFullXPath(catalog.canonical?.value, root)
}

/**
 * @param {{ by: 'css' | 'xpath', value: string } | { by: 'symbol', symbol: DomRefSymbol } | { by: 'catalog', catalog: DomRefCatalog }} spec
 * @param {object} [opts]
 * @param {Document | Element} [opts.root]
 * @returns {Element[]}
 */
export function queryTargets(spec, opts = {}) {
  const root = opts.root ?? document
  if (!spec) return []

  if (spec.by === 'xpath') {
    if (!spec.value) return []
    const el = resolveFullXPath(spec.value, root)
    return el ? [el] : []
  }

  if (spec.by === 'symbol') {
    const el = resolveSymbol(spec.symbol, root)
    return el ? [el] : []
  }

  if (spec.by === 'catalog') {
    const el = resolveDomRef(spec.catalog, { root })
    return el ? [el] : []
  }

  if (spec.by === 'css') {
    if (!spec.value) return []
    try {
      return [...root.querySelectorAll(spec.value)].filter((n) => n.nodeType === 1)
    } catch {
      return []
    }
  }

  return []
}
