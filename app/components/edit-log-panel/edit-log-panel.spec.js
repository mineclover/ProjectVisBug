import { describe, it, expect, beforeEach } from 'vitest'

beforeEach(async () => {
  document.body.innerHTML = ''
  await import('./edit-log-panel.element.js')
})

describe('<edit-log-panel>', () => {
  it('registers as custom element', () => {
    expect(customElements.get('edit-log-panel')).toBeDefined()
  })

  it('renders empty state when no entries', async () => {
    const el = document.createElement('edit-log-panel')
    el.entries = []
    document.body.appendChild(el)
    await new Promise((r) => setTimeout(r, 0))
    const root = el.shadowRoot
    expect(root.textContent).toMatch(/no entries|비어/i)
  })

  it('renders entries when set', async () => {
    const el = document.createElement('edit-log-panel')
    el.entries = [
      { id: 'e1', feature: 'padding', source: 'feature', target: { selector: '#x' } },
      { id: 'e2', feature: 'margin', source: 'feature', target: { selector: '#y' } },
    ]
    document.body.appendChild(el)
    await new Promise((r) => setTimeout(r, 0))
    const items = el.shadowRoot.querySelectorAll('[data-entry]')
    expect(items.length).toBe(2)
  })

  it('clear button dispatches edit-log-clear event', async () => {
    const el = document.createElement('edit-log-panel')
    el.entries = []
    document.body.appendChild(el)
    await new Promise((r) => setTimeout(r, 0))
    let called = false
    el.addEventListener('edit-log-clear', () => { called = true })
    el.shadowRoot.querySelector('[data-action=clear]').click()
    expect(called).toBe(true)
  })

  it('copy CSS button dispatches edit-log-copy with format=css', async () => {
    const el = document.createElement('edit-log-panel')
    el.entries = [{ id: 'e1', feature: 'padding', source: 'feature', target: { selector: '#x' }, beforeCSS: {}, afterCSS: { 'padding-top': '4px' } }]
    document.body.appendChild(el)
    await new Promise((r) => setTimeout(r, 0))

    const detail = await new Promise((resolve) => {
      el.addEventListener('edit-log-copy', (e) => resolve(e.detail))
      el.shadowRoot.querySelector('[data-action=copy-css]').click()
    })
    expect(detail.format).toBe('css')
  })
})
