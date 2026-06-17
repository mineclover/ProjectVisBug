import $ from 'blingblingjs'
import { HandleStyles } from '../styles.store'
import { clamp } from '../../utilities/numbers'
import { isFixed } from '../../utilities/'

/** border-box 기준 최소 시각 크기 (px) */
export const MIN_RESIZE_SIZE = 8

function parsePx(value) {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

function clampVisual(size, minSize = MIN_RESIZE_SIZE) {
  return Math.max(minSize, size)
}

/** 핸들별 드래그되는 코너/변 중점 (viewport) */
export function dragCornerForPlacement(placement, rect) {
  const { left, top, right, bottom, width, height } = rect
  const midX = left + width / 2
  const midY = top + height / 2

  switch (placement) {
    case 'top-start': return { x: left, y: top }
    case 'top-center': return { x: midX, y: top }
    case 'top-end': return { x: right, y: top }
    case 'middle-start': return { x: left, y: midY }
    case 'middle-end': return { x: right, y: midY }
    case 'bottom-start': return { x: left, y: bottom }
    case 'bottom-center': return { x: midX, y: bottom }
    case 'bottom-end': return { x: right, y: bottom }
    default: return { x: left, y: top }
  }
}

/** 드래그 시작 시 고정되는 앵커 (viewport, 드래그 중 불변) */
export function frozenAnchorsForPlacement(placement, rect) {
  const { left, top, right, bottom } = rect
  return {
    left,
    top,
    right,
    bottom,
    /** 이 핸들에서 움직이지 않는 모서리/변 */
    fixed: {
      'top-start': { right, bottom },
      'top-center': { bottom },
      'top-end': { left, bottom },
      'middle-start': { right },
      'middle-end': { left },
      'bottom-start': { right, top },
      'bottom-center': { top },
      'bottom-end': { left, top },
    }[placement] ?? {},
  }
}

/**
 * MIN 이하로 줄이지 않도록 드래그 코너 포인터를 클램프.
 * 고정 앵커(frozen) 기준 — 초기 rect가 아닌 session.anchors 사용.
 */
export function clampDragPointer(placement, anchors, pointer, constraints = {}) {
  const { left, top, right, bottom } = anchors
  const minW = constraints.minWidth ?? MIN_RESIZE_SIZE
  const minH = constraints.minHeight ?? MIN_RESIZE_SIZE
  let { x, y } = pointer

  switch (placement) {
    case 'top-start':
      x = Math.min(x, right - minW)
      y = Math.min(y, bottom - minH)
      break
    case 'top-center':
      y = Math.min(y, bottom - minH)
      break
    case 'top-end':
      x = Math.max(x, left + minW)
      y = Math.min(y, bottom - minH)
      break
    case 'middle-start':
      x = Math.min(x, right - minW)
      break
    case 'middle-end':
      x = Math.max(x, left + minW)
      break
    case 'bottom-start':
      x = Math.min(x, right - minW)
      y = Math.max(y, top + minH)
      break
    case 'bottom-center':
      y = Math.max(y, top + minH)
      break
    case 'bottom-end':
      x = Math.max(x, left + minW)
      y = Math.max(y, top + minH)
      break
    default:
      break
  }

  return { x, y }
}

function toStyleBox(session, { width, height, visualLeft, visualTop }) {
  const box = {}
  if (width != null) box.width = width
  if (height != null) box.height = height
  if (visualLeft != null) box.left = visualLeft - session.staticOriginX
  if (visualTop != null) box.top = visualTop - session.staticOriginY
  return box
}

/**
 * @param {ReturnType<typeof createResizeSession>} session
 * @param {{ x: number, y: number }} dragCorner — 드래그 코너의 viewport 좌표
 */
export function computeResizeFromSession(session, dragCorner) {
  const p = clampDragPointer(
    session.placement,
    session.anchors,
    dragCorner,
    {
      minWidth: session.minWidth,
      minHeight: session.minHeight,
    },
  )
  const { left, top, right, bottom } = session.anchors

  switch (session.placement) {
    case 'top-start': {
      const width = clampVisual(right - p.x, session.minWidth)
      const height = clampVisual(bottom - p.y, session.minHeight)
      return toStyleBox(session, {
        width,
        height,
        visualLeft: right - width,
        visualTop: bottom - height,
      })
    }
    case 'top-center': {
      const height = clampVisual(bottom - p.y, session.minHeight)
      return toStyleBox(session, {
        height,
        visualTop: bottom - height,
      })
    }
    case 'top-end': {
      const width = clampVisual(p.x - left, session.minWidth)
      const height = clampVisual(bottom - p.y, session.minHeight)
      return toStyleBox(session, {
        width,
        height,
        visualLeft: left,
        visualTop: bottom - height,
      })
    }
    case 'middle-start': {
      const width = clampVisual(right - p.x, session.minWidth)
      return toStyleBox(session, {
        width,
        visualLeft: right - width,
        visualTop: top,
      })
    }
    case 'middle-end': {
      const width = clampVisual(p.x - left, session.minWidth)
      return toStyleBox(session, { width })
    }
    case 'bottom-start': {
      const width = clampVisual(right - p.x, session.minWidth)
      const height = clampVisual(p.y - top, session.minHeight)
      return toStyleBox(session, {
        width,
        height,
        visualLeft: right - width,
        visualTop: top,
      })
    }
    case 'bottom-center': {
      const height = clampVisual(p.y - top, session.minHeight)
      return toStyleBox(session, { height })
    }
    case 'bottom-end': {
      const width = clampVisual(p.x - left, session.minWidth)
      const height = clampVisual(p.y - top, session.minHeight)
      return toStyleBox(session, { width, height })
    }
    default:
      return {}
  }
}

/** 시각 박스의 오른쪽·아래 좌표 (viewport) */
export function visualBottomRight(session, box) {
  const visualLeft = box.left != null
    ? session.staticOriginX + box.left
    : session.anchors.left
  const visualTop = box.top != null
    ? session.staticOriginY + box.top
    : session.anchors.top
  const width = box.width ?? session.anchors.right - session.anchors.left
  const height = box.height ?? session.anchors.bottom - session.anchors.top
  return { x: visualLeft + width, y: visualTop + height }
}

export function createResizeSession(placement, rect, baseline, clientPointer) {
  const dragCorner = dragCornerForPlacement(placement, rect)
  return {
    placement,
    anchors: frozenAnchorsForPlacement(placement, rect),
    staticOriginX: baseline.staticOriginX,
    staticOriginY: baseline.staticOriginY,
    styleLeft: baseline.styleLeft,
    styleTop: baseline.styleTop,
    minWidth: baseline.minWidth ?? MIN_RESIZE_SIZE,
    minHeight: baseline.minHeight ?? MIN_RESIZE_SIZE,
    grabOffsetX: clientPointer.x - dragCorner.x,
    grabOffsetY: clientPointer.y - dragCorner.y,
  }
}

export function clientToDragCorner(session, clientX, clientY) {
  return {
    x: clientX - session.grabOffsetX,
    y: clientY - session.grabOffsetY,
  }
}

/** @deprecated — createResizeSession + computeResizeFromSession */
export function computeAnchoredResizeFromPointer(placement, anchor, pointer) {
  const session = createResizeSession(
    placement,
    anchor.rect,
    {
      styleLeft: anchor.styleLeft,
      styleTop: anchor.styleTop,
      staticOriginX: anchor.staticOriginX,
      staticOriginY: anchor.staticOriginY,
    },
    pointer,
  )
  return computeResizeFromSession(session, pointer)
}

/** @deprecated */
export function clampResizePointer(placement, rect, pointer) {
  return clampDragPointer(placement, frozenAnchorsForPlacement(placement, rect), pointer)
}

/** @deprecated */
export function computeAnchoredResize(placement, box, diffX, diffY) {
  const rectLeft = box.rectLeft ?? box.left
  const rectTop = box.rectTop ?? box.top
  const rectWidth = box.rectWidth ?? box.width
  const rectHeight = box.rectHeight ?? box.height
  const rect = {
    left: rectLeft,
    top: rectTop,
    right: rectLeft + rectWidth,
    bottom: rectTop + rectHeight,
    width: rectWidth,
    height: rectHeight,
  }
  const session = createResizeSession(
    placement,
    rect,
    {
      styleLeft: box.styleLeft ?? box.left,
      styleTop: box.styleTop ?? box.top,
      staticOriginX: rectLeft - (box.styleLeft ?? box.left),
      staticOriginY: rectTop - (box.styleTop ?? box.top),
    },
    { x: rectLeft + diffX, y: rectTop + diffY },
  )
  return computeResizeFromSession(session, { x: rectLeft + diffX, y: rectTop + diffY })
}

function syncHandles(handlesEl, sourceEl, nodeLabelId) {
  if (!handlesEl || !sourceEl) return
  handlesEl.position = {
    el: sourceEl,
    node_label_id: nodeLabelId,
    isFixed: isFixed(sourceEl),
  }
}

function ensurePositionable(el) {
  if (el instanceof HTMLElement && getComputedStyle(el).position === 'static') {
    el.style.position = 'relative'
  }
}

export function syncBorderBoxDimensions(el) {
  const rect = el.getBoundingClientRect()
  el.style.boxSizing = 'border-box'
  el.style.width = `${rect.width}px`
  el.style.height = `${rect.height}px`
  return el.getBoundingClientRect()
}

function computeDynamicMinSize(style) {
  const paddingX = parsePx(style.paddingLeft) + parsePx(style.paddingRight)
  const paddingY = parsePx(style.paddingTop) + parsePx(style.paddingBottom)
  const borderX = parsePx(style.borderLeftWidth) + parsePx(style.borderRightWidth)
  const borderY = parsePx(style.borderTopWidth) + parsePx(style.borderBottomWidth)
  const marginX = Math.max(0, parsePx(style.marginLeft)) + Math.max(0, parsePx(style.marginRight))
  const marginY = Math.max(0, parsePx(style.marginTop)) + Math.max(0, parsePx(style.marginBottom))

  return {
    minWidth: Math.max(MIN_RESIZE_SIZE, paddingX + borderX + marginX),
    minHeight: Math.max(MIN_RESIZE_SIZE, paddingY + borderY + marginY),
  }
}

export function captureResizeBaseline(el) {
  ensurePositionable(el)
  const style = getComputedStyle(el)
  const styleLeft = parsePx(el.style.left) || parsePx(style.left)
  const styleTop = parsePx(el.style.top) || parsePx(style.top)
  const rect = syncBorderBoxDimensions(el)
  return {
    rect: {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    },
    styleLeft,
    styleTop,
    staticOriginX: rect.left - styleLeft,
    staticOriginY: rect.top - styleTop,
    ...computeDynamicMinSize(style),
  }
}

/** @deprecated alias */
export const captureResizeAnchor = captureResizeBaseline

export class Handle extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.styles = [HandleStyles]
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = this.styles
    this.$shadow.innerHTML = this.render()
    
    this.button = this.$shadow.querySelector('button')
    this.button.addEventListener('pointerdown', this.on_element_resize_start.bind(this))

    this.placement = this.getAttribute('placement')
  }

  static get observedAttributes() {
    return ['placement']
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'placement') {
      this.placement = newValue
    }
  }

  on_element_resize_start(e) {
    e.preventDefault()
    e.stopPropagation()

    if (e.button !== 0) return

    const placement = this.placement
    const handlesEl = e.composedPath().find(el => el.tagName === 'VISBUG-HANDLES')
    const nodeLabelId = handlesEl.getAttribute('data-label-id')
    const [sourceEl] = $(`[data-label-id="${nodeLabelId}"]`)

    if (!sourceEl) return

    const baseline = captureResizeBaseline(sourceEl)
    const session = createResizeSession(
      placement,
      baseline.rect,
      baseline,
      { x: e.clientX, y: e.clientY },
    )
    const initialTransformValue = getComputedStyle(sourceEl).transform === 'none'
      ? ''
      : getComputedStyle(sourceEl).transform

    const originalElTransition = sourceEl.style.transition
    const originalDocumentCursor = document.body.style.cursor
    const originalDocumentUserSelect = document.body.style.userSelect
    sourceEl.style.transition = 'none'
    document.body.style.cursor = getComputedStyle(this).getPropertyValue('--cursor')
    document.body.style.userSelect = 'none'

    document.addEventListener('pointermove', on_element_resize_move)

    function applyResize(mutate) {
      requestAnimationFrame(() => {
        mutate()
        syncHandles(handlesEl, sourceEl, nodeLabelId)
      })
    }

    function applyBox(next) {
      if (next.width != null) sourceEl.style.width = `${next.width}px`
      if (next.height != null) sourceEl.style.height = `${next.height}px`
      if (next.left != null) sourceEl.style.left = `${next.left}px`
      if (next.top != null) sourceEl.style.top = `${next.top}px`
    }

    function on_element_resize_move(moveEvent) {
      moveEvent.preventDefault()
      moveEvent.stopPropagation()

      const dragCorner = clientToDragCorner(session, moveEvent.clientX, moveEvent.clientY)
      dragCorner.x = clamp(0, dragCorner.x, document.documentElement.clientWidth)
      dragCorner.y = clamp(0, dragCorner.y, document.documentElement.clientHeight)

      const next = computeResizeFromSession(session, dragCorner)

      applyResize(() => {
        applyBox(next)
        sourceEl.style.transform = initialTransformValue
      })
    }

    document.addEventListener('pointerup', on_element_resize_end, { once: true })
    document.addEventListener('mouseleave', on_element_resize_end, { once: true })

    function on_element_resize_end() {
      document.removeEventListener('pointermove', on_element_resize_move)
      document.body.style.cursor = originalDocumentCursor
      document.body.style.userSelect = originalDocumentUserSelect
      sourceEl.style.transition = originalElTransition
      syncHandles(handlesEl, sourceEl, nodeLabelId)
    }
  }

  disconnectedCallback() {
    this.button.removeEventListener('pointerdown', this.on_element_resize_start.bind(this))
  }

  render() {
    return `
      <button type="button" aria-label="Resize"></button>
    `
  }
}

customElements.define('visbug-handle', Handle)
