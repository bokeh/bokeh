import * as Backbone from "./backbone"

import {uniqueId} from "./util/string"

export class BokehView extends Backbone.View
  initialize: (options) ->
    if not options.id?
      @id = uniqueId('BokehView')

  toString: () -> "#{@model.type}View(#{@id})"

  bind_bokeh_events: () ->

  remove: ->
    super()
    @trigger('remove', @)
