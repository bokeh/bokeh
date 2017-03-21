import * as Backbone from "./backbone"

import {uniqueId} from "./util/string"

export class BokehView extends Backbone.View
  initialize: (options) ->
    if not options.id?
      @id = uniqueId('BokehView')

    if options.parent != undefined
      @parent = options.parent
    else
      throw new Error("parent of a view wasn't configured")

  toString: () -> "#{@model.type}View(#{@id})"

  bind_bokeh_events: () ->

  remove: ->
    super()
    @parent = null
    @trigger('remove', @)

  @getters {
    # non-root view must have @parent != null
    # this should be defined deeper in the hierarchy
    solver: () ->
      if @parent != null
        return @parent.solver
      else
        return @_solver
  }
