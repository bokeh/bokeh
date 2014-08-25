define [
  "common/continuum_view"
  "backbone",
  "common/has_parent",
], (continuum_view, Backbone, HasParent) ->
  class EncodeView extends continuum_view.View
    attributes:
      class: "EncodeView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")
  
  class Encode extends HasParent
    type : "Encode"
    default_view: EncodeView

  class Encodes extends Backbone.Collection
    model : Encode
  return {
    "Model" : Encode 
    "Collection" : new Encodes()
  }
