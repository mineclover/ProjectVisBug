import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  bindFeatureCall,
  setFeatureWrapper,
  clearFeatureBindings,
  resolveFirstSelected,
} from './feature-bind.js'
import { wrapFeature } from './feature-wrapper.js'
import { createDispatcher } from './dispatcher.js'

describe('feature-bind', () => {
  let dispatcher

  beforeEach(() => {
    document.body.innerHTML = '<div id="x"></div>'
    dispatcher = createDispatcher()
    setFeatureWrapper((name, original, resolveTarget, opts = {}) =>
      wrapFeature({
        featureName: name,
        original,
        dispatcher,
        resolveTarget,
        props: ['padding-top'],
        snapshotDOM: opts.snapshotDOM ?? null,
      }))
  })

  afterEach(() => {
    clearFeatureBindings()
  })

  it('delegates to original when wrapper not set', () => {
    clearFeatureBindings()
    const original = vi.fn()
    const bound = bindFeatureCall('padding', original, resolveFirstSelected)
    bound([document.getElementById('x')], 'up')
    expect(original).toHaveBeenCalledOnce()
    expect(dispatcher.getAll()).toEqual([])
  })

  it('wraps calls and caches by cacheKey', () => {
    const original = vi.fn((els) => {
      els[0].style.paddingTop = '5px'
    })
    const bound = bindFeatureCall('padding', original, resolveFirstSelected)
    const el = document.getElementById('x')
    bound([el], 'up')
    bound([el], 'down')
    expect(original).toHaveBeenCalledTimes(2)
    expect(dispatcher.getAll()).toHaveLength(2)
    expect(dispatcher.getAll()[0].source).toBe('feature')
  })
})
