define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent",
], (ContinuumView, Collection, HasParent) ->

  class ContourView extends ContinuumView
    attributes:
      class: "ContourView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class Contour extends HasParent
    type : "Contour"
    default_view: ContourView

  class Contours extends Collection
    model : Contour

  return {
    "Model" : Contour
    "Collection" : new Contours()
  }
