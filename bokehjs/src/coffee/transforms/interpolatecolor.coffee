define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent"
], (ContinuumView, Collection, HasParent) ->

  class InterpolateColorView extends ContinuumView
    attributes:
      class: "InterpolateColorView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class InterpolateColor extends HasParent
    type : "InterpolateColor"
    default_view: InterpolateColorView

  class InterpolateColors extends Collection
    model : InterpolateColor

  return {
    "Model" : InterpolateColor
    "Collection" : new InterpolateColors()
  }
