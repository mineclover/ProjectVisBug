import { createDispatcher } from './dispatcher.js'
import { createMutationWatcher } from './mutation-watcher.js'
import { wrapFeature } from './feature-wrapper.js'
import { mergeByCorrelationId } from './merge.js'
import { filterEntries, mergeIntent } from './filter.js'
import { toCSS, toScript, toJSON } from './formatters.js'
import { replay } from './replay.js'
import { createEntry } from './entry.js'
import { setDomEntryPusher, clearDomBindings } from './dom-bind.js'
import { muteMutations, unmuteMutations } from './mutation-mute.js'
import { resolveContentRoot } from './target-filter.js'
import { createTargetRegistry, resolveDomRef, queryTargets } from '../dom-ref/index.js'

const FEATURE_PROP_MAP = {
  padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
  font: ['font-size', 'font-family', 'font-weight', 'line-height', 'color'],
  text: [],
  move: ['top', 'right', 'bottom', 'left', 'transform'],
  flex: ['display', 'flex-direction', 'justify-content', 'align-items', 'gap'],
  position: ['position', 'top', 'right', 'bottom', 'left'],
  boxshadow: ['box-shadow'],
  hueshift: ['color', 'background-color'],
  imageswap: ['src'],
  color: ['color', 'background-color'],
}

/**
 * @param {HTMLElement & Record<string, unknown>} host
 * @param {object} [opts]
 * @param {number} [opts.bufferSize]
 * @param {'filtered' | 'all'} [opts.mutationCapture] — filtered: chrome/noise 제외 + feature 중복 억제
 * @param {Element} [opts.contentRoot] — mutation 관찰·수집 경계 (기본: vis-bug 부모)
 * @param {'page-edits' | 'content-root' | 'document'} [opts.mutationScope] — 기본 page-edits (선택/편집 노드만)
 * @param {(element: Element) => Array<object>} [opts.resolveDomRefSymbols] — rlsc/qa-coord 심볼 주입 훅
 * @param {(msg: string, err?: unknown) => void} [opts.onWarn]
 */
export function installEditLog(host, opts = {}) {
  const contentRoot = resolveContentRoot(host, opts.contentRoot)
  const mutationScope = opts.mutationScope ?? 'page-edits'
  const resolveDomRefSymbols = opts.resolveDomRefSymbols
  const targetRegistry = createTargetRegistry({
    root: contentRoot,
    resolveSymbols: resolveDomRefSymbols,
  })
  const dispatcher = createDispatcher({ maxSize: opts.bufferSize, onWarn: opts.onWarn })
  const watcher = createMutationWatcher({
    root: contentRoot,
    contentRoot,
    scope: mutationScope,
    dispatcher,
    resolveFeature: () => host.active_tool?.dataset?.tool,
    targetRegistry,
    resolveDomRefSymbols,
    captureMode: opts.mutationCapture ?? 'filtered',
    onWarn: opts.onWarn,
  })

  let onEditLogFn = null
  dispatcher.subscribe((entry) => {
    host.dispatchEvent(new CustomEvent('editlog', { detail: entry, bubbles: true, composed: true }))
    if (typeof onEditLogFn === 'function') {
      try { onEditLogFn(entry) } catch (err) { (opts.onWarn || console.warn)('editLog: onEditLog setter threw', err) }
    }
  })

  watcher.start()

  setDomEntryPusher((partial) => {
    dispatcher.push(createEntry({
      ...partial,
      source: 'feature',
      ts: Date.now(),
      domRefRoot: contentRoot,
      targetRegistry,
      resolveDomRefSymbols,
    }))
  })

  host.muteEditLogMutations = () => muteMutations()
  host.unmuteEditLogMutations = () => unmuteMutations()
  host.targetRegistry = targetRegistry
  host.buildTargetRef = (element, registryOpts = {}) =>
    targetRegistry.register(element, registryOpts)
  host.getTargetRefByLabelId = (labelId) =>
    targetRegistry.getByLabelId(labelId)
  host.getTargetRefByElement = (element) =>
    targetRegistry.getByElement(element)
  host.resolveTargetRef = (catalog, resolveOpts = {}) =>
    resolveDomRef(catalog, { root: contentRoot, ...resolveOpts })
  host.queryTargets = (spec, queryOpts = {}) =>
    queryTargets(spec, { root: contentRoot, ...queryOpts })

  Object.defineProperty(host, 'onEditLog', {
    configurable: true,
    set(fn) { onEditLogFn = fn },
    get() { return onEditLogFn },
  })

  host.getHistory = (options = {}) => {
    const raw = dispatcher.getAll()
    if (options.merge === 'correlated') return mergeByCorrelationId(raw)
    if (options.merge === 'intent') return mergeIntent(raw)
    if (options.merge === 'analyzed' && typeof options.policy === 'function') return options.policy(raw)
    if (options.filter) return filterEntries(raw, options.filter)
    return raw
  }

  host.clearHistory = () => dispatcher.clear()

  host.replay = (entry, replayOpts) => replay(entry, replayOpts)

  host.editLogStream = () => {
    const queue = []
    const resolvers = []
    const unsub = dispatcher.subscribe((entry) => {
      if (resolvers.length) resolvers.shift()({ value: entry, done: false })
      else queue.push(entry)
    })
    return {
      [Symbol.asyncIterator]() {
        return {
          next: () => queue.length
            ? Promise.resolve({ value: queue.shift(), done: false })
            : new Promise((resolve) => resolvers.push(resolve)),
          return: () => { unsub(); return Promise.resolve({ value: undefined, done: true }) },
        }
      },
    }
  }

  host._editLogFormatters = { toCSS, toScript, toJSON }

  return {
    wrapFeatureFn: (featureName, original, resolveTarget, wrapOpts = {}) =>
      wrapFeature({
        featureName,
        original,
        dispatcher,
        resolveTarget,
        props: FEATURE_PROP_MAP[featureName] || [],
        snapshotDOM: wrapOpts.snapshotDOM ?? null,
        domRefRoot: contentRoot,
        targetRegistry,
        resolveDomRefSymbols,
        onWarn: opts.onWarn,
      }),
    teardown: () => {
      clearDomBindings()
      watcher.stop()
      dispatcher.clear()
      delete host.muteEditLogMutations
      delete host.unmuteEditLogMutations
      delete host.buildTargetRef
      delete host.getTargetRefByLabelId
      delete host.getTargetRefByElement
      delete host.targetRegistry
      delete host.resolveTargetRef
      delete host.queryTargets
      delete host.onEditLog
      delete host.getHistory
      delete host.clearHistory
      delete host.replay
      delete host.editLogStream
      delete host._editLogFormatters
    },
  }
}

export { mergeByCorrelationId, mergeIntent, filterEntries, toCSS, toScript, toJSON, replay }
