import { test, expect, changeMode, getActiveTool } from '../../tests/helpers.js'

const tool            = 'move'
const test_selector   = '[intro] b'

const getNodeIndex = async (page, selector) =>
  await page.$eval(selector, el =>
    [...el.parentNode.children].indexOf(el))

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

test('Move sibling up the branch', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  expect(await getNodeIndex(visbugPage, test_selector)).toBe(2)

  await visbugPage.keyboard.press('ArrowLeft')

  expect(await getNodeIndex(visbugPage, test_selector)).toBe(1)
})

test('Move sibling down the branch', async ({ visbugPage }) => {
  const alt_selector = '[intro] em'

  await visbugPage.click(alt_selector)
  expect(await getNodeIndex(visbugPage, alt_selector)).toBe(0)

  await visbugPage.keyboard.press('ArrowRight')

  expect(await getNodeIndex(visbugPage, alt_selector)).toBe(1)
})

test('Grips overlay siblings when 1 is selected', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)

  const grips_count = await visbugPage.evaluate('document.querySelectorAll("visbug-grip").length')

  expect(grips_count).toBe(3)
})

test('Drag bounds are highlighted', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)

  const bounds_count = await visbugPage.evaluate('document.querySelectorAll("[visbug-drag-container]").length')

  expect(bounds_count).toBe(1)
})
