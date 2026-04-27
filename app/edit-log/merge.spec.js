import { describe, it, expect } from 'vitest'
import { mergeByCorrelationId } from './merge.js'

const mkEntry = (overrides) => ({
  id: 'x',
  ts: 0,
  feature: 'unknown',
  args: {},
  target: { selector: '#a', nodePath: 'a', weakRef: null },
  beforeCSS: {},
  afterCSS: {},
  source: 'mutation',
  correlationId: 'cid',
  ...overrides,
})

describe('mergeByCorrelationId', () => {
  it('returns entries unchanged when no correlation matches', () => {
    const entries = [
      mkEntry({ id: '1', correlationId: 'a' }),
      mkEntry({ id: '2', correlationId: 'b' }),
    ]
    const result = mergeByCorrelationId(entries)
    expect(result).toHaveLength(2)
  })

  it('merges entries with same correlationId', () => {
    const entries = [
      mkEntry({ id: '1', source: 'feature', feature: 'padding', correlationId: 'k', afterCSS: { 'padding-top': '4px' } }),
      mkEntry({ id: '2', source: 'mutation', correlationId: 'k', afterCSS: { 'padding-top': '4px' } }),
    ]
    const result = mergeByCorrelationId(entries)
    expect(result).toHaveLength(1)
    expect(result[0].sources).toEqual(['feature', 'mutation'])
    expect(result[0].feature).toBe('padding')
    expect(result[0].agreement).toBe(true)
  })

  it('marks agreement false when afterCSS differs', () => {
    const entries = [
      mkEntry({ id: '1', source: 'feature', correlationId: 'k', afterCSS: { 'padding-top': '4px' } }),
      mkEntry({ id: '2', source: 'mutation', correlationId: 'k', afterCSS: { 'padding-top': '8px' } }),
    ]
    const result = mergeByCorrelationId(entries)
    expect(result[0].agreement).toBe(false)
    expect(result[0].divergence).toEqual({
      'padding-top': { feature: '4px', mutation: '8px' },
    })
  })

  it('preserves order based on first occurrence', () => {
    const entries = [
      mkEntry({ id: '1', correlationId: 'a' }),
      mkEntry({ id: '2', correlationId: 'b' }),
      mkEntry({ id: '3', correlationId: 'a' }),
    ]
    const result = mergeByCorrelationId(entries)
    expect(result.map((e) => e.correlationId || e.id)).toEqual(['a', 'b'])
  })
})
