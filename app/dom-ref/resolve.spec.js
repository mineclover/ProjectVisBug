import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildDomRefCatalog } from './catalog.js'
import { resolveDomRef, queryTargets } from './resolve.js'

describe('resolveDomRef', () => {
  let host

  beforeEach(() => {
    host = document.createElement('div')
    host.innerHTML = `
      <article data-demo-target="card">
        <h2>title</h2>
      </article>
    `
    document.body.appendChild(host)
  })

  afterEach(() => {
    host.remove()
  })

  it('resolves via prefer-stable (attr)', () => {
    const el = host.querySelector('[data-demo-target]')
    const catalog = buildDomRefCatalog(el)
    const resolved = resolveDomRef(catalog)
    expect(resolved).toBe(el)
  })

  it('resolves via canonical-only', () => {
    const el = host.querySelector('h2')
    const catalog = buildDomRefCatalog(el)
    const resolved = resolveDomRef(catalog, { strategy: 'canonical-only' })
    expect(resolved).toBe(el)
  })
})

describe('queryTargets', () => {
  beforeEach(() => {
    document.body.innerHTML = '<button class="x">ok</button><button class="y">no</button>'
  })

  it('queries by css', () => {
    const hits = queryTargets({ by: 'css', value: 'button.x' })
    expect(hits).toHaveLength(1)
    expect(hits[0].textContent).toBe('ok')
  })

  it('queries by symbol', () => {
    const hits = queryTargets({
      by: 'symbol',
      symbol: { kind: 'css', value: 'button.y', matchCount: 1, stability: 75 },
    })
    expect(hits).toHaveLength(1)
    expect(hits[0].textContent).toBe('no')
  })

  it('queries by catalog', () => {
    const target = document.querySelector('button.x')
    const catalog = buildDomRefCatalog(target)
    const hits = queryTargets({ by: 'catalog', catalog })
    expect(hits).toEqual([target])
  })
})
