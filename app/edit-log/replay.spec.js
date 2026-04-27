import { describe, it, expect, vi, beforeEach } from 'vitest'
import { replay } from './replay.js'

const mkEntry = (overrides = {}) => ({
  id: 'x', ts: 1, feature: 'padding', args: ['#x', 4],
  target: { selector: '#x', nodePath: 'div[0]', weakRef: null },
  beforeCSS: { 'padding-top': '0px' },
  afterCSS: { 'padding-top': '4px' },
  source: 'feature', correlationId: 'k',
  ...overrides,
})

beforeEach(() => {
  document.body.innerHTML = '<div id="x"></div>'
})

describe('replay css mode', () => {
  it('applies afterCSS to target', () => {
    const result = replay(mkEntry(), { mode: 'css' })
    expect(result.ok).toBe(true)
    expect(document.getElementById('x').style.paddingTop).toBe('4px')
  })

  it('returns ok:false when target not found', () => {
    document.body.innerHTML = ''
    const result = replay(mkEntry(), { mode: 'css' })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('target-not-found')
  })

  it('warns on agreement===false', () => {
    const merged = { ...mkEntry(), agreement: false, divergence: { 'padding-top': { feature: '4px', mutation: '8px' } } }
    const result = replay(merged, { mode: 'css' })
    expect(result.ok).toBe(true)
    expect(result.warning).toBe('divergent-capture')
    expect(result.divergence).toBeDefined()
  })
})

describe('replay feature mode', () => {
  it('invokes feature function from registry', () => {
    const padding = vi.fn()
    const registry = { padding }
    const result = replay(mkEntry(), { mode: 'feature', registry })
    expect(result.ok).toBe(true)
    expect(padding).toHaveBeenCalled()
  })

  it('returns ok:false when feature missing', () => {
    const result = replay(mkEntry(), { mode: 'feature', registry: {} })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('feature-replay-failed')
  })
})
