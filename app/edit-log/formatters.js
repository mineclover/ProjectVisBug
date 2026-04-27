function changedPropsOf(entry) {
  const before = entry.beforeCSS || {}
  const after = entry.afterCSS || {}
  const out = {}
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const k of keys) {
    if (before[k] !== after[k] && after[k] !== undefined) out[k] = after[k]
  }
  return out
}

export function toCSS(entries, { onWarn = console.warn } = {}) {
  const bySelector = new Map()
  for (const entry of entries) {
    try {
      const sel = entry?.target?.selector
      if (!sel) continue
      const props = changedPropsOf(entry)
      if (Object.keys(props).length === 0) continue
      if (!bySelector.has(sel)) bySelector.set(sel, {})
      Object.assign(bySelector.get(sel), props)
    } catch (err) {
      onWarn('editLog: formatter skipped entry', err)
    }
  }
  const blocks = []
  for (const [sel, props] of bySelector) {
    const lines = Object.entries(props).map(([k, v]) => `  ${k}: ${v};`).join('\n')
    blocks.push(`${sel} {\n${lines}\n}`)
  }
  return blocks.join('\n\n')
}

export function toScript(entries, { onWarn = console.warn } = {}) {
  const lines = []
  for (const entry of entries) {
    try {
      lines.push(`visbug.replay('${entry.feature}', ${JSON.stringify(entry.args)})`)
    } catch (err) {
      onWarn('editLog: script formatter skipped entry', err)
    }
  }
  return lines.join('\n')
}

export function toJSON(entries) {
  const cleaned = entries.map((e) => ({ ...e, target: { ...e.target, weakRef: undefined } }))
  return JSON.stringify(cleaned, null, 2)
}
