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

export namespace UndoTool {
  export interface Attrs extends ActionTool.Attrs {}

  export interface Props extends ActionTool.Props {}
}

export interface UndoTool extends UndoTool.Attrs {}

export class UndoTool extends ActionTool {

  properties: UndoTool.Props

  constructor(attrs?: Partial<UndoTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
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
