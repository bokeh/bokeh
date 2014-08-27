define [
  "common/continuum_view"
  "backbone",
  "common/has_parent"
], (continuum_view, Backbone, HasParent) ->
  class HDAlphaView extends continuum_view.View
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
  
  class HDAlphas extends Backbone.Collection
    model : HDAlpha
  return {
    "Model" : HDAlpha 
    "Collection" : new HDAlphas()
  }
