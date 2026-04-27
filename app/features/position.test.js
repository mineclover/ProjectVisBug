import { test, expect, changeMode, getActiveTool } from '../../tests/helpers.js'

const tool            = 'position'
const test_selector   = '[intro] h1'

test.beforeEach(async ({ visbugPage }) => {
  await changeMode({
    tool,
    page: visbugPage,
  })
})

test('Can Be Activated', async ({ visbugPage }) => {
  expect(await getActiveTool(visbugPage)).toBe(tool)
})

test('Test Nudge Up/Down Works', async ({ visbugPage }) => {
  const originalPageTop = await visbugPage.$eval(test_selector, el => el.getBoundingClientRect().top)
  await visbugPage.click(test_selector)

  await visbugPage.keyboard.press('ArrowUp')
  const changedPageTop = await visbugPage.$eval(test_selector, el => el.getBoundingClientRect().top)
  expect(originalPageTop - 1 === changedPageTop).toBe(true)

  await visbugPage.keyboard.press('ArrowDown')
  await visbugPage.keyboard.press('ArrowDown')
  const finalPageTop = await visbugPage.$eval(test_selector, el => el.getBoundingClientRect().top)
  expect(originalPageTop + 1 === finalPageTop).toBe(true)
})

test('Test Nudge Left/Right Works', async ({ visbugPage }) => {
  const originalPageLeft = await visbugPage.$eval(test_selector, el => el.getBoundingClientRect().left)
  await visbugPage.click(test_selector)

  await visbugPage.keyboard.press('ArrowLeft')
  const changedPageLeft = await visbugPage.$eval(test_selector, el => el.getBoundingClientRect().left)
  expect(originalPageLeft - 1 === changedPageLeft).toBe(true)

  await visbugPage.keyboard.press('ArrowRight')
  await visbugPage.keyboard.press('ArrowRight')
  const finalPageLeft = await visbugPage.$eval(test_selector, el => el.getBoundingClientRect().left)
  expect(originalPageLeft + 1 === finalPageLeft).toBe(true)
})

test('Test Shift Nudge Up/Down Works', async ({ visbugPage }) => {
  const originalPageTop = await visbugPage.$eval(test_selector, el => el.getBoundingClientRect().top)
  await visbugPage.click(test_selector)
  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowUp')
  const changedPageTop = await visbugPage.$eval(test_selector, el => el.getBoundingClientRect().top)
  expect(originalPageTop - 10 === changedPageTop).toBe(true)
})

test('Test Drag Works', async ({ visbugPage }) => {
  const { originalTop, originalLeft } = await visbugPage.$eval(test_selector, el => {
    return {
      originalTop : el.getBoundingClientRect().top,
      originalLeft : el.getBoundingClientRect().left
    }
  })

  await visbugPage.click(test_selector)

  await visbugPage.mouse.down()
  await visbugPage.mouse.move(20, 20)
  const changedPageTop = await visbugPage.$eval(test_selector, el => el.getBoundingClientRect().top)
  const changedPageLeft = await visbugPage.$eval(test_selector, el => el.getBoundingClientRect().left)

  expect(changedPageTop + 50 < originalTop).toBe(true)
  expect(changedPageLeft + 50 < originalLeft).toBe(true)
})
