define [
  "common/continuum_view"
  "backbone",
  "common/has_parent",
], (continuum_view, Backbone, HasParent) ->
  class IdView extends continuum_view.View
    attributes:
      class: "IdView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")
  
  class Id extends HasParent
    type : "Id"
    default_view: IdView

  class Ids extends Backbone.Collection
    model : Id
  return {
    "Model" : Id 
    "Collection" : new Ids()
  }
