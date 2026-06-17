import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  MIN_RESIZE_SIZE,
  clampDragPointer,
  computeAnchoredResize,
  createResizeSession,
  computeResizeFromSession,
  visualBottomRight,
  captureResizeBaseline,
  syncBorderBoxDimensions,
} from './handle.element.js'

const rect = { left: 100, top: 80, right: 200, bottom: 180, width: 100, height: 100 }

function session(placement, overrides = {}, pointer = { x: 100, y: 80 }) {
  const r = { ...rect, ...overrides.rect }
  const baseline = {
    styleLeft: overrides.styleLeft ?? 0,
    styleTop: overrides.styleTop ?? 0,
    staticOriginX: overrides.staticOriginX ?? r.left - (overrides.styleLeft ?? 0),
    staticOriginY: overrides.staticOriginY ?? r.top - (overrides.styleTop ?? 0),
  }
  return createResizeSession(placement, r, baseline, pointer)
}

describe('top-start: 오른쪽 아래 앵커 고정', () => {
  it('일반 드래그 — BR 불변, 크기만 변함', () => {
    const s = session('top-start')
    const box = computeResizeFromSession(s, { x: 130, y: 110 })
    const br = visualBottomRight(s, box)
    expect(br.x).toBeCloseTo(200)
    expect(br.y).toBeCloseTo(180)
    expect(box.width).toBe(70)
    expect(box.height).toBe(70)
  })

  it('MIN 클램프 후 추가 드래그 — BR·크기·위치 모두 고정', () => {
    const s = session('top-start')
    const atMin = computeResizeFromSession(s, { x: 500, y: 500 })
    const pastMin = computeResizeFromSession(s, { x: 900, y: 900 })
    const br = visualBottomRight(s, atMin)
    expect(atMin.width).toBe(MIN_RESIZE_SIZE)
    expect(atMin.height).toBe(MIN_RESIZE_SIZE)
    expect(br.x).toBeCloseTo(200)
    expect(br.y).toBeCloseTo(180)
    expect(pastMin).toEqual(atMin)
  })

  it('padding border-box — BR 불변', () => {
    const host = document.createElement('div')
    host.style.cssText = 'position:absolute;left:100px;top:80px;padding:10px;border:2px solid;width:76px;height:76px'
    document.body.appendChild(host)
    syncBorderBoxDimensions(host)
    const baseline = captureResizeBaseline(host)
    const s = createResizeSession('top-start', baseline.rect, baseline, { x: 100, y: 80 })
    const box = computeResizeFromSession(s, { x: 150, y: 130 })
    const br = visualBottomRight(s, box)
    expect(br.x).toBeCloseTo(baseline.rect.right)
    expect(br.y).toBeCloseTo(baseline.rect.bottom)
    host.remove()
  })
})

describe('bottom-end: 왼쪽 위 앵커 고정', () => {
  it('드래그 시 TL 불변', () => {
    const s = session('bottom-end')
    const box = computeResizeFromSession(s, { x: 160, y: 150 })
    expect(box.width).toBe(60)
    expect(box.height).toBe(70)
    expect(box.left).toBeUndefined()
    expect(box.top).toBeUndefined()
    const visualLeft = s.anchors.left
    const visualTop = s.anchors.top
    expect(visualLeft + box.width).toBeCloseTo(160)
    expect(visualTop + box.height).toBeCloseTo(150)
  })
})

describe('clampDragPointer', () => {
  it('top-start: MIN 이하 포인터 클램프', () => {
    const anchors = { left: 100, top: 80, right: 200, bottom: 180 }
    const p = clampDragPointer('top-start', anchors, { x: 300, y: 300 })
    expect(p.x).toBe(200 - MIN_RESIZE_SIZE)
    expect(p.y).toBe(180 - MIN_RESIZE_SIZE)
  })
})

describe('computeAnchoredResize (legacy)', () => {
  it('top-start diff', () => {
    const r = computeAnchoredResize('top-start', {
      width: 100, height: 80, styleLeft: 30, styleTop: 20,
      rectLeft: 30, rectTop: 20, rectWidth: 100, rectHeight: 80,
    }, 10, 15)
    expect(r.width).toBe(90)
    expect(r.height).toBe(65)
  })
})

describe('captureResizeBaseline', () => {
  it('staticOrigin = rect − style offset', () => {
    document.body.innerHTML = '<div id="t" style="position:relative;left:10px;top:5px;width:40px;height:30px"></div>'
    const el = document.getElementById('t')
    const baseline = captureResizeBaseline(el)
    expect(baseline.styleLeft).toBe(10)
    expect(baseline.staticOriginX).toBeCloseTo(baseline.rect.left - 10)
    expect(el.style.boxSizing).toBe('border-box')
  })

  it('padding/margin 포함 동적 최소 크기 계산', () => {
    document.body.innerHTML = '<div id="m" style="position:relative;padding:16px;border:2px solid #000;margin:0 0 12px 0;width:120px;height:40px"></div>'
    const el = document.getElementById('m')
    const baseline = captureResizeBaseline(el)
    expect(baseline.minWidth).toBeGreaterThan(MIN_RESIZE_SIZE)
    expect(baseline.minHeight).toBeGreaterThan(MIN_RESIZE_SIZE)
  })
})
