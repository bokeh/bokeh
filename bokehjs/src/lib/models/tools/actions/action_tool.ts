import {ButtonTool, ButtonToolView, ButtonToolButtonView} from "../button_tool"
import {Signal0} from "core/signaling"
import * as p from "core/properties"

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
  export type Attrs = p.AttrsOf<Props>

  export type Props = ButtonTool.Props
}

export interface ActionTool extends ActionTool.Attrs {}

export abstract class ActionTool extends ButtonTool {
  properties: ActionTool.Props

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
