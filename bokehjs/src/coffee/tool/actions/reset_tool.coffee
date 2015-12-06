ActionTool = require "./action_tool"

class ResetToolView extends ActionTool.View

  do: () ->
    @plot_view.update_range()

class ResetTool extends ActionTool.Model
  default_view: ResetToolView
  type: "ResetTool"
  tool_name: "Reset"
  icon: "bk-tool-icon-reset"

module.exports = {
  Model: ResetTool
  View: ResetToolView
}
