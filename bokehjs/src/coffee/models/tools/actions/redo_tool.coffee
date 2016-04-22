ActionTool = require "./action_tool"

class RedoToolView extends ActionTool.View

  initialize: (options) ->
    super(options)
    @listenTo(@plot_view, "state_changed", () => @model.set('disabled', not @plot_view.can_redo()))

  do: () ->
    @plot_view.redo()

class RedoTool extends ActionTool.Model
  default_view: RedoToolView
  type: "RedoTool"
  tool_name: "Redo"
  icon: "bk-tool-icon-redo"

  @override {
    disabled: true
  }

module.exports = {
  Model: RedoTool
  View: RedoToolView
}
