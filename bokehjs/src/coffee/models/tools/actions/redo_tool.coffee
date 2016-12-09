import {ActionTool, ActionToolView} from "./action_tool"

export class RedoToolView extends ActionToolView

  initialize: (options) ->
    super(options)
    @listenTo(@plot_view, "state_changed", () => @model.disabled = not @plot_view.can_redo())

  do: () ->
    @plot_view.redo()

export class RedoTool extends ActionTool
  default_view: RedoToolView
  type: "RedoTool"
  tool_name: "Redo"
  icon: "bk-tool-icon-redo"

  @override {
    disabled: true
  }
