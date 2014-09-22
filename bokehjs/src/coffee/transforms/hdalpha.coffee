define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent"
], (ContinuumView, Collection, HasParent) ->

  class HDAlphaView extends ContinuumView
    attributes:
      class: "HDAlphaView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class HDAlpha extends HasParent
    type : "HDAlpha"
    default_view: HDAlphaView

  class HDAlphas extends Collection
    model : HDAlpha

  return {
    "Model" : HDAlpha
    "Collection" : new HDAlphas()
  }
