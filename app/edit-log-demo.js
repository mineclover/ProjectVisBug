const FEATURE_SECTIONS = {
  padding: '[data-section="padding"]',
  margin: '[data-section="margin"]',
  font: '[data-section="font"]',
  move: '[data-section="move"]',
  flex: '[data-section="flex"]',
  position: '[data-section="position"]',
  boxshadow: '[data-section="boxshadow"]',
  hueshift: '[data-section="hueshift"]',
  color: '[data-section="hueshift"]',
  text: '[data-section="text"]',
  imageswap: '[data-section="imageswap"]',
}

const logEl = document.getElementById('log-list')
const statFeature = document.getElementById('stat-feature')
const statMutation = document.getElementById('stat-mutation')
const statTotal = document.getElementById('stat-total')

let featureCount = 0
let mutationCount = 0
const seenFeatures = new Set()

function formatArgs(args) {
  if (!args) return ''
  try {
    const s = JSON.stringify(args)
    return s.length > 80 ? `${s.slice(0, 77)}…` : s
  } catch {
    return String(args)
  }
}

function entryTags(entry) {
  const tags = []
  if (entry.beforeDOM || entry.afterDOM) tags.push('dom')
  const cssKeys = Object.keys(entry.afterCSS || {}).filter(
    (k) => entry.beforeCSS?.[k] !== entry.afterCSS?.[k],
  )
  if (cssKeys.length) tags.push(`css:${cssKeys.slice(0, 3).join(',')}`)
  return tags
}

function renderEntry(entry) {
  const li = document.createElement('li')
  li.className = 'demo-entry'
  li.dataset.source = entry.source
  const tags = entryTags(entry)
  li.innerHTML = `
    <div><strong>${entry.feature}</strong> <span class="meta">${entry.source}</span></div>
    <div class="meta">${entry.target?.selector || entry.target?.nodePath || '?'}</div>
    ${entry.args ? `<div class="meta">args ${formatArgs(entry.args)}</div>` : ''}
    ${entry.afterDOM?.textContent != null ? `<div class="meta">text → "${String(entry.afterDOM.textContent).slice(0, 40)}"</div>` : ''}
    ${tags.length ? `<div class="tags">${tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
  `
  return li
}

function markSection(feature) {
  const sel = FEATURE_SECTIONS[feature]
  if (!sel || seenFeatures.has(feature)) return
  seenFeatures.add(feature)
  document.querySelector(sel)?.classList.add('done')
}

function prependEntry(entry) {
  if (entry.source !== 'feature') return
  if (entry.source === 'feature') featureCount++
  else mutationCount++
  statFeature.textContent = `feature ${featureCount}`
  statMutation.textContent = `mutation ${mutationCount}`
  statTotal.textContent = `total ${featureCount + mutationCount}`

  if (entry.source === 'feature') markSection(entry.feature)

  logEl.querySelector('.demo-log-empty')?.remove()
  logEl.prepend(renderEntry(entry))
  while (logEl.children.length > 40) logEl.lastChild?.remove()
}

const LAYOUT_STYLE_PROPS = ['position', 'top', 'left', 'width', 'height', 'transform', 'box-sizing']

function resetDemoLayout(visbug) {
  document.querySelectorAll('.demo-section, .demo-box, [data-demo-target]').forEach((el) => {
    LAYOUT_STYLE_PROPS.forEach((prop) => el.style.removeProperty(prop))
    el.removeAttribute('data-selected')
    el.removeAttribute('data-selected-hide')
    el.removeAttribute('data-label-id')
  })
  document.querySelectorAll('visbug-handles, visbug-label').forEach((el) => el.remove())
  visbug?.clearHistory?.()
}

export function wireEditLogDemo(visbug) {
  if (!visbug) return

  wireThemeControls(visbug)

  visbug.addEventListener('editlog', (e) => prependEntry(e.detail))

  document.getElementById('btn-reset-layout')?.addEventListener('click', () => {
    resetDemoLayout(visbug)
    logEl.innerHTML = '<div class="demo-log-empty">편집 후 엔트리가 여기 표시됩니다.</div>'
    featureCount = 0
    mutationCount = 0
    seenFeatures.clear()
    statFeature.textContent = 'feature 0'
    statMutation.textContent = 'mutation 0'
    statTotal.textContent = 'total 0'
    document.querySelectorAll('.demo-section.done').forEach((el) => el.classList.remove('done'))
  })

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    visbug.clearHistory()
    logEl.innerHTML = '<div class="demo-log-empty">편집 후 엔트리가 여기 표시됩니다.</div>'
    featureCount = 0
    mutationCount = 0
    seenFeatures.clear()
    statFeature.textContent = 'feature 0'
    statMutation.textContent = 'mutation 0'
    statTotal.textContent = 'total 0'
    document.querySelectorAll('.demo-section.done').forEach((el) => el.classList.remove('done'))
  })

  document.getElementById('btn-merge')?.addEventListener('click', () => {
    logEl.innerHTML = ''
    featureCount = 0
    mutationCount = 0
    seenFeatures.clear()
    const merged = visbug.getHistory({ merge: 'correlated' })
    if (!merged.length) {
      logEl.innerHTML = '<div class="demo-log-empty">병합할 기록이 없습니다.</div>'
      statFeature.textContent = 'feature 0'
      statMutation.textContent = 'mutation 0'
      statTotal.textContent = 'total 0'
      return
    }
    merged.slice().reverse().forEach((entry) => prependEntry(entry))
  })

  document.getElementById('btn-panel')?.addEventListener('click', () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  })
}

function applyPageTheme(theme) {
  document.documentElement.dataset.pageTheme = theme
  try { localStorage.setItem('visbug-demo-page-theme', theme) } catch { /* ignore */ }
}

function applyVisbugTheme(visbug, theme) {
  visbug.setAttribute('color-scheme', theme)
  try { localStorage.setItem('visbug-demo-toolbar-theme', theme) } catch { /* ignore */ }
}

export function wireThemeControls(visbug) {
  const pageSelect = document.getElementById('page-theme')
  const visbugSelect = document.getElementById('visbug-theme')

  const savedPage = (() => {
    try { return localStorage.getItem('visbug-demo-page-theme') } catch { return null }
  })() || 'dark'
  const savedVisbug = (() => {
    try { return localStorage.getItem('visbug-demo-toolbar-theme') } catch { return null }
  })() || 'light'

  applyPageTheme(savedPage)
  applyVisbugTheme(visbug, savedVisbug)
  if (pageSelect) pageSelect.value = savedPage
  if (visbugSelect) visbugSelect.value = savedVisbug

  pageSelect?.addEventListener('change', (e) => {
    applyPageTheme(e.target.value)
  })
  visbugSelect?.addEventListener('change', (e) => {
    applyVisbugTheme(visbug, e.target.value)
  })
}
