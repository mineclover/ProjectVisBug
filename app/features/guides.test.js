import { test, expect } from '../../tests/helpers.js'

test('Should show 1 overlay element on hover', async ({ visbugPage }) => {
  await visbugPage.mouse.move(100, 200)

  const gridlines_element = await visbugPage.evaluate(`document.querySelectorAll('visbug-gridlines').length`)

  expect(gridlines_element).toBe(1)
})
