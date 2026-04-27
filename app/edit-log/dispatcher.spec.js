import { describe, it, expect, vi } from 'vitest'
import { createDispatcher } from './dispatcher.js'

const mkEntry = (i) => ({ id: `e${i}`, ts: i, source: 'feature' })

describe('createDispatcher', () => {
  it('push then getAll returns entries in order', () => {
    const d = createDispatcher()
    d.push(mkEntry(1))
    d.push(mkEntry(2))
    expect(d.getAll().map((e) => e.id)).toEqual(['e1', 'e2'])
  })

  it('subscribe is called for each push', () => {
    const d = createDispatcher()
    const cb = vi.fn()
    d.subscribe(cb)
    d.push(mkEntry(1))
    d.push(mkEntry(2))
    expect(cb).toHaveBeenCalledTimes(2)
    expect(cb.mock.calls[0][0].id).toBe('e1')
  })

  it('multiple subscribers all receive', () => {
    const d = createDispatcher()
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    d.subscribe(cb1)
    d.subscribe(cb2)
    d.push(mkEntry(1))
    expect(cb1).toHaveBeenCalledOnce()
    expect(cb2).toHaveBeenCalledOnce()
  })

  it('unsubscribe stops further calls', () => {
    const d = createDispatcher()
    const cb = vi.fn()
    const unsub = d.subscribe(cb)
    d.push(mkEntry(1))
    unsub()
    d.push(mkEntry(2))
    expect(cb).toHaveBeenCalledOnce()
  })

  it('listener throwing does not block other listeners', () => {
    const d = createDispatcher()
    const cbBad = vi.fn(() => { throw new Error('boom') })
    const cbGood = vi.fn()
    d.subscribe(cbBad)
    d.subscribe(cbGood)
    d.push(mkEntry(1))
    expect(cbGood).toHaveBeenCalledOnce()
  })

  it('ring buffer evicts oldest at maxSize', () => {
    const d = createDispatcher({ maxSize: 3 })
    d.push(mkEntry(1))
    d.push(mkEntry(2))
    d.push(mkEntry(3))
    d.push(mkEntry(4))
    expect(d.getAll().map((e) => e.id)).toEqual(['e2', 'e3', 'e4'])
  })

  it('clear empties buffer', () => {
    const d = createDispatcher()
    d.push(mkEntry(1))
    d.clear()
    expect(d.getAll()).toEqual([])
  })
})
