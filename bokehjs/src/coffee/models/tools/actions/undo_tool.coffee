ActionTool = require "./action_tool"

class UndoToolView extends ActionTool.View

  initialize: (options) ->
    super(options)
    @listenTo(@plot_view, "state_changed", () => @model.set('disabled', not @plot_view.can_undo()))

  do: () ->
    @plot_view.undo()

class UndoTool extends ActionTool.Model
  default_view: UndoToolView
  type: "UndoTool"
  tool_name: "Undo"
  icon: "bk-tool-icon-undo"

  @override {
    disabled: true
  }

module.exports = {
  Model: UndoTool
  View: UndoToolView
}
