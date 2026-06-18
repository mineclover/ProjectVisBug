import { buildDomRefCatalog } from './catalog.js'

export function createTargetRegistry({ root = document, resolveSymbols } = {}) {
  const byCanonical = new Map()
  const byLabelId = new Map()
  const byElement = new WeakMap()

  const register = (element, opts = {}) => {
    if (!element || element.nodeType !== 1) return null

    const existingCanonical = byElement.get(element)
    const existing = existingCanonical ? byCanonical.get(existingCanonical) : null
    const catalog = existing ?? buildDomRefCatalog(element, {
      root,
      resolveSymbols,
      symbols: opts.symbols,
    })

    byElement.set(element, catalog.canonical.value)
    byCanonical.set(catalog.canonical.value, catalog)

    if (opts.labelId != null) {
      byLabelId.set(String(opts.labelId), catalog.canonical.value)
    }

    return catalog
  }

  const getByCanonical = (canonical) =>
    byCanonical.get(canonical) ?? null

  const getByLabelId = (labelId) => {
    const canonical = byLabelId.get(String(labelId))
    return canonical ? getByCanonical(canonical) : null
  }

  const getByElement = (element) => {
    const canonical = byElement.get(element)
    return canonical ? getByCanonical(canonical) : null
  }

  const clear = () => {
    byCanonical.clear()
    byLabelId.clear()
  }

  return {
    register,
    getByCanonical,
    getByLabelId,
    getByElement,
    clear,
  }
}
