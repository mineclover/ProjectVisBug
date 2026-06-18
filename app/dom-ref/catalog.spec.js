import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildDomRefCatalog } from './catalog.js'
import { pickPrimarySymbol } from './symbols.js'

describe('buildDomRefCatalog', () => {
  let host

  beforeEach(() => {
    host = document.createElement('div')
    host.innerHTML = `
      <section data-testid="hero">
        <p id="intro" class="lead">hello</p>
      </section>
    `
    document.body.appendChild(host)
  })

  afterEach(() => {
    host.remove()
  })

  it('includes canonical xpath and symbols', () => {
    const el = host.querySelector('[data-testid="hero"]')
    const catalog = buildDomRefCatalog(el)
    expect(catalog.canonical.kind).toBe('xpath')
    expect(catalog.canonical.value).toMatch(/^\/html\[1\]\//)
    expect(catalog.symbols.length).toBeGreaterThan(1)
    expect(catalog.fingerprint.tagName).toBe('section')
  })

  it('uses id primary when no stable attr on element', () => {
    const el = host.querySelector('#intro')
    const catalog = buildDomRefCatalog(el)
    expect(catalog.primary?.kind).toBe('id')
    expect(catalog.primary?.value).toBe('#intro')
  })

  it('picks data-testid primary on section', () => {
    const el = host.querySelector('[data-testid="hero"]')
    const catalog = buildDomRefCatalog(el)
    expect(catalog.primary?.kind).toBe('attr')
    expect(catalog.primary?.value).toBe('[data-testid="hero"]')
    expect(catalog.primary?.matchCount).toBe(1)
  })

  it('marks duplicate id with low stability', () => {
    host.innerHTML = '<p id="dup">a</p><p id="dup">b</p>'
    const el = host.querySelector('p')
    const catalog = buildDomRefCatalog(el)
    const idSym = catalog.symbols.find((s) => s.kind === 'id')
    expect(idSym?.matchCount).toBe(2)
    expect(idSym?.stability).toBeLessThan(50)
    const primary = pickPrimarySymbol(catalog.symbols, { excludeCanonical: true })
    expect(primary?.kind).not.toBe('id')
  })

  it('injects external coordinate symbols during catalog build', () => {
    const el = host.querySelector('[data-testid="hero"]')
    const catalog = buildDomRefCatalog(el, {
      resolveSymbols: (node) => [
        {
          kind: 'rlsc',
          value: `rlsc:${node.tagName.toLowerCase()}:hero`,
          provenance: 'test-rlsc',
        },
        {
          kind: 'qa-coord',
          value: 'qa:demo:v1:42',
          stability: 92,
          provenance: 'test-qa',
        },
      ],
    })

    expect(catalog.symbols).toContainEqual(expect.objectContaining({
      kind: 'rlsc',
      value: 'rlsc:section:hero',
      matchCount: 1,
      stability: 90,
      provenance: 'test-rlsc',
    }))
    expect(catalog.symbols).toContainEqual(expect.objectContaining({
      kind: 'qa-coord',
      value: 'qa:demo:v1:42',
      matchCount: 1,
      stability: 92,
    }))
  })
})
