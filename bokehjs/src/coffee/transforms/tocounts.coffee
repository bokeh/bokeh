define [
  "common/continuum_view"
  "backbone",
  "common/has_parent",
], (continuum_view, Backbone, HasParent) ->
  class ToCountsView extends continuum_view.View
    attributes:
      class: "ToCountsView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")
  
  class ToCounts extends HasParent
    type : "ToCounts"
    default_view: ToCountsView

  class ToCountss extends Backbone.Collection
    model : ToCounts
  return {
    "Model" : ToCounts 
    "Collection" : new ToCountss()
  }
