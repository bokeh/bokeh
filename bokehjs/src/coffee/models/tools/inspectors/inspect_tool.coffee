import * as _ from "underscore"
import {BokehView} from "../../../core/bokeh_view"
import {Tool, ToolView} from "../tool"
import inspect_tool_list_item_template from "./inspect_tool_list_item_template"

export class InspectToolListItemView extends BokehView
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

export class InspectToolView extends ToolView

export class InspectTool extends Tool
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
