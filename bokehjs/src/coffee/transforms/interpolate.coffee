define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent",
], (ContinuumView, Collection, HasParent) ->

  class InterpolateView extends ContinuumView
    attributes:
      class: "InterpolateView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class Interpolate extends HasParent
    type : "Interpolate"
    default_view: InterpolateView

  class Interpolates extends Collection
    model : Interpolate

  return {
    "Model" : Interpolate
    "Collection" : new Interpolates()
  }
