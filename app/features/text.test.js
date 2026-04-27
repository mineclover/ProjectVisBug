import { test, expect, changeMode, getActiveTool } from '../../tests/helpers.js'

const tool            = 'text'
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

test('Can insert text content', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)

  await visbugPage.keyboard.type('foo')

  expect((await visbugPage.$eval(test_selector, el => el.innerHTML)).includes('foo')).toBe(true)
})

test('Can delete text content', async ({ visbugPage }) => {
  const original = await visbugPage.$eval(test_selector, el => el.innerHTML)

  await visbugPage.click(test_selector)

  await visbugPage.keyboard.press('Delete')
  await visbugPage.keyboard.press('Delete')

  const now = await visbugPage.$eval(test_selector, el => el.innerHTML)

  expect(original.length === now.length + 2).toBe(true)
})
