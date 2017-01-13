import * as _ from "underscore"
import * as Backbone from "./backbone"

export class BokehView extends Backbone.View
  initialize: (options) ->
    if not options.id?
      @id = _.uniqueId('BokehView')

  toString: () -> "#{@model.type}View(#{@id})"

  bind_bokeh_events: () ->

  remove: ->
    @trigger('remove', @)
    super()
