import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildDomRefCatalog } from './catalog.js'
import { pickPrimarySymbol } from './symbols.js'
import { DOM_REF_STABILITY_SAMPLES } from './stability-samples.js'

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

  it('treats qa address as a stable primary symbol', () => {
    host.innerHTML = '<button id="save" data-qa-address="demo:save">Save</button>'
    const el = host.querySelector('[data-qa-address="demo:save"]')
    const catalog = buildDomRefCatalog(el)
    expect(catalog.primary?.kind).toBe('attr')
    expect(catalog.primary?.value).toBe('[data-qa-address="demo:save"]')
    expect(catalog.primary?.stability).toBe(95)
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

  it('does not promote dynamic ids through short css paths', () => {
    host.innerHTML = '<main><button id=":r0:" class="primary-action">Save</button></main>'
    const el = host.querySelector('button')
    const catalog = buildDomRefCatalog(el)
    const idSym = catalog.symbols.find((s) => s.kind === 'id')
    const cssSym = catalog.symbols.find((s) => s.kind === 'css')

    expect(idSym?.stability).toBe(55)
    expect(cssSym?.value).not.toContain(':r0:')
    expect(catalog.primary?.kind).toBe('css')
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

describe('DomRef stability samples', () => {
  let host

  beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
  })

  afterEach(() => {
    host.remove()
  })

  it.each(DOM_REF_STABILITY_SAMPLES)('$id: $intent', (sample) => {
    host.innerHTML = sample.html
    const el = host.querySelector(sample.targetSelector)
    expect(el, sample.intent).not.toBeNull()

    const catalog = buildDomRefCatalog(el, { root: host })
    expect(catalog.primary, sample.intent).toMatchObject(sample.expectedPrimary)

    if (sample.demotedSymbol) {
      expect(catalog.symbols, sample.intent).toContainEqual(expect.objectContaining(sample.demotedSymbol))
      expect(catalog.primary, sample.intent).not.toMatchObject(sample.demotedSymbol)
    }
  })
})
