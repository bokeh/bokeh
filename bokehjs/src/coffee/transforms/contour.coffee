define [
  "common/continuum_view"
  "backbone",
  "common/has_parent",
], (continuum_view, Backbone, HasParent) ->
  class ContourView extends continuum_view.View
    attributes:
      class: "ContourView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")
  
  class Contour extends HasParent
    type : "Contour"
    default_view: ContourView

  class Contours extends Backbone.Collection
    model : Contour
  return {
    "Model" : Contour 
    "Collection" : new Contours()
  }
