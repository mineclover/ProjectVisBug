export const panelCSS = `
  :host {
    display: block;
    position: fixed;
    right: 12px;
    bottom: 12px;
    width: 320px;
    max-height: 60vh;
    background: var(--vb-bg, #1a1a1a);
    color: var(--vb-fg, #e8e8e8);
    border: 1px solid var(--vb-border, #444);
    border-radius: 8px;
    font-family: ui-monospace, monospace;
    font-size: 12px;
    z-index: 999999;
    display: flex;
    flex-direction: column;
  }
  header {
    padding: 8px 12px;
    border-bottom: 1px solid var(--vb-border, #444);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  header h3 { margin: 0; font-size: 12px; }
  header button {
    background: transparent;
    color: inherit;
    border: 1px solid currentColor;
    border-radius: 4px;
    padding: 2px 8px;
    cursor: pointer;
    font: inherit;
    margin-left: 4px;
  }
  ul { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex: 1; }
  li {
    padding: 6px 12px;
    border-bottom: 1px solid var(--vb-border-soft, #2a2a2a);
  }
  li[data-source=mutation] { opacity: 0.7; }
  .entry-meta { color: var(--vb-muted, #888); font-size: 11px; }
  .empty { padding: 24px; text-align: center; color: var(--vb-muted, #888); }
`
