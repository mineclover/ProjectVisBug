import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMutationWatcher } from './mutation-watcher.js'
import { createDispatcher } from './dispatcher.js'
import { createEntry } from './entry.js'
import { resetMutationMute } from './mutation-mute.js'

const flush = () => new Promise((resolve) => setTimeout(resolve, 10))

async function mutateTwice(el, apply) {
  apply(el, '1')
  await flush()
  apply(el, '2')
  await flush()
}

describe('createMutationWatcher', () => {
  let watcher
  let dispatcher

  beforeEach(() => {
    document.body.innerHTML = '<div id="x" style="padding: 0px" data-selected="true"></div>'
    dispatcher = createDispatcher()
    resetMutationMute()
  })

  afterEach(() => {
    watcher?.stop()
    resetMutationMute()
  })

  it('captures style attribute changes', async () => {
    watcher = createMutationWatcher({ root: document.body, dispatcher, captureMode: 'all' })
    watcher.start()
    const el = document.getElementById('x')
    await mutateTwice(el, (node, step) => {
      node.style.paddingTop = step === '1' ? '2px' : '4px'
    })
    const entries = dispatcher.getAll()
    expect(entries.length).toBeGreaterThan(0)
    expect(entries[0].source).toBe('mutation')
  })

  it('ignores class-only changes without computed-style diff', async () => {
    watcher = createMutationWatcher({ root: document.body, dispatcher, captureMode: 'all' })
    watcher.start()
    const el = document.getElementById('x')
    el.className = 'a'
    await flush()
    el.className = 'b'
    await flush()
    expect(dispatcher.getAll()).toEqual([])
  })

  it('uses resolveFeature for mutation feature name', async () => {
    watcher = createMutationWatcher({
      root: document.body,
      dispatcher,
      captureMode: 'all',
      resolveFeature: () => 'padding',
    })
    watcher.start()
    const el = document.getElementById('x')
    await mutateTwice(el, (node, step) => {
      node.style.paddingTop = step === '1' ? '2px' : '4px'
    })
    expect(dispatcher.getAll()[0].feature).toBe('padding')
  })

  it('stop disconnects observer', async () => {
    watcher = createMutationWatcher({ root: document.body, dispatcher })
    watcher.start()
    watcher.stop()
    document.getElementById('x').style.paddingTop = '4px'
    await flush()
    expect(dispatcher.getAll()).toEqual([])
  })

  it('ignores visbug chrome style mutations', async () => {
    document.body.innerHTML = '<visbug-hover id="h"></visbug-hover>'
    watcher = createMutationWatcher({ root: document.body, dispatcher, captureMode: 'all' })
    watcher.start()
    const el = document.getElementById('h')
    el.style.setProperty('--top', '1px')
    await flush()
    el.style.setProperty('--top', '2px')
    await flush()
    expect(dispatcher.getAll()).toEqual([])
  })

  it('skips empty computed-style diffs', async () => {
    watcher = createMutationWatcher({ root: document.body, dispatcher, captureMode: 'all' })
    watcher.start()
    const el = document.getElementById('x')
    el.setAttribute('style', 'padding: 0px')
    await flush()
    dispatcher.clear()
    el.setAttribute('style', 'padding:0px')
    await flush()
    expect(dispatcher.getAll()).toEqual([])
  })

  it('ignores unselected nodes under page-edits scope', async () => {
    document.body.innerHTML = '<div id="x" style="padding: 0px"></div>'
    watcher = createMutationWatcher({
      root: document.body,
      dispatcher,
      captureMode: 'all',
      scope: 'page-edits',
      contentRoot: document.body,
    })
    watcher.start()
    const el = document.getElementById('x')
    await mutateTwice(el, (node, step) => {
      node.style.paddingTop = step === '1' ? '2px' : '4px'
    })
    expect(dispatcher.getAll()).toEqual([])
  })

  it('suppresses mutation when feature correlation exists (filtered mode)', async () => {
    watcher = createMutationWatcher({ root: document.body, dispatcher, captureMode: 'filtered' })
    watcher.start()
    const el = document.getElementById('x')
    el.style.paddingTop = '0px'
    await flush()
    dispatcher.clear()

    dispatcher.push(createEntry({
      target: el,
      feature: 'padding',
      args: ['up'],
      beforeCSS: { 'padding-top': '0px' },
      afterCSS: { 'padding-top': '4px' },
      source: 'feature',
      ts: Date.now(),
    }))
    el.style.paddingTop = '4px'
    await flush()
    expect(dispatcher.getAll().filter((e) => e.source === 'mutation')).toHaveLength(0)
    expect(dispatcher.getAll().filter((e) => e.source === 'feature')).toHaveLength(1)
  })
})
