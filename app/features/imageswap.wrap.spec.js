import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setFeatureWrapper, clearFeatureBindings } from '../edit-log/feature-bind.js'
import { wrapFeature } from '../edit-log/feature-wrapper.js'
import { createDispatcher } from '../edit-log/dispatcher.js'
import { updateContentImage } from './imageswap.js'

describe('imageswap feature bind', () => {
  let dispatcher

  beforeEach(() => {
    dispatcher = createDispatcher()
    setFeatureWrapper((name, original, resolveTarget, opts = {}) =>
      wrapFeature({
        featureName: name,
        original,
        dispatcher,
        resolveTarget,
        props: ['src'],
        snapshotDOM: opts.snapshotDOM ?? null,
      }))
  })

  afterEach(() => {
    clearFeatureBindings()
  })

  it('updateContentImage records feature entry', () => {
    const img = document.createElement('img')
    document.body.appendChild(img)
    updateContentImage(img, 'data:image/png;base64,abc')
    const entries = dispatcher.getAll()
    expect(entries).toHaveLength(1)
    expect(entries[0].source).toBe('feature')
    expect(entries[0].feature).toBe('imageswap')
    expect(img.src).toContain('data:image/png')
  })
})
