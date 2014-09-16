define [
  "common/continuum_view"
  "backbone",
  "common/has_parent",
], (ContinuumView, Backbone, HasParent) ->

  class AutoEncodeView extends ContinuumView
    attributes:
      class: "AutoEncodeView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class AutoEncode extends HasParent
    type : "AutoEncode"
    default_view: AutoEncodeView

  class AutoEncodes extends Backbone.Collection
    model : AutoEncode
  return {
    "Model" : AutoEncode
    "Collection" : new AutoEncodes()
  }
