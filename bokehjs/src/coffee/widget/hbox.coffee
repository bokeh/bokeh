define [
  "common/has_parent",
  "common/continuum_view",
  "common/build_views"
  "backbone"
], (HasParent, continuum_view, build_views, Backbone) ->
  ContinuumView = continuum_view.View
  class HBoxView extends ContinuumView
    tag : "div"
    attributes:
      class : "bk-hbox"
    initialize : (options) ->
      super(options)
      @views = {}
      @render()
    render: () ->
      children = @mget_obj('children')
      build_views(@views, children)
      for own key, val of @views
        val.$el.detach()
      @$el.html('')
      for child in children
        @$el.append(@views[child.id].$el)

  class HBox extends HasParent
    type : "HBox"
    default_view : HBoxView
    defaults : () ->
      return {'children' : []}
  class HBoxes extends Backbone.Collection
    model : HBox
  hboxes = new HBoxes()
  return {
    "Model" : HBox
    "Collection" : hboxes
    "View" : HBoxView
  }