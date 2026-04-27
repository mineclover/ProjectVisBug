const DEFAULT_MAX = 1000

export function createDispatcher({ maxSize = DEFAULT_MAX, onWarn = console.warn } = {}) {
  const buffer = []
  const listeners = new Set()
  let evictedOnce = false

  return {
    push(entry) {
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
    },
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
  }
}
