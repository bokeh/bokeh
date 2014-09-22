define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent",
], (ContinuumView, Collection, HasParent) ->

  class ToCountsView extends ContinuumView
    attributes:
      class: "ToCountsView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class ToCounts extends HasParent
    type : "ToCounts"
    default_view: ToCountsView

  class ToCountss extends Collection
    model : ToCounts

  return {
    "Model" : ToCounts
    "Collection" : new ToCountss()
  }
