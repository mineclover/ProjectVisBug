import { describe, it, expect } from 'vitest'
import {
  computeNodePath,
  snapshotComputedStyle,
  diffSnapshots,
  diffDomSnapshots,
  snapshotTextContent,
  snapshotSwapPair,
  computeCorrelationId,
  createEntry,
} from './entry.js'

describe('computeNodePath', () => {
  it('returns same path for same node twice', () => {
    document.body.innerHTML = '<div><span id="x"></span></div>'
    const node = document.getElementById('x')
    expect(computeNodePath(node)).toBe(computeNodePath(node))
  })

  it('encodes ancestor index', () => {
    document.body.innerHTML = '<section><p></p><p id="t"></p></section>'
    const node = document.getElementById('t')
    expect(computeNodePath(node)).toMatch(/section\[\d+\]>p\[1\]/)
  })
})

describe('snapshotComputedStyle', () => {
  it('returns only requested props', () => {
    document.body.innerHTML = '<div id="x" style="padding-top: 4px; color: red;"></div>'
    const node = document.getElementById('x')
    const snap = snapshotComputedStyle(node, ['padding-top', 'color'])
    expect(Object.keys(snap).sort()).toEqual(['color', 'padding-top'])
    expect(snap['padding-top']).toBe('4px')
  })
})

describe('diffSnapshots', () => {
  it('returns props that changed', () => {
    const before = { 'padding-top': '4px', color: 'red' }
    const after = { 'padding-top': '8px', color: 'red' }
    expect(diffSnapshots(before, after)).toEqual(['padding-top'])
  })

  it('returns empty array when nothing changed', () => {
    const before = { 'padding-top': '4px' }
    const after = { 'padding-top': '4px' }
    expect(diffSnapshots(before, after)).toEqual([])
  })
})

describe('computeCorrelationId', () => {
  it('is deterministic for same inputs', () => {
    const id1 = computeCorrelationId('html>body>div[0]', ['padding-top'], 1700000000000)
    const id2 = computeCorrelationId('html>body>div[0]', ['padding-top'], 1700000000000)
    expect(id1).toBe(id2)
  })

  it('uses 100ms bucket (same id within bucket)', () => {
    const id1 = computeCorrelationId('p', ['x'], 1700000000050)
    const id2 = computeCorrelationId('p', ['x'], 1700000000099)
    expect(id1).toBe(id2)
  })

  it('changes across bucket boundary', () => {
    const id1 = computeCorrelationId('p', ['x'], 1700000000099)
    const id2 = computeCorrelationId('p', ['x'], 1700000000100)
    expect(id1).not.toBe(id2)
  })

  it('changes when changedProps differ', () => {
    const id1 = computeCorrelationId('p', ['padding-top'], 1700000000000)
    const id2 = computeCorrelationId('p', ['margin-top'], 1700000000000)
    expect(id1).not.toBe(id2)
  })
})

describe('createEntry', () => {
  it('produces a normalized entry shape', () => {
    document.body.innerHTML = '<p id="t"></p>'
    const target = document.getElementById('t')
    const entry = createEntry({
      target,
      feature: 'padding',
      args: { side: 'top', delta: 1 },
      beforeCSS: { 'padding-top': '0px' },
      afterCSS: { 'padding-top': '1px' },
      source: 'feature',
      ts: 1700000000000,
    })
    expect(entry.id).toMatch(/^e_/)
    expect(entry.feature).toBe('padding')
    expect(entry.source).toBe('feature')
    expect(entry.target.nodePath).toMatch(/p/)
    expect(entry.target.weakRef).toBeInstanceOf(WeakRef)
    expect(entry.correlationId).toBeDefined()
  })

  it('includes beforeDOM/afterDOM for text edits', () => {
    document.body.innerHTML = '<p id="t">hi</p>'
    const target = document.getElementById('t')
    const entry = createEntry({
      target,
      feature: 'text',
      args: ['hi', 'hello'],
      beforeCSS: {},
      afterCSS: {},
      beforeDOM: { textContent: 'hi' },
      afterDOM: { textContent: 'hello' },
      source: 'feature',
      ts: 1700000000000,
    })
    expect(entry.beforeDOM.textContent).toBe('hi')
    expect(entry.afterDOM.textContent).toBe('hello')
    expect(entry.correlationId).toContain('dom')
  })
})

describe('snapshotTextContent', () => {
  it('captures textContent', () => {
    document.body.innerHTML = '<span>abc</span>'
    expect(snapshotTextContent(document.querySelector('span'))).toEqual({ textContent: 'abc' })
  })
})

describe('snapshotSwapPair', () => {
  it('captures sibling indices', () => {
    document.body.innerHTML = '<div><em></em><b></b></div>'
    const [em, b] = document.querySelectorAll('em, b')
    const snap = snapshotSwapPair(em, b)
    expect(snap.src.index).toBe(0)
    expect(snap.target.index).toBe(1)
  })
})

describe('diffDomSnapshots', () => {
  it('detects dom changes', () => {
    expect(diffDomSnapshots({ textContent: 'a' }, { textContent: 'b' })).toEqual(['dom'])
    expect(diffDomSnapshots({ textContent: 'a' }, { textContent: 'a' })).toEqual([])
  })
})
