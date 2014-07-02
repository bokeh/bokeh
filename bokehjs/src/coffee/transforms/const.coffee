define [
  "common/continuum_view"
  "backbone",
  "common/has_parent",
], (continuum_view, Backbone, HasParent) ->
  class ConstView extends continuum_view.View
    attributes:
      class: "ConstView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")
  
  class Const extends HasParent
    type : "Const"
    default_view: ConstView 
  
  class Consts extends Backbone.Collection
    model : Const
  return {
    "Model" : Const 
    "Collection" : new Consts()
  }
