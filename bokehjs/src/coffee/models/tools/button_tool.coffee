import * as _ from "underscore"
import * as $ from "jquery"
import {BokehView} from "../../core/bokeh_view"
import {Tool, ToolView} from "./tool"
import * as p from "../../core/properties"

export class ButtonToolButtonView extends BokehView
  tagName: "button"
  className: "bk-toolbar-button"

  events: () -> { 'click': '_clicked' }

  initialize: (options) ->
    super(options)
    @listenTo(@model, 'change', () => @render())
    @render()

  render: () ->
    icon = $("<div class='bk-btn-icon'>").addClass(@model.icon)
    tip = $("<span class='bk-tip'>").text(@model.tooltip)
    @$el.empty().append([icon, tip])
    @$el.prop("disabled", @model.disabled)

  _clicked: (e) ->

export class ButtonToolView extends ToolView

export class ButtonTool extends Tool
  icon: null

  @getters {
    tooltip: () -> @tool_name
  }

  @internal {
    disabled: [ p.Boolean, false ]
  }
