import { createEntry, snapshotComputedStyle, snapshotSwapPair } from './entry.js'

export function wrapFeature({ featureName, original, dispatcher, resolveTarget, props, snapshotDOM, onWarn = console.warn }) {
  return function wrapped(...args) {
    let target = null
    let beforeCSS = {}
    let beforeDOM = null
    try {
      target = resolveTarget(args)
      if (target) beforeCSS = snapshotComputedStyle(target, props)
      if (snapshotDOM) beforeDOM = snapshotDOM(target, args)
    } catch (err) {
      onWarn(`editLog[${featureName}]: pre-capture failed`, err)
    }

    const result = original.apply(this, args)

    try {
      if (!target) {
        onWarn(`editLog[${featureName}]: target unresolved, entry skipped`)
        return result
      }
      const afterCSS = snapshotComputedStyle(target, props)
      const afterDOM = snapshotDOM ? snapshotDOM(target, args) : null
      const entry = createEntry({
        target,
        feature: featureName,
        args,
        beforeCSS,
        afterCSS,
        beforeDOM,
        afterDOM,
        source: 'feature',
        ts: Date.now(),
      })
      dispatcher.push(entry)
    } catch (err) {
      onWarn(`editLog[${featureName}]: post-capture failed`, err)
    }

    return result
  }
}

export function snapshotSwapDOM(_target, args) {
  const [src, tgt] = args
  if (!src?.parentNode || !tgt?.parentNode) return null
  return snapshotSwapPair(src, tgt)
}
