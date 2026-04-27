function diffAfterCSS(a, b) {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)])
  const divergence = {}
  for (const k of allKeys) {
    if (a[k] !== b[k]) {
      divergence[k] = { feature: a[k], mutation: b[k] }
    }
  }
  return divergence
}

export function mergeByCorrelationId(entries) {
  const groups = new Map()
  const order = []

  for (const e of entries) {
    if (!groups.has(e.correlationId)) {
      groups.set(e.correlationId, [])
      order.push(e.correlationId)
    }
    groups.get(e.correlationId).push(e)
  }

  return order.map((cid) => {
    const group = groups.get(cid)
    if (group.length === 1) return group[0]

    const featureEntry = group.find((e) => e.source === 'feature')
    const mutationEntry = group.find((e) => e.source === 'mutation')
    const base = featureEntry || group[0]

    const agreement = featureEntry && mutationEntry
      ? Object.keys(diffAfterCSS(featureEntry.afterCSS, mutationEntry.afterCSS)).length === 0
      : true
    const divergence = !agreement && featureEntry && mutationEntry
      ? diffAfterCSS(featureEntry.afterCSS, mutationEntry.afterCSS)
      : undefined

    return {
      ...base,
      sources: group.map((e) => e.source),
      agreement,
      ...(divergence ? { divergence } : {}),
    }
  })
}
