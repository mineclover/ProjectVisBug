import { test, expect, changeMode, getActiveTool } from '../../tests/helpers.js'

const tool            = 'inspector'
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

test('Can Be Deactivated', async ({ visbugPage }) => {
  expect(await getActiveTool(visbugPage)).toBe(tool)
  await changeMode({ tool: 'padding', page: visbugPage })
  expect(await getActiveTool(visbugPage)).toBe('padding')
})

test('Should show 1 metatip on click', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  const metatip_element = await visbugPage.evaluate(`document.querySelectorAll('visbug-metatip').length`)

  expect(metatip_element).toBe(1)
})

test('Should show tag name in header', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  const metatip_header_tag = await visbugPage.evaluate(
    `document.querySelector('visbug-metatip').$shadow.querySelector('figure > header a[node]').textContent`
  )

  expect(metatip_header_tag).toBe('b')
})
