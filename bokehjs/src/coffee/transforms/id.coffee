define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent",
], (ContinuumView, Collection, HasParent) ->

  class IdView extends ContinuumView
    attributes:
      class: "IdView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class Id extends HasParent
    type : "Id"
    default_view: IdView

  class Ids extends Collection
    model : Id

  return {
    "Model" : Id
    "Collection" : new Ids()
  }
