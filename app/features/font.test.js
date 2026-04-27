import { test, expect, changeMode, getActiveTool, metaKey } from '../../tests/helpers.js'

const tool            = 'font'
const test_selector   = '[intro] b'

const getInlineStyle = async (page, prop) =>
  await page.$eval(test_selector, (el, prop) => {
    return el.style[prop]
  }, prop)

test.beforeEach(async ({ visbugPage }) => {
  await changeMode({
    tool,
    page: visbugPage,
  })
})

test('Can Be Activated', async ({ visbugPage }) => {
  expect(await getActiveTool(visbugPage)).toBe(tool)
})

test('Can Be Deactivated', async ({ visbugPage }) => {
  expect(await getActiveTool(visbugPage)).toBe(tool)
  await changeMode({ tool: 'padding', page: visbugPage })
  expect(await getActiveTool(visbugPage)).toBe('padding')
})

test('Can change size', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  expect(await getInlineStyle(visbugPage, 'font-size')).toBe('')

  await visbugPage.keyboard.press('ArrowUp')
  expect(await getInlineStyle(visbugPage, 'font-size')).toBe('17px')

  await visbugPage.keyboard.press('ArrowDown')
  await visbugPage.keyboard.press('ArrowDown')
  expect(await getInlineStyle(visbugPage, 'font-size')).toBe('15px')
})

test('Can change alignment', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  expect(await getInlineStyle(visbugPage, 'text-align')).toBe('')

  await visbugPage.keyboard.press('ArrowRight')
  expect(await getInlineStyle(visbugPage, 'text-align')).toBe('right')

  await visbugPage.keyboard.press('ArrowLeft')
  expect(await getInlineStyle(visbugPage, 'text-align')).toBe('center')

  await visbugPage.keyboard.press('ArrowLeft')
  expect(await getInlineStyle(visbugPage, 'text-align')).toBe('left')
})

test('Can change leading', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  expect(await getInlineStyle(visbugPage, 'line-height')).toBe('')

  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowUp')
  await visbugPage.keyboard.up('Shift')
  expect(await getInlineStyle(visbugPage, 'line-height')).toBe('20px')

  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowDown')
  await visbugPage.keyboard.up('Shift')
  expect(await getInlineStyle(visbugPage, 'line-height')).toBe('19px')
})

test('Can change letter space', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  expect(await getInlineStyle(visbugPage, 'letter-spacing')).toBe('')

  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowRight')
  await visbugPage.keyboard.up('Shift')
  expect(await getInlineStyle(visbugPage, 'letter-spacing')).toBe('1.6px')

  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowLeft')
  await visbugPage.keyboard.up('Shift')
  expect(await getInlineStyle(visbugPage, 'letter-spacing')).toBe('1.5px')
})

test('Can change weight', async ({ visbugPage }) => {
  const key = await metaKey(visbugPage)

  await visbugPage.click(test_selector)
  expect(await getInlineStyle(visbugPage, 'font-weight')).toBe('')

  await visbugPage.keyboard.down(key)
  await visbugPage.keyboard.press('ArrowUp')
  await visbugPage.keyboard.up(key)
  expect(await getInlineStyle(visbugPage, 'font-weight')).toBe('800')

  await visbugPage.keyboard.down(key)
  await visbugPage.keyboard.press('ArrowDown')
  await visbugPage.keyboard.up(key)
  expect(await getInlineStyle(visbugPage, 'font-weight')).toBe('700')
})
