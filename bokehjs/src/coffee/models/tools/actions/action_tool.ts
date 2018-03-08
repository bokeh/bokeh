import {ButtonTool, ButtonToolView, ButtonToolButtonView} from "../button_tool"
import {Signal0} from "core/signaling"

export class ActionToolButtonView extends ButtonToolButtonView {
  model: ActionTool

  protected _clicked(): void {
    this.model.do.emit()
  }
}

export abstract class ActionToolView extends ButtonToolView {
  model: ActionTool

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.do, () => this.doit())
  }

  abstract doit(): void
}

export namespace ActionTool {
  export interface Attrs extends ButtonTool.Attrs {}
}

export interface ActionTool extends ActionTool.Attrs {}

export abstract class ActionTool extends ButtonTool {

  constructor(attrs?: Partial<ActionTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "ActionTool"
  }

  button_view = ActionToolButtonView

  do = new Signal0<this>(this, "do")
}

ActionTool.initClass()
