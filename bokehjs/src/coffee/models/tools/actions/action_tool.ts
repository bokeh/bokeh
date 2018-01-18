import {ButtonTool, ButtonToolView, ButtonToolButtonView} from "../button_tool"
import {Signal} from "core/signaling"

export class ActionToolButtonView extends ButtonToolButtonView {

  model: ActionTool

  protected _clicked(): void {
    this.model.do.emit(undefined)
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

export abstract class ActionTool extends ButtonTool {

  static initClass() {
    this.prototype.type = "ActionTool"
  }

  button_view = ActionToolButtonView

  do = new Signal<void, this>(this, "do")
}

ActionTool.initClass()
