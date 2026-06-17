import { test, expect, changeMode } from '../../tests/helpers.js'

test('padding edit dispatches editlog CustomEvent', async ({ visbugPage }) => {
  await changeMode({ tool: 'padding', page: visbugPage })

  const eventPromise = visbugPage.evaluate(() => new Promise((resolve) => {
    document.querySelector('vis-bug').addEventListener('editlog', (e) => resolve(e.detail), { once: true })
  }))

  await visbugPage.click('[intro] b')
  await visbugPage.keyboard.press('ArrowUp')

  const detail = await eventPromise
  expect(detail.feature).toBe('padding')
  expect(detail.target).toBeDefined()
  expect(detail.afterCSS).toBeDefined()
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
