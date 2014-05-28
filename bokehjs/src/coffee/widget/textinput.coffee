define [
  "common/has_parent",
  "common/continuum_view",
  "common/build_views"
  "backbone",
  "./textinputtemplate"
], (HasParent, continuum_view, build_views, Backbone, template) ->
  ContinuumView = continuum_view.View
  class TextInputView extends ContinuumView
    tagName : "div"
    attributes :
       class : "bk-widget-form-group"
    template : template
    events :
      "change input" : "change_input"
    change_input : () ->
      @mset('value', @$('input').val())
      @model.save()
      console.log('set', @model.attributes)
    initialize : (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)

    render : () ->
      @$el.html(@template(@model.attributes))
      return @

  class TextInput extends HasParent
    type : "TextInput"
    default_view : TextInputView
    defaults : () ->
      defaults =
        name : ""
        value : ""
        title : ""
      return defaults
  class TextInputs extends Backbone.Collection
    model : TextInput
  textinputs = new TextInputs()
  return{
    Model : TextInput
    Collection : textinputs
  }
