function resolveTarget(entry) {
  const ref = entry.target?.weakRef
  if (ref) {
    const live = ref.deref()
    if (live && live.isConnected) return live
  }
  if (entry.target?.selector) {
    const found = document.querySelector(entry.target.selector)
    if (found) return found
  }
  return null
}

function applyCSS(target, afterCSS) {
  for (const [prop, value] of Object.entries(afterCSS || {})) {
    target.style.setProperty(prop, value)
  }
}

export function replay(entry, { mode = 'css', registry } = {}) {
  if (mode === 'css') {
    const target = resolveTarget(entry)
    if (!target) return { ok: false, reason: 'target-not-found' }
    try {
      applyCSS(target, entry.afterCSS)
      const out = { ok: true }
      if (entry.agreement === false) {
        out.warning = 'divergent-capture'
        out.divergence = entry.divergence
      }
      return out
    } catch (cause) {
      return { ok: false, reason: 'style-apply-failed', cause }
    }
  }

  if (mode === 'feature') {
    const fn = registry?.[entry.feature]
    if (typeof fn !== 'function') {
      return { ok: false, reason: 'feature-replay-failed', cause: new Error(`feature not in registry: ${entry.feature}`) }
    }
    try {
      fn.apply(null, entry.args || [])
      return { ok: true }
    } catch (cause) {
      return { ok: false, reason: 'feature-replay-failed', cause }
    }
  }

  return { ok: false, reason: 'unknown-mode' }
}
