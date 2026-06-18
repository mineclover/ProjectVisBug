import { describe, it, expect, afterEach } from 'vitest'
import { installEditLog } from './index.js'

describe('installEditLog DomRef host API', () => {
  let installed

  afterEach(() => {
    installed?.teardown()
    installed = null
    document.body.innerHTML = ''
  })

  it('exposes buildTargetRef, resolveTargetRef, and queryTargets on host', () => {
    document.body.innerHTML = '<main><button data-testid="save">Save</button></main>'
    const host = document.createElement('vis-bug')
    document.body.prepend(host)
    installed = installEditLog(host, { contentRoot: document.body })

    const target = document.querySelector('[data-testid="save"]')
    const catalog = host.buildTargetRef(target)

    expect(catalog.primary.value).toBe('[data-testid="save"]')
    expect(host.resolveTargetRef(catalog)).toBe(target)
    expect(host.queryTargets({ by: 'catalog', catalog })).toEqual([target])
  })

  it('uses resolveDomRefSymbols option for host API and captured entries', () => {
    document.body.innerHTML = '<main><button data-testid="save">Save</button></main>'
    const host = document.createElement('vis-bug')
    document.body.prepend(host)
    installed = installEditLog(host, {
      contentRoot: document.body,
      resolveDomRefSymbols: () => [
        { kind: 'rlsc', value: 'rlsc:button:save', provenance: 'test' },
      ],
    })

    const target = document.querySelector('[data-testid="save"]')
    const catalog = host.buildTargetRef(target)
    expect(catalog.symbols).toContainEqual(expect.objectContaining({
      kind: 'rlsc',
      value: 'rlsc:button:save',
    }))
  })

  it('caches target refs in a session registry and supports label lookup', () => {
    document.body.innerHTML = '<main><button data-testid="save">Save</button></main>'
    const host = document.createElement('vis-bug')
    document.body.prepend(host)
    installed = installEditLog(host, { contentRoot: document.body })

    const target = document.querySelector('[data-testid="save"]')
    const first = host.buildTargetRef(target, { labelId: '3' })
    const second = host.buildTargetRef(target)

    expect(second).toBe(first)
    expect(host.getTargetRefByLabelId('3')).toBe(first)
  })

  it('removes DomRef host API on teardown', () => {
    const host = document.createElement('vis-bug')
    document.body.appendChild(host)
    installed = installEditLog(host, { contentRoot: document.body })
    installed.teardown()
    installed = null

    expect(host.buildTargetRef).toBeUndefined()
    expect(host.resolveTargetRef).toBeUndefined()
    expect(host.queryTargets).toBeUndefined()
  })
})
