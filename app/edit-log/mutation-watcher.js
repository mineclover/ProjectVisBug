import { createEntry, snapshotComputedStyle, diffSnapshots } from './entry.js'
import { isMutationCaptureTarget } from './target-filter.js'
import { mutationsMuted } from './mutation-mute.js'

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

/**
 * @param {object} opts
 * @param {Node} opts.root
 * @param {ReturnType<import('./dispatcher.js').createDispatcher>} opts.dispatcher
 * @param {() => string | undefined} [opts.resolveFeature]
 * @param {'filtered' | 'all'} [opts.captureMode]
 * @param {Element | Document} [opts.contentRoot]
 * @param {'page-edits' | 'content-root' | 'document'} [opts.scope]
 * @param {ReturnType<import('../dom-ref/index.js').createTargetRegistry>} [opts.targetRegistry]
 * @param {(element: Element) => import('../dom-ref/index.js').DomRefSymbol[]} [opts.resolveDomRefSymbols]
 * @param {(msg: string, err?: unknown) => void} [opts.onWarn]
 */
export function createMutationWatcher({
  root,
  dispatcher,
  resolveFeature,
  captureMode = 'filtered',
  contentRoot,
  scope = 'page-edits',
  targetRegistry,
  resolveDomRefSymbols,
  onWarn = console.warn,
}) {
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
    if (mutationsMuted()) return
    try {
      for (const m of mutations) {
        if (m.type !== 'attributes' || !TRACKED_ATTRS.includes(m.attributeName)) continue
        const target = m.target
        if (!target || target.nodeType !== 1) continue
        if (!isMutationCaptureTarget(target, { contentRoot, scope })) continue

        const after = snapshotComputedStyle(target, TRACKED_PROPS)
        const cached = beforeCache.get(target)
        if (!cached) {
          beforeCache.set(target, after)
          continue
        }

        const changed = diffSnapshots(cached, after)
        if (changed.length === 0) continue

        const beforeSlice = {}
        const afterSlice = {}
        for (const k of changed) {
          beforeSlice[k] = cached[k]
          afterSlice[k] = after[k]
        }

        const ts = Date.now()
        const entry = createEntry({
          target,
          feature: featureFor(),
          args: { attributeName: m.attributeName },
          beforeCSS: beforeSlice,
          afterCSS: afterSlice,
          source: 'mutation',
          ts,
          domRefRoot: contentRoot,
          targetRegistry,
          resolveDomRefSymbols,
        })

        if (
          captureMode === 'filtered'
          && dispatcher.hasFeatureCorrelation(entry.correlationId)
        ) {
          beforeCache.set(target, after)
          continue
        }

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
