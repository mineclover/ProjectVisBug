import { describe, expect, it } from 'vitest'

import VisBug, { DEFAULT_EDIT_LOG_BUFFER_SIZE } from './vis-bug.element.js'

function createVisBugLike(overrides = {}) {
  const host = document.createElement('div')
  return Object.assign(Object.create(VisBug.prototype), {
    _bufferSize: DEFAULT_EDIT_LOG_BUFFER_SIZE,
    getAttribute: host.getAttribute.bind(host),
    setAttribute: host.setAttribute.bind(host),
    ...overrides,
  })
}

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

describe('VisBug edit-log buffer configuration', () => {
  it('keeps the historical default when no value is provided', () => {
    const visbug = createVisBugLike()

    expect(visbug.bufferSize).toBe(1000)
    expect(visbug.configuredBufferSize).toBe(1000)
  })

  it('accepts a positive integer property before connection', () => {
    const visbug = createVisBugLike()

    visbug.bufferSize = 250

    expect(visbug.bufferSize).toBe(250)
    expect(visbug.configuredBufferSize).toBe(250)
  })

  it('falls back for invalid values and supports the custom-element attribute', () => {
    const visbug = createVisBugLike()
    visbug.bufferSize = 250

    visbug.setAttribute('buffer-size', '0')
    expect(visbug.configuredBufferSize).toBe(250)

    visbug.setAttribute('buffer-size', '64')
    expect(visbug.configuredBufferSize).toBe(64)
  })
})
