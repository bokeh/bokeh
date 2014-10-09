
define [
  "backbone"
  "tool/button_tool"
], (Backbone, ButtonTool) ->

  class GestureToolButtonView extends ButtonTool.ButtonView

    _clicked: () ->
      @model.set('active', true)

  class GestureToolView extends ButtonTool.View

  class GestureTool extends ButtonTool.Model

    defaults: () ->
      return _.extend({}, super(), {
        event_type: @event_type
        default_order: @default_order
      })

  return {
    "Model": GestureTool
    "View": GestureToolView
    "ButtonView": GestureToolButtonView
  }
