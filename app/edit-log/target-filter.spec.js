import { describe, it, expect } from 'vitest'
import {
  isVisbugChrome,
  isMutationCaptureTarget,
  resolveContentRoot,
} from './target-filter.js'

describe('isVisbugChrome', () => {
  it('returns true for visbug custom elements', () => {
    const el = document.createElement('visbug-hover')
    document.body.appendChild(el)
    expect(isVisbugChrome(el)).toBe(true)
    el.remove()
  })

  it('returns true when inside vis-bug', () => {
    const host = document.createElement('vis-bug')
    const inner = document.createElement('span')
    host.appendChild(inner)
    document.body.appendChild(host)
    expect(isVisbugChrome(inner)).toBe(true)
    host.remove()
  })

  it('returns false for regular page content', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    expect(isVisbugChrome(el)).toBe(false)
    el.remove()
  })
})

describe('isMutationCaptureTarget', () => {
  it('page-edits requires data-selected', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    expect(isMutationCaptureTarget(el, { scope: 'page-edits' })).toBe(false)
    el.setAttribute('data-selected', 'true')
    expect(isMutationCaptureTarget(el, { scope: 'page-edits' })).toBe(true)
    el.remove()
  })

  it('content-root allows any non-chrome inside root', () => {
    const root = document.createElement('main')
    const el = document.createElement('p')
    root.appendChild(el)
    document.body.appendChild(root)
    expect(isMutationCaptureTarget(el, { scope: 'content-root', contentRoot: root })).toBe(true)
    root.remove()
  })

  it('rejects nodes outside contentRoot', () => {
    const root = document.createElement('main')
    const outside = document.createElement('p')
    document.body.appendChild(root)
    document.body.appendChild(outside)
    expect(isMutationCaptureTarget(outside, { scope: 'content-root', contentRoot: root })).toBe(false)
    root.remove()
    outside.remove()
  })
})

describe('resolveContentRoot', () => {
  it('uses explicit root when provided', () => {
    const root = document.createElement('section')
    expect(resolveContentRoot(null, root)).toBe(root)
  })

  it('falls back to host parent', () => {
    const parent = document.createElement('div')
    const host = document.createElement('vis-bug')
    parent.appendChild(host)
    expect(resolveContentRoot(host)).toBe(parent)
  })
})
