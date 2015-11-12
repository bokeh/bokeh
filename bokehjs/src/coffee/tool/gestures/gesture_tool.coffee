_ = require "underscore"
ButtonTool = require "../button_tool"

class GestureToolButtonView extends ButtonTool.ButtonView

  _clicked: () ->
    active = @model.get('active')
    @model.set('active', not active)

class GestureToolView extends ButtonTool.View

class GestureTool extends ButtonTool.Model

  nonserializable_attribute_names: () ->
    super().concat(['overlay', 'event_type', 'default_order'])

  defaults: () ->
    return _.extend({}, super(), {
      event_type: @event_type
      default_order: @default_order
    })

module.exports =
  Model: GestureTool
  View: GestureToolView
  ButtonView: GestureToolButtonView
