_ = require "jquery"
$ = require "underscore"
ContinuumView = require "../common/continuum_view"
HasParent = require "../common/has_parent"
multiselecttemplate = require "./multiselecttemplate"

class MultiSelectView extends ContinuumView
  tagName: "div"
  template: multiselecttemplate
  events:
    "change select": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change:value', @render_selection)
    @listenTo(@model, 'change:options', @render)
    @listenTo(@model, 'change:name', @render)
    @listenTo(@model, 'change:title', @render)

  render: () ->
    @$el.empty()
    html = @template(@model.attributes)
    @$el.html(html)
    @render_selection()
    return @

  render_selection: () =>
    values = {}
    _.map(@mget('value'), (x) -> values[x] = true)
    @$('option').each((el) =>
      el = @$(el)
      if values[el.attr('value')]
        el.attr('selected', 'selected')
    )

  change_input: () ->
    @mset('value', @$('select').val(), {'silent': true})
    @model.save()
    @mget('callback')?.execute(@model)

class MultiSelect extends HasParent
  type: "MultiSelect"
  default_view: MultiSelectView

  defaults: () ->
    return _.extend {}, super(), {
      title: ''
      value: []
      options: []
    }

module.exports =
  Model: MultiSelect
  View: MultiSelectView