_ = require "underscore"
ButtonTool = require "../button_tool"

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

module.exports =
  Model: GestureTool
  View: GestureToolView
  ButtonView: GestureToolButtonView