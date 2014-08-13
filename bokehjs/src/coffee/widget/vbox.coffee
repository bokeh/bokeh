define [
  "common/has_parent",
  "common/continuum_view",
  "common/build_views"
  "backbone"
], (HasParent, continuum_view, build_views, Backbone) ->
  ContinuumView = continuum_view.View
  class VBoxView extends ContinuumView
    tag : "div"
    attributes:
      class : "bk-vbox"
    initialize : (options) ->
      super(options)
      @views = {}
      @render()
      @listenTo(@model, 'change', @render)
    render: () ->
      children = @mget('children')
      build_views(@views, children)
      for own key, val of @views
        val.$el.detach()
      @$el.empty()
      for child in children
        @$el.append(@views[child.id].$el)

  class VBox extends HasParent
    type : "VBox"
    default_view : VBoxView
    defaults : () ->
      return {'children' : []}
  class VBoxes extends Backbone.Collection
    model : VBox
  vboxes = new VBoxes()
  return {
    "Model" : VBox
    "Collection" : vboxes
    "View" : VBoxView
  }