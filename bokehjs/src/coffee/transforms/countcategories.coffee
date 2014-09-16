define [
  "common/continuum_view"
  "backbone",
  "common/has_parent"
], (ContinuumView, Backbone, HasParent) ->

  class CountCategoriesView extends ContinuumView
    attributes:
      class: "CountCategoriesView"

    initialize: (options) ->
      super(options)
      @render_init()

    delegateEvents: (events) ->
      super(events)
      "pass"

    render_init: () ->
      @$el.html("")

  class CountCategories extends HasParent
    type : "CountCategories"
    default_view: CountCategoriesView

  class CountCategoriess extends Backbone.Collection
    model : CountCategories

  return {
    "Model" : CountCategories
    "Collection" : new CountCategoriess()
  }
