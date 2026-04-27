import { createEntry, snapshotComputedStyle } from './entry.js'

export function wrapFeature({ featureName, original, dispatcher, resolveTarget, props, onWarn = console.warn }) {
  return function wrapped(...args) {
    let target = null
    let beforeCSS = {}
    try {
      target = resolveTarget(args)
      if (target) beforeCSS = snapshotComputedStyle(target, props)
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
      const entry = createEntry({
        target,
        feature: featureName,
        args,
        beforeCSS,
        afterCSS,
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
