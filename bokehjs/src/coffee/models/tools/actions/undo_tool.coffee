import {ActionTool, ActionToolView} from "./action_tool"

export class UndoToolView extends ActionToolView

  initialize: (options) ->
    super(options)
    @connect(@plot_view.state_changed, () => @model.disabled = not @plot_view.can_undo())

  doit: () ->
    @plot_view.undo()

export class UndoTool extends ActionTool
  default_view: UndoToolView
  type: "UndoTool"
  tool_name: "Undo"
  icon: "bk-tool-icon-undo"

  @override {
    disabled: true
  }
