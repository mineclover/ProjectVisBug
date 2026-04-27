import { test, expect, changeMode, getActiveTool } from '../../tests/helpers.js'

const tool          = 'padding'
const test_selector = '[intro] b'

const getPaddingTop = async page =>
  await page.$eval(test_selector, el =>
    el.style.paddingTop)

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
  await changeMode({ tool: 'margin', page: visbugPage })
  expect(await getActiveTool(visbugPage)).toBe('margin')
})

test('Adds padding to side', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)

  expect(await getPaddingTop(visbugPage)).toBe('')

  await visbugPage.keyboard.press('ArrowUp')

  expect(await getPaddingTop(visbugPage)).toBe('1px')
})

test('Remove padding from side', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  expect(await getPaddingTop(visbugPage)).toBe('')

  await visbugPage.keyboard.press('ArrowUp')
  expect(await getPaddingTop(visbugPage)).toBe('1px')

  await visbugPage.keyboard.down('Alt')
  await visbugPage.keyboard.down('ArrowUp')
  await visbugPage.keyboard.up('Alt')
  await visbugPage.keyboard.up('ArrowUp')
  expect(await getPaddingTop(visbugPage)).toBe('0px')
})

test('Can change values by 10 with shift key', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  expect(await getPaddingTop(visbugPage)).toBe('')

  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowUp')
  await visbugPage.keyboard.up('Shift')
  expect(await getPaddingTop(visbugPage)).toBe('10px')
})
