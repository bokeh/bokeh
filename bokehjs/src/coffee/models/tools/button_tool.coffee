import * as _ from "underscore"
import {BokehView} from "../../core/bokeh_view"
import {Tool, ToolView} from "./tool"
import button_tool_template from "./button_tool_template"
import * as p from "../../core/properties"

export class ButtonToolButtonView extends BokehView
  tagName: "li"
  template: button_tool_template

  events: () ->
    return { 'click .bk-toolbar-button': '_clicked' }

  initialize: (options) ->
    super(options)
    @$el.html(@template({model: @model}))
    @listenTo(@model, 'change:active', () => @render())
    @listenTo(@model, 'change:disabled', () => @render())
    @render()

  render: () ->
    @$el.children('button')
        .prop("disabled", @model.disabled)
        .toggleClass('active', @model.active)
    return @

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
