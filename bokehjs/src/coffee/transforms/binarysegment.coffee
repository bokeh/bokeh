define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent",
], (ContinuumView, Collection, HasParent) ->

  class BinarySegmentView extends ContinuumView
    attributes:
      class: "BinarySegmentView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class BinarySegment extends HasParent
    type : "BinarySegment"
    default_view: BinarySegmentView

  class BinarySegments extends Collection
    model : BinarySegment

  return {
    "Model" : BinarySegment
    "Collection" : new BinarySegments()
  }
