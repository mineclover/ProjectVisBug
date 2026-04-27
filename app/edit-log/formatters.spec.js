import { describe, it, expect } from 'vitest'
import { toCSS, toScript, toJSON } from './formatters.js'

const mkEntry = (overrides) => ({
  id: 'x', ts: 1, feature: 'padding', args: {},
  target: { selector: '#a', nodePath: 'a', weakRef: null },
  beforeCSS: { 'padding-top': '0px' },
  afterCSS: { 'padding-top': '4px' },
  source: 'feature', correlationId: 'k',
  ...overrides,
})

describe('toCSS', () => {
  it('groups by selector and emits changed props', () => {
    const css = toCSS([
      mkEntry({ target: { selector: '#a', nodePath: 'a' }, afterCSS: { 'padding-top': '4px' } }),
      mkEntry({ target: { selector: '#a', nodePath: 'a' }, afterCSS: { 'margin-top': '8px' } }),
    ])
    expect(css).toContain('#a {')
    expect(css).toContain('padding-top: 4px;')
    expect(css).toContain('margin-top: 8px;')
  })

  it('skips entries with no diff', () => {
    const css = toCSS([
      mkEntry({ beforeCSS: { c: '1px' }, afterCSS: { c: '1px' } }),
    ])
    expect(css.trim()).toBe('')
  })

  it('continues when single entry throws', () => {
    const bad = mkEntry({ target: null })
    const good = mkEntry({ target: { selector: '#z', nodePath: 'z' }, afterCSS: { color: 'red' } })
    const css = toCSS([bad, good])
    expect(css).toContain('#z')
  })
})

describe('toScript', () => {
  it('emits visbug feature replay calls', () => {
    const script = toScript([mkEntry({ feature: 'padding', args: ['top', 4] })])
    expect(script).toContain("visbug.replay('padding'")
  })
})

describe('toJSON', () => {
  it('returns json string with all entries', () => {
    const json = toJSON([mkEntry({ id: 'a' }), mkEntry({ id: 'b' })])
    const parsed = JSON.parse(json)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].id).toBe('a')
  })
})
