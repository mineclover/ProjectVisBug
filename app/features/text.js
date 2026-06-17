import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { showHideNodeLabel } from '../utilities/'
import { pushTextEditEntry } from '../edit-log/dom-bind.js'

/** @type {WeakMap<Element, string>} */
const editBaselines = new WeakMap()

const removeEditability = ({target}) => {
  target.removeAttribute('contenteditable')
  target.removeAttribute('spellcheck')
  target.removeEventListener('blur', onEditBlur)
  target.removeEventListener('keydown', stopBubbling)
  hotkeys.unbind('escape,esc')
}

const stopBubbling = e => e.key != 'Escape' && e.stopPropagation()

const commitIfChanged = (target) => {
  const before = editBaselines.get(target)
  if (before === undefined) return
  pushTextEditEntry(target, before, target.textContent ?? '')
  editBaselines.delete(target)
}

const onEditBlur = (e) => {
  commitIfChanged(e.target)
  removeEditability(e)
}

const cleanup = () => {
  $('[spellcheck="true"]').forEach(target => {
    commitIfChanged(target)
    removeEditability({target})
  })
  window.getSelection().empty()
}

export function EditText(elements) {
  if (!elements.length) return

  elements.map(el => {
    let $el = $(el)

    editBaselines.set(el, el.textContent ?? '')

    $el.attr({
      contenteditable: true,
      spellcheck: true,
    })
    el.focus()
    showHideNodeLabel(el, true)

    $el.on('keydown', stopBubbling)
    $el.on('blur', onEditBlur)
  })

  hotkeys('escape,esc', cleanup)
}
