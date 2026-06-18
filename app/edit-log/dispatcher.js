const DEFAULT_MAX = 1000
const FEATURE_CORRELATION_TTL_MS = 10_000

export function createDispatcher({ maxSize = DEFAULT_MAX, onWarn = console.warn } = {}) {
  const buffer = []
  const listeners = new Set()
  /** @type {Map<string, number>} */
  const featureCorrelations = new Map()
  let evictedOnce = false

  const pruneFeatureCorrelations = (now = Date.now()) => {
    for (const [cid, ts] of featureCorrelations) {
      if (now - ts > FEATURE_CORRELATION_TTL_MS) featureCorrelations.delete(cid)
    }
  }

  return {
    push(entry) {
      if (entry.source === 'feature') {
        pruneFeatureCorrelations(entry.ts)
        featureCorrelations.set(entry.correlationId, entry.ts)
      }
      buffer.push(entry)
      if (buffer.length > maxSize) {
        buffer.shift()
        if (!evictedOnce) {
          onWarn('editLog: ring buffer evicted oldest entry; bufferSize=', maxSize)
          evictedOnce = true
        }
      }
      for (const cb of listeners) {
        try {
          cb(entry)
        } catch (err) {
          onWarn('editLog: listener threw', err)
        }
      }
    },
    getAll() {
      return buffer.slice()
    },
    clear() {
      buffer.length = 0
      featureCorrelations.clear()
    },
    hasFeatureCorrelation(correlationId) {
      pruneFeatureCorrelations()
      return featureCorrelations.has(correlationId)
    },
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
  }
}
