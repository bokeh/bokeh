define [
  "jquery"
  "underscore"
  "common/has_parent",
  "common/continuum_view",
  "common/collection"
  "./multiselecttemplate"
], ($, _, HasParent, ContinuumView, Collection, multiselecttemplate) ->

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
    defaults: ->
      return _.extend {}, super(), {
        title: ''
        value: []
        options: []
      }

  class MultiSelects extends Collection
    model : MultiSelect
  multiselectboxes = new MultiSelects()
  return {
    "Model" : MultiSelect
    "Collection" : multiselectboxes
    "View" : MultiSelectView
  }
