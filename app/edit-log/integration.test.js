import { test, expect, changeMode, metaKey } from '../../tests/helpers.js'

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

test('padding edit suppresses redundant mutation when feature is captured', async ({ visbugPage }) => {
  const history = await historyAfterEdit(visbugPage, 'padding')
  const sources = history.map((e) => e.source)
  expect(sources).toContain('feature')
  expect(sources).not.toContain('mutation')
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

test('move tool records feature source entry', async ({ visbugPage }) => {
  await changeMode({ tool: 'move', page: visbugPage })
  await visbugPage.click('[intro] b')
  await visbugPage.keyboard.press('ArrowLeft')
  await visbugPage.waitForTimeout(100)
  const history = await visbugPage.$eval('vis-bug', (el) => el.getHistory())
  const feature = history.find((e) => e.source === 'feature' && e.feature === 'move')
  expect(feature).toBeDefined()
  expect(feature.args[1]).toBe('left')
})

test('flex (align) tool records feature source entry', async ({ visbugPage }) => {
  const history = await historyAfterEdit(visbugPage, 'align')
  const feature = history.find((e) => e.source === 'feature' && e.feature === 'flex')
  expect(feature).toBeDefined()
})

test('boxshadow tool records feature source entry', async ({ visbugPage }) => {
  const history = await historyAfterEdit(visbugPage, 'boxshadow', 'ArrowDown')
  const feature = history.find((e) => e.source === 'feature' && e.feature === 'boxshadow')
  expect(feature).toBeDefined()
})

test('position tool records feature source entry', async ({ visbugPage }) => {
  const history = await historyAfterEdit(visbugPage, 'position')
  const feature = history.find((e) => e.source === 'feature' && e.feature === 'position')
  expect(feature).toBeDefined()
})

test('hueshift tool records feature source entry', async ({ visbugPage }) => {
  await changeMode({ tool: 'hueshift', page: visbugPage })
  await visbugPage.locator('.filled-circle.google-blue').scrollIntoViewIfNeeded()
  await visbugPage.click('.filled-circle.google-blue')
  await visbugPage.keyboard.press('ArrowLeft')
  await visbugPage.waitForTimeout(100)
  const history = await visbugPage.$eval('vis-bug', (el) => el.getHistory())
  const feature = history.find((e) => e.source === 'feature' && e.feature === 'hueshift')
  expect(feature).toBeDefined()
})

test('color picker records feature source on foreground change', async ({ visbugPage }) => {
  await changeMode({ tool: 'hueshift', page: visbugPage })
  await visbugPage.click('[intro] b')
  await visbugPage.evaluate(() => {
    const visbug = document.querySelector('vis-bug')
    const input = visbug.$shadow.querySelector('#foreground input')
    input.value = '#ff0000'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await visbugPage.waitForTimeout(100)
  const history = await visbugPage.$eval('vis-bug', (el) => el.getHistory())
  const feature = history.find((e) => e.source === 'feature' && e.feature === 'color')
  expect(feature).toBeDefined()
  expect(feature.args[1]).toBe('#ff0000')
})

test('font bold hotkey records feature source entry', async ({ visbugPage }) => {
  await changeMode({ tool: 'font', page: visbugPage })
  await visbugPage.click('[intro] b')
  const key = await metaKey(visbugPage)
  await visbugPage.keyboard.down(key)
  await visbugPage.keyboard.press('b')
  await visbugPage.keyboard.up(key)
  await visbugPage.waitForTimeout(100)
  const history = await visbugPage.$eval('vis-bug', (el) => el.getHistory())
  const feature = history.find(
    (e) => e.source === 'feature' && e.feature === 'font' && e.args.length === 1,
  )
  expect(feature).toBeDefined()
})

test('text tool records feature source on blur', async ({ visbugPage }) => {
  await changeMode({ tool: 'text', page: visbugPage })
  await visbugPage.click('[intro] b')
  await visbugPage.keyboard.type('!')
  await visbugPage.click('article')
  await visbugPage.waitForTimeout(100)
  const history = await visbugPage.$eval('vis-bug', (el) => el.getHistory())
  const feature = history.find((e) => e.source === 'feature' && e.feature === 'text')
  expect(feature).toBeDefined()
  expect(feature.afterDOM?.textContent).toBeDefined()
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
