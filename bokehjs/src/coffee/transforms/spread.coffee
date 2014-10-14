define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent",
], (ContinuumView, Collection, HasParent) ->

  class SpreadView extends ContinuumView
    attributes:
      class: "SpreadView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class Spread extends HasParent
    type : "Spread"
    default_view: SpreadView

  class Spreads extends Collection
    model : Spread

  return {
    "Model" : Spread
    "Collection" : new Spreads()
  }
