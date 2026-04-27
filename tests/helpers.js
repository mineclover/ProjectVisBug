import { test as base, expect } from '@playwright/test'

/**
 * @typedef {Object} VisBugFixtures
 * @property {import('@playwright/test').Page} visbugPage
 */

/** @type {ReturnType<typeof base.extend<VisBugFixtures>>} */
export const test = base.extend({
  visbugPage: async ({ page }, use) => {
    await page.goto('/')
    await page.evaluate(() => document.body.setAttribute('testing', 'true'))
    await page.waitForSelector('vis-bug')
    await use(page)
  },
})

export { expect }

export const changeMode = async ({ page, tool }) => {
  await page.evaluate((toolName) => {
    const visbug = document.querySelector('vis-bug')
    const li = visbug.$shadow.querySelector(`li[data-tool=${toolName}]`)
    const evt = document.createEvent('MouseEvents')
    evt.initEvent('mouseup', true, true)
    li.dispatchEvent(evt)
  }, tool)
}

export const getActiveTool = async (page) =>
  await page.$eval('vis-bug', (el) => el.activeTool)

export const metaKey = async (page) => {
  const isMac = await page.evaluate(() => window.navigator.platform.includes('Mac'))
  return isMac ? 'Meta' : 'Control'
}
