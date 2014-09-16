define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent",
], (ContinuumView, Collection, HasParent) ->

  class ConstView extends ContinuumView
    attributes:
      class: "ConstView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class Const extends HasParent
    type : "Const"
    default_view: ConstView

  class Consts extends Collection
    model : Const

  return {
    "Model" : Const
    "Collection" : new Consts()
  }
