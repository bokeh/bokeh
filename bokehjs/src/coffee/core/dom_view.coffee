import {View} from "./view"
import * as DOM from "./dom"

export class DOMView extends View

  tagName: 'div'

  initialize: (options) ->
    super(options)
    @el = @_createElement()

  remove: () ->
    DOM.removeElement(@el)
    super()

  render: () ->

  has_render_finished: () -> true

  notify_finished: () ->
    @root.notify_finished()

  @getters {
    solver:  () -> if @is_root then @_solver else @parent.solver
  }

  _createElement: () ->
    return DOM.createElement(@tagName, {id: @id, class: @className})
