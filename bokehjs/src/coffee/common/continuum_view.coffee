

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
      #handles lifecycle of events bound by safebind
      ##hugo : the eventers stuff with safebind should no longer be needed
      ##because we should be using @listenTo
      ## the remove event is good though
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

    mget_obj: (fld) ->
      # convenience function, calls get_obj on the associated model

      return @model.get_obj(fld)

    render_end: () ->
      "pass"

  class CloseWrapper extends ContinuumView
    ## Wraps a ContinuumView, and adds a close button
    attributes:
      class : "bk-closewrapper"

    delegateEvents: (events) ->
      super(events)

    events :
      "click .bk-close" : "close"

    close : (options) ->
      @view.remove()
      @remove()

    initialize : (options) ->
      super(options)
      @view = options.view
      @render()

    render : () ->
      @view.$el.detach()
      @$el.empty()
      @$el.html("<a href='#' class='bk-close'>[x]</a>")
      @$el.append(@view.$el)

  return {
    "View": ContinuumView
    "CloseWrapper" : CloseWrapper
  }
