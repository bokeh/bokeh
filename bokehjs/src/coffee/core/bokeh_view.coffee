import * as _ from "underscore"
import * as Backbone from "./backbone"

export class BokehView extends Backbone.View
  initialize: (options) ->
    if not _.has(options, 'id')
      this.id = _.uniqueId('BokehView')

  toString: () -> "#{@model.type}View(#{@id})"

  bind_bokeh_events: () ->

  remove: ->
    if _.has(this, 'eventers')
      for own target, val of @eventers
        val.off(null, null, this)
    @trigger('remove', this)
    super()
