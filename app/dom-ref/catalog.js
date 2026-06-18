import { computeFullXPath } from './xpath.js'
import { collectSymbolCandidates, pickPrimarySymbol } from './symbols.js'

/**
 * @typedef {import('./symbols.js').DomRefSymbol} DomRefSymbol
 */

/**
 * @typedef {object} DomRefCatalog
 * @property {{ kind: 'xpath', value: string }} canonical
 * @property {DomRefSymbol[]} symbols
 * @property {DomRefSymbol | null} primary
 * @property {{ tagName: string, textSnippet?: string }} fingerprint
 * @property {number} capturedAt
 */

/**
 * @param {Element} element
 * @param {object} [opts]
 * @param {Document | Element} [opts.root]
 * @param {DomRefSymbol[]} [opts.symbols]
 * @param {(element: Element) => DomRefSymbol[]} [opts.resolveSymbols]
 * @returns {DomRefCatalog}
 */
export function buildDomRefCatalog(element, opts = {}) {
  const root = opts.root ?? element.ownerDocument ?? document
  const xpath = computeFullXPath(element)
  const symbols = [
    ...collectSymbolCandidates(element, root),
    ...normalizeExternalSymbols(opts.symbols ?? []),
    ...normalizeExternalSymbols(resolveExternalSymbols(element, opts.resolveSymbols)),
  ].sort((a, b) => b.stability - a.stability)
  const primary = pickPrimarySymbol(symbols, { excludeCanonical: true })
    ?? pickPrimarySymbol(symbols)

  const text = (element.textContent ?? '').trim().replace(/\s+/g, ' ')

  return Object.freeze({
    canonical: Object.freeze({ kind: 'xpath', value: xpath }),
    symbols: Object.freeze(symbols.map((s) => Object.freeze({ ...s }))),
    primary: primary ? Object.freeze({ ...primary }) : null,
    fingerprint: Object.freeze({
      tagName: element.tagName.toLowerCase(),
      ...(text ? { textSnippet: text.slice(0, 40) } : {}),
    }),
    capturedAt: Date.now(),
  })
}

function resolveExternalSymbols(element, resolver) {
  if (typeof resolver !== 'function') return []
  try {
    const symbols = resolver(element)
    return Array.isArray(symbols) ? symbols : []
  } catch {
    return []
  }
}

function normalizeExternalSymbols(symbols) {
  return symbols
    .filter((s) => s && typeof s.kind === 'string' && typeof s.value === 'string' && s.value.length > 0)
    .map((s) => ({
      kind: s.kind,
      value: s.value,
      matchCount: Number.isFinite(s.matchCount) ? s.matchCount : 1,
      stability: Number.isFinite(s.stability) ? s.stability : defaultExternalStability(s.kind),
      ...(s.provenance ? { provenance: s.provenance } : {}),
    }))
}

function defaultExternalStability(kind) {
  if (kind === 'rlsc') return 90
  if (kind === 'qa-coord') return 88
  return 50
}
