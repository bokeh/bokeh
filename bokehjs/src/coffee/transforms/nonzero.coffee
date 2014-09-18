define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent",
], (ContinuumView, Collection, HasParent) ->

  class NonZeroView extends ContinuumView
    attributes:
      class: "NonZeroView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class NonZero extends HasParent
    type : "NonZero"
    default_view: NonZeroView

  class NonZeros extends Collection
    model : NonZero

  return {
    "Model" : NonZero
    "Collection" : new NonZeros()
  }
