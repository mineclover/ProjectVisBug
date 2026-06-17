import { test, expect, changeMode } from '../../tests/helpers.js'

async function historyAfterEdit(visbugPage, tool, key = 'ArrowUp') {
  await changeMode({ tool, page: visbugPage })
  await visbugPage.click('[intro] b')
  await visbugPage.keyboard.press(key)
  await visbugPage.waitForTimeout(100)
  return visbugPage.$eval('vis-bug', (el) => el.getHistory())
}

test('padding edit records feature entry with args', async ({ visbugPage }) => {
  const history = await historyAfterEdit(visbugPage, 'padding')
  const feature = history.find((e) => e.source === 'feature' && e.feature === 'padding')
  expect(feature).toBeDefined()
  expect(feature.target).toBeDefined()
  expect(feature.afterCSS).toBeDefined()
  expect(feature.args[1]).toBe('up')
})

test('padding edit also records mutation baseline entry', async ({ visbugPage }) => {
  const history = await historyAfterEdit(visbugPage, 'padding')
  const sources = history.map((e) => e.source)
  expect(sources).toContain('feature')
  expect(sources).toContain('mutation')
})

test('margin tool records feature source entry', async ({ visbugPage }) => {
  const history = await historyAfterEdit(visbugPage, 'margin')
  const feature = history.find((e) => e.source === 'feature' && e.feature === 'margin')
  expect(feature).toBeDefined()
})

test('font tool records feature source on font size change', async ({ visbugPage }) => {
  const history = await historyAfterEdit(visbugPage, 'font')
  const feature = history.find((e) => e.source === 'feature' && e.feature === 'font')
  expect(feature).toBeDefined()
})

test('getHistory returns entries after edits', async ({ visbugPage }) => {
  await changeMode({ tool: 'padding', page: visbugPage })
  await visbugPage.click('[intro] b')
  await visbugPage.keyboard.press('ArrowUp')
  await visbugPage.keyboard.press('ArrowUp')

  const count = await visbugPage.$eval('vis-bug', (el) => el.getHistory().length)
  expect(count).toBeGreaterThanOrEqual(2)
})

test('onEditLog setter receives entries', async ({ visbugPage }) => {
  await changeMode({ tool: 'padding', page: visbugPage })

  await visbugPage.evaluate(() => {
    window.__entries = []
    document.querySelector('vis-bug').onEditLog = (e) => window.__entries.push(e)
  })

  await visbugPage.click('[intro] b')
  await visbugPage.keyboard.press('ArrowUp')

  const len = await visbugPage.evaluate(() => window.__entries.length)
  expect(len).toBeGreaterThan(0)
})

test('clearHistory empties buffer', async ({ visbugPage }) => {
  await changeMode({ tool: 'padding', page: visbugPage })
  await visbugPage.click('[intro] b')
  await visbugPage.keyboard.press('ArrowUp')

  await visbugPage.$eval('vis-bug', (el) => el.clearHistory())
  const count = await visbugPage.$eval('vis-bug', (el) => el.getHistory().length)
  expect(count).toBe(0)
})
