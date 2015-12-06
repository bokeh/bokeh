ActionTool = require "./action_tool"

class RedoToolView extends ActionTool.View

  do: () ->
    @plot_view.redo()

class RedoTool extends ActionTool.Model
  default_view: RedoToolView
  type: "RedoTool"
  tool_name: "Redo"
  icon: "bk-tool-icon-redo"

module.exports = {
  Model: RedoTool
  View: RedoToolView
}
