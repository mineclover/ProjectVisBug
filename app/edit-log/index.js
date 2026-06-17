import { createDispatcher } from './dispatcher.js'
import { createMutationWatcher } from './mutation-watcher.js'
import { wrapFeature } from './feature-wrapper.js'
import { mergeByCorrelationId } from './merge.js'
import { toCSS, toScript, toJSON } from './formatters.js'
import { replay } from './replay.js'

const FEATURE_PROP_MAP = {
  padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
  font: ['font-size', 'font-family', 'font-weight', 'line-height', 'color'],
  text: ['color'],
  move: ['top', 'right', 'bottom', 'left', 'transform'],
  flex: ['display', 'flex-direction', 'justify-content', 'align-items', 'gap'],
  position: ['position', 'top', 'right', 'bottom', 'left'],
  boxshadow: ['box-shadow'],
  hueshift: ['color', 'background-color'],
  imageswap: ['src'],
  color: ['color', 'background-color'],
}

export function installEditLog(host, opts = {}) {
  const dispatcher = createDispatcher({ maxSize: opts.bufferSize, onWarn: opts.onWarn })
  const watcher = createMutationWatcher({
    root: document,
    dispatcher,
    resolveFeature: () => host.active_tool?.dataset?.tool,
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

  Object.defineProperty(host, 'onEditLog', {
    configurable: true,
    set(fn) { onEditLogFn = fn },
    get() { return onEditLogFn },
  })

  host.getHistory = (options = {}) => {
    const raw = dispatcher.getAll()
    if (options.merge === 'correlated') return mergeByCorrelationId(raw)
    if (options.merge === 'analyzed' && typeof options.policy === 'function') return options.policy(raw)
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
    wrapFeatureFn: (featureName, original, resolveTarget) =>
      wrapFeature({
        featureName,
        original,
        dispatcher,
        resolveTarget,
        props: FEATURE_PROP_MAP[featureName] || [],
        onWarn: opts.onWarn,
      }),
    teardown: () => {
      watcher.stop()
      dispatcher.clear()
      delete host.onEditLog
      delete host.getHistory
      delete host.clearHistory
      delete host.replay
      delete host.editLogStream
      delete host._editLogFormatters
    },
  }
}

export { mergeByCorrelationId, toCSS, toScript, toJSON, replay }
