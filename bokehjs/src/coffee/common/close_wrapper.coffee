define [
  "underscore",
  "./continuum_view"
], (_, ContinuumView) ->

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
    View: CloseWrapper
  }
