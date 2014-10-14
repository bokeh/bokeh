
define [
  "backbone"
  "tool/button_tool"
], (Backbone, ButtonTool) ->

  class ActionToolButtonView extends ButtonTool.ButtonView

    _clicked: () ->
      @model.trigger('do')

  class ActionToolView extends ButtonTool.View

    initialize: (options) ->
      super(options)
      @listenTo(@model, 'do', @do)

  class ActionTool extends ButtonTool.Model

  return {
    "Model": ActionTool
    "View": ActionToolView
    "ButtonView": ActionToolButtonView
  }
