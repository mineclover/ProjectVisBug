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

  it('prefers CSS-compatible DomRef primary over legacy selector', () => {
    const css = toCSS([
      mkEntry({
        target: {
          selector: '#stale',
          nodePath: 'section[0]',
          primary: {
            kind: 'attr',
            value: '[data-testid="hero"]',
            matchCount: 1,
            stability: 95,
          },
        },
      }),
    ])
    expect(css).toContain('[data-testid="hero"] {')
    expect(css).not.toContain('#stale')
  })

  it('falls back to CSS-compatible catalog symbol when primary is xpath', () => {
    const css = toCSS([
      mkEntry({
        target: {
          selector: '/html[1]/body[1]/section[1]',
          nodePath: 'section[0]',
          primary: {
            kind: 'xpath',
            value: '/html[1]/body[1]/section[1]',
            matchCount: 1,
            stability: 100,
          },
          catalog: {
            canonical: { kind: 'xpath', value: '/html[1]/body[1]/section[1]' },
            symbols: [
              { kind: 'xpath', value: '/html[1]/body[1]/section[1]', matchCount: 1, stability: 100 },
              { kind: 'css', value: 'section.hero', matchCount: 1, stability: 75 },
            ],
          },
        },
      }),
    ])
    expect(css).toContain('section.hero {')
    expect(css).not.toContain('/html')
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
