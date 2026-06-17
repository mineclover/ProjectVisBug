import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setDomEntryPusher, clearDomBindings, pushTextEditEntry } from './dom-bind.js'
import { createEntry } from './entry.js'
import { createDispatcher } from './dispatcher.js'

describe('dom-bind', () => {
  let dispatcher

  beforeEach(() => {
    dispatcher = createDispatcher()
    setDomEntryPusher((partial) => {
      dispatcher.push(createEntry({ ...partial, source: 'feature', ts: Date.now() }))
    })
  })

  afterEach(() => {
    clearDomBindings()
  })

  it('pushTextEditEntry records text feature entry', () => {
    document.body.innerHTML = '<p id="t">hi</p>'
    const target = document.getElementById('t')
    pushTextEditEntry(target, 'hi', 'hello')
    const entries = dispatcher.getAll()
    expect(entries).toHaveLength(1)
    expect(entries[0].feature).toBe('text')
    expect(entries[0].afterDOM.textContent).toBe('hello')
  })

  it('skips unchanged text', () => {
    document.body.innerHTML = '<p>same</p>'
    pushTextEditEntry(document.querySelector('p'), 'same', 'same')
    expect(dispatcher.getAll()).toHaveLength(0)
  })
})
