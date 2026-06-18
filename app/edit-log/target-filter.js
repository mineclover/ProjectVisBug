/** VisBug chrome / overlay — edit-log mutation 대상에서 제외 */
const VISBUG_CHROME_TAGS = new Set([
  'VIS-BUG',
  'HOTKEY-MAP',
  'EDIT-LOG-PANEL',
  'VISBUG-LABEL',
  'VISBUG-HANDLES',
  'VISBUG-HANDLE',
  'VISBUG-CORNERS',
  'VISBUG-GRIP',
  'VISBUG-GRIDLINES',
  'VISBUG-HOVER',
  'VISBUG-OVERLAY',
  'VISBUG-BOXMODEL',
  'VISBUG-DISTANCE',
  'VISBUG-METATIP',
  'VISBUG-OFFSCREEN-LABEL',
])

/**
 * @param {Node | null | undefined} node
 * @returns {boolean}
 */
export function isVisbugChrome(node) {
  let cur = node
  while (cur && cur.nodeType === 1) {
    const tag = cur.tagName
    if (VISBUG_CHROME_TAGS.has(tag)) return true
    if (cur.classList?.contains('visbug-metatip')) return true
    cur = cur.parentNode
  }
  return false
}

/**
 * @param {HTMLElement} host
 * @param {Element | undefined} explicit
 * @returns {Element}
 */
export function resolveContentRoot(host, explicit) {
  if (explicit instanceof Element) return explicit
  const parent = host?.parentElement
  if (parent && parent !== document.documentElement) return parent
  return document.body
}

/**
 * mutation capture 대상인지 (chrome 제외 + scope/contentRoot)
 *
 * @param {Node | null | undefined} node
 * @param {object} [opts]
 * @param {Element | Document} [opts.contentRoot]
 * @param {'page-edits' | 'content-root' | 'document'} [opts.scope]
 */
export function isMutationCaptureTarget(node, opts = {}) {
  if (!node || node.nodeType !== 1) return false
  if (isVisbugChrome(node)) return false

  const { contentRoot, scope = 'page-edits' } = opts
  if (
    contentRoot
    && contentRoot !== document
    && typeof contentRoot.contains === 'function'
    && !contentRoot.contains(node)
  ) {
    return false
  }

  if (scope === 'document' || scope === 'content-root') return true

  // page-edits: VisBug가 실제 편집 중인 노드만
  if (node.hasAttribute('data-selected')) return true
  if (node.closest?.('[data-selected]')) return true
  if (node.getAttribute('contenteditable') === 'true') return true
  if (node.closest?.('[contenteditable="true"]')) return true
  return false
}
