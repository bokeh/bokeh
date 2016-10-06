import * as _ from "underscore"
import * as BokehView from "../../core/bokeh_view"
import * as Tool from "./tool"
import * as button_tool_template from "./button_tool_template"
import * as p from "../../core/properties"

class ButtonToolButtonView extends BokehView
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

class ButtonToolView extends Tool.View

class ButtonTool extends Tool.Model
  icon: null

  @getters {
    tooltip: () -> @tool_name
  }

  @internal {
    disabled: [ p.Boolean, false ]
  }

export {
  ButtonTool as Model
  ButtonToolView as View
  ButtonToolButtonView as ButtonView
}
