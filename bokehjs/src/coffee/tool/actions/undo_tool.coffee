ActionTool = require "./action_tool"

class UndoToolView extends ActionTool.View

  do: () ->
    @plot_view.undo()

class UndoTool extends ActionTool.Model
  default_view: UndoToolView
  type: "UndoTool"
  tool_name: "Undo"
  icon: "bk-tool-icon-undo"

module.exports = {
  Model: UndoTool
  View: UndoToolView
}
