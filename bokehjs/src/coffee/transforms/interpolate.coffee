define [
  "common/continuum_view"
  "backbone",
  "common/has_parent",
], (continuum_view, Backbone, HasParent) ->
  class InterpolateView extends continuum_view.View
    attributes:
      class: "InterpolateView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")
  
  class Interpolate extends HasParent
    type : "Interpolate"
    default_view: InterpolateView 
  
  class Interpolates extends Backbone.Collection
    model : Interpolate
  return {
    "Model" : Interpolate 
    "Collection" : new Interpolates()
  }
