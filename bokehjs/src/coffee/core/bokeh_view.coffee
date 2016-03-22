_ = require "underscore"
Backbone = require "backbone"

class BokehView extends Backbone.View
  initialize: (options) ->
    if not _.has(options, 'id')
      @id = _.uniqueId('BokehView')
    if _.has(options, 'document')
      @document = options.document
    else
      @document = @model.document

  bind_bokeh_events: () ->

  remove: ->
    if _.has(this, 'eventers')
      for own target, val of @eventers
        val.off(null, null, this)
    @trigger('remove', this)
    super()

  mget: ()-> @model.get.apply(@model, arguments)

  mset: ()-> return @model.set.apply(@model, arguments)

module.exports = BokehView
