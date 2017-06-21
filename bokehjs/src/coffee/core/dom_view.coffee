import {View} from "./view"
import * as DOM from "./dom"

export class DOMView extends View

  tagName: 'div'

  initialize: (options) ->
    super(options)
    @_has_finished = false
    @el = @_createElement()

  remove: () ->
    DOM.removeElement(@el)
    super()

  layout: () ->

  render: () ->

  renderTo: (element, replace=false) -> # HTMLElement, boolean
    if not replace
      element.appendChild(@el)
    else
      DOM.replaceWith(element, @el)

    @layout()

  has_finished: () -> @_has_finished

  notify_finished: () ->
    @root.notify_finished()

  @getters {
    _root_element: () -> DOM.parent(@el, ".bk-root")
    solver:  () -> if @is_root then @_solver else @parent.solver
    is_idle: () -> @has_finished()
  }

  _createElement: () ->
    return DOM.createElement(@tagName, {id: @id, class: @className})
