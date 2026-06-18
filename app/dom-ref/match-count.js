import { resolveFullXPath } from './xpath.js'

/**
 * @param {string} css
 * @param {Document | Element} root
 * @returns {number}
 */
export function countCssMatches(css, root = document) {
  if (!css) return 0
  try {
    return root.querySelectorAll(css).length
  } catch {
    return 0
  }
}

/**
 * @param {string} xpath
 * @param {Document | Element} root
 * @returns {number}
 */
export function countXPathMatches(xpath, root = document) {
  if (!xpath) return 0
  return resolveFullXPath(xpath, root) ? 1 : 0
}
