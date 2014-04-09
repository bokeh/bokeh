define [
  "common/has_parent",
  "common/continuum_view",
  "common/build_views"
  "backbone"
], (HasParent, continuum_view, build_views, Backbone) ->
  ContinuumView = continuum_view.View
  class VBoxModelFormView extends ContinuumView
    tag : "form"
    attributes:
      class : "bk-widget-form"
    initialize : (options) ->
      super(options)
      @views = {}
      @render()
    render: () ->
      children = @mget_obj('_children')
      build_views(@views, children)
      for own key, val of @views
        val.$el.detach()
      @$el.html('')
      for child in children
        @$el.append(@views[child.id].$el)

  class VBoxModelForm extends HasParent
    type : "VBoxModelForm"
    default_view : VBoxModelFormView
    defaults : () ->
      defaults =
        _children : []
        _field_defs : {}
      return {'children' : []}
  class VBoxModelFormes extends Backbone.Collection
    model : VBoxModelForm
  vboxmodelformes = new VBoxModelFormes()
  return {
    "Model" : VBoxModelForm
    "Collection" : vboxmodelformes
  }