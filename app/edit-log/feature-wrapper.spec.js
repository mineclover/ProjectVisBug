import { describe, it, expect, vi, beforeEach } from 'vitest'
import { wrapFeature } from './feature-wrapper.js'
import { createDispatcher } from './dispatcher.js'

describe('wrapFeature', () => {
  let dispatcher

  beforeEach(() => {
    document.body.innerHTML = '<div id="x"></div>'
    dispatcher = createDispatcher()
  })

  it('calls original function and pushes feature entry', () => {
    const target = document.getElementById('x')
    const original = vi.fn((node, val) => {
      node.style.paddingTop = val
    })
    const wrapped = wrapFeature({
      featureName: 'padding',
      original,
      dispatcher,
      resolveTarget: (args) => args[0],
      props: ['padding-top'],
    })

    wrapped(target, '4px')

    expect(original).toHaveBeenCalledWith(target, '4px')
    const entries = dispatcher.getAll()
    expect(entries).toHaveLength(1)
    expect(entries[0].feature).toBe('padding')
    expect(entries[0].source).toBe('feature')
    expect(entries[0].afterCSS['padding-top']).toBe('4px')
  })

  it('rethrows when original throws and does not push', () => {
    const original = vi.fn(() => { throw new Error('boom') })
    const wrapped = wrapFeature({
      featureName: 'padding',
      original,
      dispatcher,
      resolveTarget: () => document.getElementById('x'),
      props: ['padding-top'],
    })
    expect(() => wrapped()).toThrow('boom')
    expect(dispatcher.getAll()).toEqual([])
  })

  it('skips push when target cannot be resolved (warn)', () => {
    const onWarn = vi.fn()
    const original = vi.fn()
    const wrapped = wrapFeature({
      featureName: 'padding',
      original,
      dispatcher,
      resolveTarget: () => null,
      props: ['padding-top'],
      onWarn,
    })
    wrapped()
    expect(original).toHaveBeenCalled()
    expect(dispatcher.getAll()).toEqual([])
    expect(onWarn).toHaveBeenCalled()
  })
})
