define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent",
], (ContinuumView, Collection, HasParent) ->

  class EncodeView extends ContinuumView
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

  class Encodes extends Collection
    model : Encode

  return {
    "Model" : Encode
    "Collection" : new Encodes()
  }
