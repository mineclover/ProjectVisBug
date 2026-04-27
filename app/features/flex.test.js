import { test, expect, changeMode, getActiveTool, metaKey } from '../../tests/helpers.js'

const tool            = 'align'
const test_selector   = '[intro] b'

test.beforeEach(async ({ visbugPage }) => {
  await changeMode({
    tool,
    page: visbugPage,
  })
})

test('Can Be Activated', async ({ visbugPage }) => {
  expect(await getActiveTool(visbugPage)).toBe(tool)
})

test('Can adjust justify-content', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  await visbugPage.keyboard.press('ArrowRight')
  let justifyStr = await visbugPage.$eval(test_selector, el => el.style.justifyContent)
  expect(justifyStr).toBe('center')

  await visbugPage.keyboard.press('ArrowRight')
  justifyStr = await visbugPage.$eval(test_selector, el => el.style.justifyContent)
  expect(justifyStr).toBe('flex-end')

  await visbugPage.keyboard.press('ArrowLeft')
  await visbugPage.keyboard.press('ArrowLeft')
  justifyStr = await visbugPage.$eval(test_selector, el => el.style.justifyContent)
  expect(justifyStr).toBe('flex-start')
})

test('Can adjust align-items', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  await visbugPage.keyboard.press('ArrowDown')
  let alignStr = await visbugPage.$eval(test_selector, el => el.style.alignItems)
  expect(alignStr).toBe('center')

  await visbugPage.keyboard.press('ArrowDown')
  alignStr = await visbugPage.$eval(test_selector, el => el.style.alignItems)
  expect(alignStr).toBe('flex-end')

  await visbugPage.keyboard.press('ArrowUp')
  await visbugPage.keyboard.press('ArrowUp')
  alignStr = await visbugPage.$eval(test_selector, el => el.style.alignItems)
  expect(alignStr).toBe('flex-start')
})

test('Can apply space-around', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowLeft')
  let justifyStr = await visbugPage.$eval(test_selector, el => el.style.justifyContent)
  expect(justifyStr).toBe('space-around')
})

test('Can apply space-between', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowRight')
  let justifyStr = await visbugPage.$eval(test_selector, el => el.style.justifyContent)
  expect(justifyStr).toBe('space-between')
})

test('Can adjust wrapping', async ({ visbugPage }) => {
  const key = await metaKey(visbugPage)

  await visbugPage.click(test_selector)
  await visbugPage.keyboard.down(key)
  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowUp')
  let wrapStr = await visbugPage.$eval(test_selector, el => el.style.flexWrap)
  expect(wrapStr).toBe('nowrap')

  await visbugPage.keyboard.press('ArrowUp')
  wrapStr = await visbugPage.$eval(test_selector, el => el.style.flexWrap)
  expect(wrapStr).toBe('nowrap')

  await visbugPage.keyboard.press('ArrowDown')
  wrapStr = await visbugPage.$eval(test_selector, el => el.style.flexWrap)
  expect(wrapStr).toBe('wrap')

  await visbugPage.keyboard.press('ArrowDown')
  wrapStr = await visbugPage.$eval(test_selector, el => el.style.flexWrap)
  expect(wrapStr).toBe('wrap')
})

test('Can adjust row order', async ({ visbugPage }) => {
  const key = await metaKey(visbugPage)

  await visbugPage.click(test_selector)
  await visbugPage.keyboard.down(key)
  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowLeft')
  let dirStr = await visbugPage.$eval(test_selector, el => el.style.flexDirection)
  expect(dirStr).toBe('row-reverse')

  await visbugPage.keyboard.press('ArrowLeft')
  dirStr = await visbugPage.$eval(test_selector, el => el.style.flexDirection)
  expect(dirStr).toBe('row-reverse')

  await visbugPage.keyboard.press('ArrowRight')
  dirStr = await visbugPage.$eval(test_selector, el => el.style.flexDirection)
  expect(dirStr).toBe('row')

  await visbugPage.keyboard.press('ArrowRight')
  dirStr = await visbugPage.$eval(test_selector, el => el.style.flexDirection)
  expect(dirStr).toBe('row')
})

test('Can adjust column order', async ({ visbugPage }) => {
  const key = await metaKey(visbugPage)

  await visbugPage.click(test_selector)
  await visbugPage.keyboard.down(key)
  await visbugPage.keyboard.press('ArrowUp')
  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowLeft')
  let dirStr = await visbugPage.$eval(test_selector, el => el.style.flexDirection)
  expect(dirStr).toBe('column-reverse')

  await visbugPage.keyboard.press('ArrowLeft')
  dirStr = await visbugPage.$eval(test_selector, el => el.style.flexDirection)
  expect(dirStr).toBe('column-reverse')

  await visbugPage.keyboard.press('ArrowRight')
  dirStr = await visbugPage.$eval(test_selector, el => el.style.flexDirection)
  expect(dirStr).toBe('column')

  await visbugPage.keyboard.press('ArrowRight')
  dirStr = await visbugPage.$eval(test_selector, el => el.style.flexDirection)
  expect(dirStr).toBe('column')
})
