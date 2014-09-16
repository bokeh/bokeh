define [
  "underscore",
  "backbone",
], (_, Backbone) ->

  class ContinuumView extends Backbone.View
    initialize: (options) ->
      #autogenerates id
      if not _.has(options, 'id')
        this.id = _.uniqueId('ContinuumView')

    #bind_bokeh_events is always called after initialize has run
    bind_bokeh_events: () ->
      'pass'

    delegateEvents: (events) ->
      super(events)

    remove: ->
      if _.has(this, 'eventers')
        for own target, val of @eventers
          val.off(null, null, this)
      @trigger('remove', this)
      super()

    mget: ()->
      # convenience function, calls get on the associated model
      return @model.get.apply(@model, arguments)

    mset: ()->
      # convenience function, calls set on the associated model
      return @model.set.apply(@model, arguments)

    render_end: () ->
      "pass"
