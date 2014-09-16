define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent",
], (ContinuumView, Collection, HasParent) ->

  class RatioView extends ContinuumView
    attributes:
      class: "RatioView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class Ratio extends HasParent
    type : "Ratio"
    default_view: RatioView

  class Ratios extends Collection
    model : Ratio

  return {
    "Model" : Ratio
    "Collection" : new Ratios()
  }
