define [
  "common/has_parent",
  "common/continuum_view",
  "common/build_views"
  "backbone"
], (HasParent, continuum_view, build_views, Backbone) ->
  ContinuumView = continuum_view.View
  class VBoxModelFormView extends ContinuumView
    tagName : "form"
    attributes:
      class : "bk-widget-form"
      role : "form"
    initialize : (options) ->
      super(options)
      @views = {}
      @render()
      @listenTo(@model, 'change:children', @change_children)
      @bind_children()
    change_children: () ->
      old_children = @model.previous('children')
      for old_child_spec in old_children
        model = @resolve_ref(old_child_spec)
        if model
          @stopListening(model, 'change:value')
      @bind_children()

    bind_children : () ->
      children = @mget('_children')
      for child in children
        @listenTo(child, 'change:value' : @set_data)
    set_data : (model, value, options) ->
      if model?
        [name, value] = [model.get('name'), model.get('value')]
        value = @model.convert_val(name, value)
        @mset(name, value)
        @model.save()
      else
        for model in @mget('children')
          [name, value] = [model.get('name'), model.get('value')]
          if name? and value?
            value = @model.convert_val(name, value)
            @mset(name, value)
        @model.save()

    render: () ->
      children = @mget('_children')
      build_views(@views, children)
      for own key, val of @views
        val.$el.detach()
      @$el.empty()
      for child in children
        @$el.append("<br/")
        @$el.append(@views[child.id].$el)

  class VBoxModelForm extends HasParent
    type : "VBoxModelForm"
    default_view : VBoxModelFormView
    convert_val : (name, value) ->
      field_defs = @get('_field_defs')
      if field_defs[name]?
        if field_defs[name] == "Float"
          value = parseFloat(value)
        else if field_defs[name] == "Int"
          value = parseInt(value)
      return value

    defaults : () ->
      defaults =
        _children : []
        _field_defs : {}
      return defaults
  class VBoxModelFormes extends Backbone.Collection
    model : VBoxModelForm
  vboxmodelformes = new VBoxModelFormes()
  return {
    "Model" : VBoxModelForm
    "Collection" : vboxmodelformes
    "View" : VBoxModelFormView
  }
