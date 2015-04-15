ButtonTool = require "../button_tool"

class ActionToolButtonView extends ButtonTool.ButtonView

  _clicked: () ->
    @model.trigger('do')

class ActionToolView extends ButtonTool.View

  initialize: (options) ->
    super(options)
    @listenTo(@model, 'do', @do)

class ActionTool extends ButtonTool.Model

module.exports =
  Model: ActionTool
  View: ActionToolView
  ButtonView: ActionToolButtonView