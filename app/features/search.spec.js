import { describe, it, expect, vi, beforeEach } from 'vitest'
import { provideSelectorEngine, queryPage } from './search.js'

describe('queryPage', () => {
  beforeEach(() => {
    document.body.innerHTML = '<button class="save">Save</button><a>Link</a>'
  })

  it('uses selector engine queryTargets API before selecting', () => {
    const button = document.querySelector('button')
    const queryTargets = vi.fn(() => [button])
    const select = vi.fn()
    provideSelectorEngine({
      queryTargets,
      select,
      unselect_all: vi.fn(),
      selection: () => [],
    })

    queryPage('button')

    expect(queryTargets).toHaveBeenCalledWith({ by: 'css', value: 'button' })
    expect(select).toHaveBeenCalledWith(button)
  })

  it('passes API results to callback when provided', () => {
    const link = document.querySelector('a')
    const queryTargets = vi.fn(() => [link])
    const cb = vi.fn()
    provideSelectorEngine({
      queryTargets,
      select: vi.fn(),
      unselect_all: vi.fn(),
      selection: () => [],
    })

    queryPage('links', cb)

    expect(queryTargets).toHaveBeenCalledWith({ by: 'css', value: 'a' })
    expect(cb).toHaveBeenCalledWith(link)
  })
})
