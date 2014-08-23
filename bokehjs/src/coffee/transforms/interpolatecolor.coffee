define [
  "common/continuum_view"
  "backbone",
  "common/has_parent"
], (continuum_view, Backbone, HasParent) ->
  class InterpolateColorView extends continuum_view.View
    attributes:
      class: "InterpolateColorView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class InterpolateColor extends HasParent
    type : "InterpolateColor"
    default_view: InterpolateColorView
  
  class InterpolateColors extends Backbone.Collection
    model : InterpolateColor
  return {
    "Model" : InterpolateColor 
    "Collection" : new InterpolateColors()
  }
