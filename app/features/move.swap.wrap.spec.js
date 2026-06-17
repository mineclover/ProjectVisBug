import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setFeatureWrapper, clearFeatureBindings } from '../edit-log/feature-bind.js'
import { wrapFeature } from '../edit-log/feature-wrapper.js'
import { createDispatcher } from '../edit-log/dispatcher.js'
import { swapElements } from './move.js'

describe('move swapElements feature bind', () => {
  let dispatcher

  beforeEach(() => {
    dispatcher = createDispatcher()
    setFeatureWrapper((name, original, resolveTarget, opts = {}) =>
      wrapFeature({
        featureName: name,
        original,
        dispatcher,
        resolveTarget,
        props: [],
        snapshotDOM: opts.snapshotDOM ?? null,
      }))
  })

  afterEach(() => {
    clearFeatureBindings()
  })

  it('swapElements records dom feature entry', () => {
    document.body.innerHTML = '<div id="p"><em id="a"></em><b id="b"></b></div>'
    const em = document.getElementById('a')
    const b = document.getElementById('b')
    swapElements(em, b)
    const entries = dispatcher.getAll()
    expect(entries).toHaveLength(1)
    expect(entries[0].source).toBe('feature')
    expect(entries[0].feature).toBe('move')
    expect(entries[0].beforeDOM.src.index).toBe(0)
    expect(entries[0].beforeDOM.target.index).toBe(1)
    expect(entries[0].afterDOM.src.index).toBe(1)
    expect(entries[0].afterDOM.target.index).toBe(0)
  })
})
