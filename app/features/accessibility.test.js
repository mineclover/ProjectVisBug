import { test, expect, getActiveTool, changeMode } from '../../tests/helpers.js'

const contrastValueSelector = `document.querySelector('visbug-ally').$shadow.querySelector('span[contrast]').textContent.trim()`

test('Can be activated', async ({ visbugPage }) => {
  await changeMode({page: visbugPage, tool: 'accessibility'})

  expect(await getActiveTool(visbugPage)).toBe('accessibility')
})

// test('Can reveal color contrasts between html nodes and backgrounds', async ({ visbugPage }) => {
//   await changeMode({page: visbugPage, tool: 'accessibility'})

//   await visbugPage.hover('.google-blue')
//   const blueContrastValue = await visbugPage.evaluate(contrastValueSelector)
//   expect(blueContrastValue).toBe("3.56")

//   await visbugPage.hover('.google-red')
//   const redContrastValue = await visbugPage.evaluate(contrastValueSelector)
//   expect(redContrastValue).toBe("4.29")

//   await visbugPage.hover('.google-yellow')
//   const yellowContrastValue = await visbugPage.evaluate(contrastValueSelector)
//   expect(yellowContrastValue).toBe("1.84")
// })

test('Does not show a11y tooltip on <svg> node', async ({ visbugPage }) => {
  await changeMode({page: visbugPage, tool: 'accessibility'})

  const svgEl = await visbugPage.$('svg')
  const {x, y} = await svgEl.boundingBox()
  await visbugPage.mouse.click(x + 1, y + 1) // an empty space of the first svg element
  const targetNodeName = await visbugPage.$eval('[data-selected="true"]', el => el.nodeName)
  expect(targetNodeName).toBe('svg')

  expect(await visbugPage.$('visbug-ally')).toBeNull()
})

test('Gets fill or stroke value first if the target is one of svg elements', async ({ visbugPage }) => {
  await changeMode({page: visbugPage, tool: 'accessibility'})

  await visbugPage.hover('svg')
  const pathContrastValue = await visbugPage.evaluate(contrastValueSelector)
  expect(pathContrastValue).not.toBe('10.44')
})
