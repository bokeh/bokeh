define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent"
], (ContinuumView, Collection, HasParent) ->

  class CuberootView extends ContinuumView
    attributes:
      class: "CuberootView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class Cuberoot extends HasParent
    type : "Cuberoot"
    default_view: CuberootView

  class Cuberoots extends Collection
    model : Cuberoot

  return {
    "Model" : Cuberoot
    "Collection" : new Cuberoots()
  }
