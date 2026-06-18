import { describe, it, expect } from 'vitest'
import { filterEntries, mergeIntent } from './filter.js'

const mk = (overrides) => ({
  id: '1',
  ts: 0,
  feature: 'padding',
  args: [],
  target: { selector: '#x', nodePath: 'div[0]', weakRef: null },
  beforeCSS: {},
  afterCSS: { 'padding-top': '4px' },
  source: 'feature',
  correlationId: 'k',
  ...overrides,
})

describe('filterEntries', () => {
  it('feature mode keeps feature only', () => {
    const entries = [mk(), mk({ id: '2', source: 'mutation' })]
    expect(filterEntries(entries, 'feature')).toHaveLength(1)
    expect(filterEntries(entries, 'feature')[0].source).toBe('feature')
  })
})

describe('mergeIntent', () => {
  it('drops redundant mutation when feature exists in group', () => {
    const entries = [
      mk({ id: 'f', source: 'feature', correlationId: 'k' }),
      mk({ id: 'm', source: 'mutation', correlationId: 'k' }),
    ]
    const result = mergeIntent(entries)
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('feature')
  })

  it('keeps orphan mutation entries', () => {
    const entries = [mk({ id: 'm', source: 'mutation', correlationId: 'solo' })]
    expect(mergeIntent(entries)).toHaveLength(1)
  })
})
