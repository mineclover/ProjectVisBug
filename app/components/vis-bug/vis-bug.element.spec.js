import { describe, expect, it } from 'vitest'

import VisBug from './vis-bug.element.js'

function renderDemoTip(overrides = {}) {
  const visbug = Object.assign(Object.create(VisBug.prototype), {
    _tutsBaseURL: 'tuts',
    ...overrides,
  })
  const host = document.createElement('div')
  host.innerHTML = visbug.demoTip({
    key: 'g',
    tool: 'guides',
    label: '<span><u>G</u>uides</span>',
    description: 'Verify alignment & measure distances',
    instruction: '',
  })
  return host
}

describe('VisBug tutorial images', () => {
  it('keeps tutorial gif paths relative to tutsBaseURL', () => {
    const host = renderDemoTip()
    const img = host.querySelector('img[data-tut-image]')

    expect(img.getAttribute('src')).toBe('tuts/guides.gif')
    expect(img.getAttribute('alt')).toBe('Verify alignment & measure distances')
  })

  it('hides missing tutorial images without removing the text tip', () => {
    const host = renderDemoTip()

    VisBug.prototype.bindTutorialImageFallbacks.call({ $shadow: host })
    host.querySelector('img').dispatchEvent(new Event('error'))

    expect(host.querySelector('figure').getAttribute('data-tut-missing')).toBe('true')
    expect(host.querySelector('img').hidden).toBe(true)
    expect(host.querySelector('figcaption').textContent).toContain('Guides')
  })
})
