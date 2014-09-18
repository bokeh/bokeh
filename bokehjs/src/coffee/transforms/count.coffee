define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent"
], (ContinuumView, Collection, HasParent) ->

  class CountView extends ContinuumView
    attributes:
      class: "CountView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class Count extends HasParent
    type : "Count"
    default_view: CountView

  class Counts extends Collection
    model : Count

  return {
    "Model" : Count
    "Collection" : new Counts()
  }
