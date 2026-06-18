import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { computeFullXPath, resolveFullXPath } from './xpath.js'

describe('computeFullXPath', () => {
  let host

  beforeEach(() => {
    host = document.createElement('div')
    host.innerHTML = `
      <main id="root">
        <p class="a">one</p>
        <p class="b">two</p>
      </main>
    `
    document.body.appendChild(host)
  })

  afterEach(() => {
    host.remove()
  })

  it('produces positional full xpath', () => {
    const p = host.querySelector('p.b')
    const xpath = computeFullXPath(p)
    expect(xpath).toMatch(/^\/html\[1\]\//)
    expect(xpath).toContain('main[1]')
    expect(xpath).toContain('p[2]')
  })

  it('round-trips via resolveFullXPath', () => {
    const p = host.querySelector('p.a')
    const xpath = computeFullXPath(p)
    const resolved = resolveFullXPath(xpath)
    expect(resolved).toBe(p)
  })
})
