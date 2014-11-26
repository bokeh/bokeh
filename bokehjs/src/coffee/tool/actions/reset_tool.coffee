
define [
  "underscore",
  "common/collection",
  "./action_tool",
], (_, Collection, ActionTool) ->

  class ResetToolView extends ActionTool.View

    do: () ->
      @plot_view.update_range()

  class ResetTool extends ActionTool.Model
    default_view: ResetToolView
    type: "ResetTool"
    tool_name: "Reset"
    icon: "bk-icon-reset"

  class ResetTools extends Collection
    model: ResetTool

  return {
    "Model": ResetTool,
    "Collection": new ResetTools(),
    "View": ResetToolView,
  }
