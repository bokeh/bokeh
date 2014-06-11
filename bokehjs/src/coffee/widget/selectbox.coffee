define [
  "common/has_parent",
  "common/continuum_view",
  "backbone"
  "underscore"
  "./selecttemplate"
], (HasParent, continuum_view, Backbone, _, selecttemplate) ->
  ContinuumView = continuum_view.View
  class SelectView extends ContinuumView
    events :
      "change select" : "change_input"
    change_input : () ->
      console.log('set', @model.attributes)
      @mset('value', @$('select').val())
      @model.save()

    tagName : "div"

    template : selecttemplate

    initialize : (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)

    render : () ->
      @$el.empty()
      html = @template(@model.attributes)
      @$el.html(html)
      return this

  class Select extends HasParent
    type : "Select"
    default_view : SelectView
    defaults : () ->
      def =
        title : ''
        value : ''
        options : []
      return def
  class Selects extends Backbone.Collection
    model : Select
  selectboxes = new Selects()
  return {
    "Model" : Select
    "Collection" : selectboxes
    "View" : SelectView
  }
