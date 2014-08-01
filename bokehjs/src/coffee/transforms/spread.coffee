define [
  "common/continuum_view"
  "backbone",
  "common/has_parent",
], (continuum_view, Backbone, HasParent) ->
  class SpreadView extends continuum_view.View
    attributes:
      class: "SpreadView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")
  
  class Spread extends HasParent
    type : "Spread"
    default_view: SpreadView 
  
  class Spreads extends Backbone.Collection
    model : Spread 
  return {
    "Model" : Spread 
    "Collection" : new Spreads()
  }
