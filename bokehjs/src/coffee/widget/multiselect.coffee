define [
  "common/has_parent",
  "common/continuum_view",
  "backbone"
  "underscore"
  "./multiselecttemplate"
], (HasParent, continuum_view, Backbone, _, multiselecttemplate) ->
  ContinuumView = continuum_view.View
  class MultiSelectView extends ContinuumView
    events :
      "change select" : "change_input"

    change_input : () ->
      @mset('value', @$('select').val(), {'silent' : true})
      @model.save()

    tagName : "div"

    template : multiselecttemplate

    initialize : (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change:value', @render_selection)
      @listenTo(@model, 'change:options', @render)
      @listenTo(@model, 'change:name', @render)
      @listenTo(@model, 'change:title', @render)

    render : () ->
      @$el.empty()
      html = @template(@model.attributes)
      @$el.html(html)
      @render_selection()
      return this

    render_selection : () ->
      values = {}
      _.map(@mget('value'), (x) -> values[x] = true)
      @$('option').each((el) ->
        el = $(el)
        if values[el.attr('value')]
          el.attr('selected', 'selected')
      )

  class MultiSelect extends HasParent
    type : "MultiSelect"
    default_view : MultiSelectView
    defaults : () ->
      def =
        title : ''
        value : []
        options : []
      return def
  class MultiSelects extends Backbone.Collection
    model : MultiSelect
  multiselectboxes = new MultiSelects()
  return {
    "Model" : MultiSelect
    "Collection" : multiselectboxes
    "View" : MultiSelectView
  }