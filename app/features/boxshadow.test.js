import { test, expect, changeMode, getActiveTool, metaKey } from '../../tests/helpers.js'

const tool            = 'boxshadow'
const test_selector   = '[intro] b'

const getShadowValues = async (page, testEl = test_selector) => {
  const shadowStr = await page.$eval(testEl, el => el.style.boxShadow)
  return parseShadowValues(shadowStr)
}

const parseShadowValues = (str) => {
  const [,color,x,y,blur,spread,inset] = /([^\)]+\)) ([^\s]+) ([^\s]+) ([^\s]+) ([^\s]+)( inset)?/.exec(str)
  return { color, x, y, blur, spread, inset : inset !== undefined }
}

test.beforeEach(async ({ visbugPage }) => {
  await changeMode({
    tool,
    page: visbugPage,
  })
})

test('Can Be Activated', async ({ visbugPage }) => {
  expect(await getActiveTool(visbugPage)).toBe(tool)
})

test('Can adjust X position', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  await visbugPage.keyboard.press('ArrowRight')
  let shadow = await getShadowValues(visbugPage)
  expect(shadow.x).toBe('1px')
  //test shift case
  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowRight')
  shadow = await getShadowValues(visbugPage)
  expect(shadow.x).toBe('11px')
})

test('Can adjust Y position', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  await visbugPage.keyboard.press('ArrowDown')
  let shadow = await getShadowValues(visbugPage)
  expect(shadow.y).toBe('1px')
  //test shift case
  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowDown')
  shadow = await getShadowValues(visbugPage)
  expect(shadow.y).toBe('11px')
})

test('Shadow Blur Works', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  await visbugPage.keyboard.press('ArrowDown')
  await visbugPage.keyboard.down('Alt')
  await visbugPage.keyboard.press('ArrowUp')
  let shadow = await getShadowValues(visbugPage)
  expect(shadow.blur).toBe('1px')
  //test shift case
  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowUp')
  shadow = await getShadowValues(visbugPage)
  expect(shadow.blur).toBe('11px')
})

test('Shadow Spread Works', async ({ visbugPage }) => {
  await visbugPage.click(test_selector)
  await visbugPage.keyboard.press('ArrowDown')
  await visbugPage.keyboard.down('Alt')
  await visbugPage.keyboard.press('ArrowRight')
  let shadow = await getShadowValues(visbugPage)
  expect(shadow.spread).toBe('1px')
  //test shift case
  await visbugPage.keyboard.down('Shift')
  await visbugPage.keyboard.press('ArrowRight')
  shadow = await getShadowValues(visbugPage)
  expect(shadow.spread).toBe('11px')
})

test('Shadow can be set to inset', async ({ visbugPage }) => {
  const key = await metaKey(visbugPage)

  await visbugPage.click(test_selector)
  await visbugPage.keyboard.press('ArrowDown')
  await visbugPage.keyboard.down(key)
  await visbugPage.keyboard.press('ArrowDown')
  const shadow = await getShadowValues(visbugPage)
  expect(shadow.inset).toBe(true)
})
