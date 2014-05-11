define [
  "common/has_parent",
  "common/continuum_view",
  "common/build_views"
  "backbone"
], (HasParent, continuum_view, build_views, Backbone) ->
  ContinuumView = continuum_view.View

  class CrossFilterView extends ContinuumView
    tag : "div"

  class CrossFilter extends HasParent
    type : "CrossFilter"
    default_view : CrossFilterView

  class CrossFilters extends Backbone.Collection
    model : CrossFilter
  crossfilters = new CrossFilters()
  return {
    "Model" : CrossFilter
    "Collection" : crossfilters
    "View" : CrossFilterView
  }