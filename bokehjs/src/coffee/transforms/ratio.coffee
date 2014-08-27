define [
  "common/continuum_view"
  "backbone",
  "common/has_parent",
], (continuum_view, Backbone, HasParent) ->
  class RatioView extends continuum_view.View
    attributes:
      class: "RatioView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")
  
  class Ratio extends HasParent
    type : "Ratio"
    default_view: RatioView

  class Ratios extends Backbone.Collection
    model : Ratio
  return {
    "Model" : Ratio 
    "Collection" : new Ratios()
  }
