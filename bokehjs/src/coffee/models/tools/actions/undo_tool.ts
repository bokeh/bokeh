import {ActionTool, ActionToolView} from "./action_tool"

export class UndoToolView extends ActionToolView {

  model: UndoTool

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.plot_view.state_changed, () => this.model.disabled = !this.plot_view.can_undo())
  }

  doit(): void {
    this.plot_view.undo()
  }
}

export class UndoTool extends ActionTool {

  static initClass() {
    this.prototype.type = "UndoTool"

    this.prototype.default_view = UndoToolView

    this.override({
      disabled: true,
    })
  }

  tool_name = "Undo"
  icon = "bk-tool-icon-undo"
}

UndoTool.initClass()
