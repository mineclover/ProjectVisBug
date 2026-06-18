import { describe, it, expect, beforeEach } from 'vitest'
import { createTargetRegistry } from './target-registry.js'

describe('createTargetRegistry', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main><button data-testid="save">Save</button></main>'
  })

  it('caches catalog by element and canonical xpath', () => {
    const registry = createTargetRegistry({ root: document.body })
    const button = document.querySelector('button')

    const first = registry.register(button)
    const second = registry.register(button)

    expect(second).toBe(first)
    expect(registry.getByElement(button)).toBe(first)
    expect(registry.getByCanonical(first.canonical.value)).toBe(first)
  })

  it('maps data-label-id to the same catalog', () => {
    const registry = createTargetRegistry({ root: document.body })
    const button = document.querySelector('button')

    const catalog = registry.register(button, { labelId: '7' })

    expect(registry.getByLabelId('7')).toBe(catalog)
  })

  it('clears all session mappings', () => {
    const registry = createTargetRegistry({ root: document.body })
    const button = document.querySelector('button')
    const catalog = registry.register(button, { labelId: '7' })

    registry.clear()

    expect(registry.getByElement(button)).toBeNull()
    expect(registry.getByCanonical(catalog.canonical.value)).toBeNull()
    expect(registry.getByLabelId('7')).toBeNull()
  })
})
