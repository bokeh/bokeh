import {ActionTool, ActionToolView} from "./action_tool"

export class RedoToolView extends ActionToolView {
  model: RedoTool

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.plot_view.state_changed, () => this.model.disabled = !this.plot_view.can_redo())
  }

  doit(): void {
    this.plot_view.redo()
  }
}

export namespace RedoTool {
  export interface Attrs extends ActionTool.Attrs {}

  export interface Opts extends ActionTool.Opts {}
}

export interface RedoTool extends RedoTool.Attrs {}

export class RedoTool extends ActionTool {

  static initClass() {
    this.prototype.type = "RedoTool"
    this.prototype.default_view = RedoToolView

    this.override({
      disabled: true,
    })
  }

  tool_name = "Redo"
  icon = "bk-tool-icon-redo"
}

RedoTool.initClass()
