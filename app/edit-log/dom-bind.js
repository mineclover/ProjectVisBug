/** @typedef {(partial: object) => void} PushDomEntryFn */

/** @type {PushDomEntryFn | null} */
let pushDomEntry = null

export function setDomEntryPusher(fn) {
  pushDomEntry = fn
}

export function clearDomBindings() {
  pushDomEntry = null
}

/**
 * text tool blur/escape 시 content 변경 기록
 * @param {Element} target
 * @param {string} beforeText
 * @param {string} afterText
 */
export function pushTextEditEntry(target, beforeText, afterText) {
  if (!pushDomEntry || beforeText === afterText) return
  pushDomEntry({
    target,
    feature: 'text',
    args: [beforeText, afterText],
    beforeCSS: {},
    afterCSS: {},
    beforeDOM: { textContent: beforeText },
    afterDOM: { textContent: afterText },
  })
}
