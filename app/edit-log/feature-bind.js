/** @typedef {(featureName: string, original: Function, resolveTarget: (args: unknown[]) => Element | null) => Function} WrapFeatureFn */

/** @type {WrapFeatureFn | null} */
let wrapFeatureFn = null

/** @type {Map<string, Function>} */
const cache = new Map()

export function setFeatureWrapper(fn) {
  wrapFeatureFn = fn
  cache.clear()
}

export function clearFeatureBindings() {
  wrapFeatureFn = null
  cache.clear()
}

/**
 * @param {string} featureName
 * @param {Function} original
 * @param {(args: unknown[]) => Element | null} resolveTarget
 * @param {string} [cacheKey]
 * @param {((target: Element, args: unknown[]) => object | null) | null} [snapshotDOM]
 */
export function bindFeatureCall(featureName, original, resolveTarget, cacheKey = featureName, snapshotDOM = null) {
  return function bound(...args) {
    if (!wrapFeatureFn) return original.apply(this, args)
    const key = `${featureName}:${cacheKey}`
    if (!cache.has(key)) {
      cache.set(key, wrapFeatureFn(featureName, original, resolveTarget, { snapshotDOM }))
    }
    return cache.get(key).apply(this, args)
  }
}

/** NodeList/배열 feature의 첫 선택 요소 */
export function resolveFirstSelected(args) {
  const [els] = args
  if (!els?.length) return null
  const el = els[0]
  return el?.nodeType === 1 ? el : null
}

/** 단일 Element 인자 (move 등) */
export function resolveFirstElement(args) {
  const [el] = args
  return el?.nodeType === 1 ? el : null
}
