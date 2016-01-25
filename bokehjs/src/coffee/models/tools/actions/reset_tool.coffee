ActionTool = require "./action_tool"

class ResetToolView extends ActionTool.View

  do: () ->
    @plot_view.clear_state()
    @plot_view.reset_range()
    @plot_view.reset_selection()
    @plot_view.reset_dimensions()

class ResetTool extends ActionTool.Model
  default_view: ResetToolView
  type: "ResetTool"
  tool_name: "Reset"
  icon: "bk-tool-icon-reset"

module.exports = {
  Model: ResetTool
  View: ResetToolView
}
