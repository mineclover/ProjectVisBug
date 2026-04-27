import { panelCSS } from './styles.js'

class EditLogPanel extends HTMLElement {
  constructor() {
    super()
    this._entries = []
    this.attachShadow({ mode: 'open' })
  }

  set entries(value) {
    this._entries = Array.isArray(value) ? value : []
    this._render()
  }
  get entries() { return this._entries }

  connectedCallback() {
    this._render()
  }

  _render() {
    const root = this.shadowRoot
    if (!root) return
    const list = this._entries.length
      ? `<ul>${this._entries.map((e) => this._renderEntry(e)).join('')}</ul>`
      : '<div class="empty">no entries / 비어 있음</div>'
    root.innerHTML = `
      <style>${panelCSS}</style>
      <header>
        <h3>edit log (${this._entries.length})</h3>
        <div>
          <button data-action="copy-css" title="copy CSS">CSS</button>
          <button data-action="copy-script" title="copy script">JS</button>
          <button data-action="copy-json" title="copy JSON">JSON</button>
          <button data-action="clear" title="clear">×</button>
        </div>
      </header>
      ${list}
    `
    root.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => this._onAction(btn.dataset.action))
    })
  }

  _renderEntry(entry) {
    const sel = entry?.target?.selector || '?'
    const feat = entry?.feature || 'unknown'
    const src = entry?.source || 'unknown'
    return `<li data-entry="${entry.id}" data-source="${src}">
      <div><strong>${feat}</strong> <span class="entry-meta">${sel}</span></div>
      <div class="entry-meta">source: ${src}</div>
    </li>`
  }

  _onAction(action) {
    if (action === 'clear') {
      this.dispatchEvent(new CustomEvent('edit-log-clear', { bubbles: true, composed: true }))
      return
    }
    const formatMap = { 'copy-css': 'css', 'copy-script': 'script', 'copy-json': 'json' }
    const format = formatMap[action]
    if (format) {
      this.dispatchEvent(new CustomEvent('edit-log-copy', {
        detail: { format },
        bubbles: true,
        composed: true,
      }))
    }
  }
}

if (!customElements.get('edit-log-panel')) {
  customElements.define('edit-log-panel', EditLogPanel)
}

export { EditLogPanel }
