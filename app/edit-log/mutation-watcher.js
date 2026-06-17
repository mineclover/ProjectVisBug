import { createEntry, snapshotComputedStyle } from './entry.js'

const TRACKED_ATTRS = ['style', 'class']
const TRACKED_PROPS = [
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'font-size', 'font-family', 'font-weight', 'line-height',
  'color', 'background-color',
  'width', 'height',
  'display', 'position', 'top', 'right', 'bottom', 'left',
  'box-shadow', 'border-radius',
]

export function createMutationWatcher({ root, dispatcher, resolveFeature, onWarn = console.warn }) {
  let observer = null
  const beforeCache = new WeakMap()
  const featureFor = () => {
    try {
      const name = resolveFeature?.()
      return typeof name === 'string' && name.length > 0 ? name : 'unknown'
    } catch (err) {
      onWarn('editLog: resolveFeature failed', err)
      return 'unknown'
    }
  }

  const observerCallback = (mutations) => {
    try {
      for (const m of mutations) {
        if (m.type !== 'attributes' || !TRACKED_ATTRS.includes(m.attributeName)) continue
        const target = m.target
        if (!target || target.nodeType !== 1) continue
        const before = beforeCache.get(target) || {}
        const after = snapshotComputedStyle(target, TRACKED_PROPS)
        const ts = Date.now()
        const entry = createEntry({
          target,
          feature: featureFor(),
          args: { attributeName: m.attributeName },
          beforeCSS: before,
          afterCSS: after,
          source: 'mutation',
          ts,
        })
        dispatcher.push(entry)
        beforeCache.set(target, after)
      }
    } catch (err) {
      onWarn('editLog: mutation observer error', err)
    }
  }

  return {
    start() {
      if (observer) return
      observer = new MutationObserver(observerCallback)
      observer.observe(root, {
        attributes: true,
        attributeFilter: TRACKED_ATTRS,
        attributeOldValue: false,
        subtree: true,
        childList: false,
        characterData: false,
      })
    },
    stop() {
      observer?.disconnect()
      observer = null
    },
  }
}
