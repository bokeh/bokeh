define [
  "common/continuum_view"
  "backbone",
  "common/has_parent",
], (ContinuumView, Backbone, HasParent) ->

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

  class NonZeros extends Backbone.Collection
    model : NonZero

  return {
    "Model" : NonZero
    "Collection" : new NonZeros()
  }
