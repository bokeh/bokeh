_ = require "underscore"
BokehView = require "../../../core/bokeh_view"
Tool = require "../tool"
inspect_tool_list_item_template = require "./inspect_tool_list_item_template"

class InspectToolListItemView extends BokehView
  className: "bk-toolbar-inspector"
  template: inspect_tool_list_item_template
  events: {
    'click [type="checkbox"]': '_clicked'
  }

  initialize: (options) ->
    @listenTo(@model, 'change:active', @render)
    @render()

  render: () ->
    @$el.html(@template({model: @model}))
    return @

  _clicked: (e) ->
    active = @model.active
    @model.active = not active

class InspectToolView extends Tool.View

class InspectTool extends Tool.Model
  event_type: "move"

  @override {
    active: true
  }

  bind_bokeh_events: () ->
    super()
    @listenTo(events, 'move', @_inspect)

  _inspect: (vx, vy, e) ->

  _exit_inner: () ->

  _exit_outer: () ->


module.exports =
  Model: InspectTool
  View: InspectToolView
  ListItemView: InspectToolListItemView
