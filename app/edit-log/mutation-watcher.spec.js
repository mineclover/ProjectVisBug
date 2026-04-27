import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMutationWatcher } from './mutation-watcher.js'
import { createDispatcher } from './dispatcher.js'

const flush = () => new Promise((resolve) => setTimeout(resolve, 10))

describe('createMutationWatcher', () => {
  let watcher
  let dispatcher

  beforeEach(() => {
    document.body.innerHTML = '<div id="x" style="padding: 0px"></div>'
    dispatcher = createDispatcher()
  })

  afterEach(() => {
    watcher?.stop()
  })

  it('captures style attribute changes', async () => {
    watcher = createMutationWatcher({ root: document.body, dispatcher })
    watcher.start()
    document.getElementById('x').style.paddingTop = '4px'
    await flush()
    const entries = dispatcher.getAll()
    expect(entries.length).toBeGreaterThan(0)
    expect(entries[0].source).toBe('mutation')
  })

  it('captures class attribute changes', async () => {
    watcher = createMutationWatcher({ root: document.body, dispatcher })
    watcher.start()
    document.getElementById('x').className = 'foo'
    await flush()
    const entries = dispatcher.getAll().filter((e) => e.source === 'mutation')
    expect(entries.length).toBeGreaterThan(0)
  })

  it('stop disconnects observer', async () => {
    watcher = createMutationWatcher({ root: document.body, dispatcher })
    watcher.start()
    watcher.stop()
    document.getElementById('x').style.paddingTop = '4px'
    await flush()
    expect(dispatcher.getAll()).toEqual([])
  })
})
