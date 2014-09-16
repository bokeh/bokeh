define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent",
], (ContinuumView, Collection, HasParent) ->

  class SeqView extends ContinuumView
    attributes:
      class: "SeqView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class Seq extends HasParent
    type : "Seq"
    default_view: SeqView

  class Seqs extends Collection
    model : Seq

  return {
    "Model" : Seq
    "Collection" : new Seqs()
  }
