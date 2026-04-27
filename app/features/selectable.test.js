import { test, expect, changeMode } from '../../tests/helpers.js'

const test_selector   = '[intro] b'

test('Can show 1 label on click', async ({ visbugPage }) => {
  await changeMode({tool: 'font', page: visbugPage})

  await visbugPage.click(test_selector)

  const label_element = await visbugPage.evaluate(`document.querySelectorAll('visbug-label').length`)

  expect(label_element).toBe(1)
})

test('Can show tag name label on click', async ({ visbugPage }) => {
  await changeMode({tool: 'font', page: visbugPage})

  await visbugPage.click(test_selector)

  const label_element = await visbugPage.evaluate(
    `document.querySelector('visbug-label').$shadow.querySelector('span a').textContent`
  )

  expect(label_element).toBe('b')
})

test('Can show layout property label on click', async ({ visbugPage }) => {
  await changeMode({tool: 'align', page: visbugPage})

  await visbugPage.click(test_selector)

  const label_element = await visbugPage.evaluate(
    `document.querySelector('visbug-label').$shadow.querySelector('span').textContent`
  )

  expect(label_element).toBe('inline')
})

test('Can show proper tag name label after position tool clicked', async ({ visbugPage }) => {
  await changeMode({tool: 'position', page: visbugPage})

  await visbugPage.click(test_selector)

  const label_element = await visbugPage.evaluate(
    `document.querySelector('visbug-label').$shadow.querySelector('span a').textContent`
  )

  expect(label_element).toBe('b')
})
