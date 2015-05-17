_ = require "underscore"
Backbone = require "backbone"
{logger} = require "../../common/logging"
Tool = require "../tool"
inspect_tool_list_item_template = require "./inspect_tool_list_item_template"

class InspectToolListItemView extends Backbone.View
  className: "bk-toolbar-inspector"
  template: inspect_tool_list_item_template
  events: {
    'click [type="checkbox"]': '_clicked'
  }

  initialize: (options) ->
    @listenTo(@model, 'change:active', @render)
    @render()

  render: () ->
    @$el.html(@template(@model.attrs_and_props()))
    return @

  _clicked: (e) ->
    active = @model.get('active')
    @model.set('active', not active)

class InspectToolView extends Tool.View

class InspectTool extends Tool.Model
  event_type: "move"

  initialize: (attrs, options) ->
    super(attrs, options)

    names = @get('names')
    renderers = @get('renderers')

    if renderers.length == 0
      all_renderers = @get('plot').get('renderers')
      renderers = (r for r in all_renderers when r.type == "GlyphRenderer")

    if names.length > 0
      renderers = (r for r in renderers when names.indexOf(r.get('name')) >= 0)

    @set('renderers', renderers)
    logger.debug("setting #{renderers.length} renderers for #{@type} #{@id}")
    for r in renderers
      logger.debug(" - #{r.type} #{r.id}")

  bind_bokeh_events: () ->
    super()
    @listenTo(events, 'move', @_inspect)

  _inspect: (vx, vy, e) ->

  _exit_inner: () ->

  _exit_outer: () ->

  defaults: ->
    return _.extend {}, super(), {
      renderers: []
      names: []
      inner_only: true
      active: true
      event_type: 'move'
    }

module.exports =
  Model: InspectTool
  View: InspectToolView
  ListItemView: InspectToolListItemView