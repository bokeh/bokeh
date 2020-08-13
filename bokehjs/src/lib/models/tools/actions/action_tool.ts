import {ButtonTool, ButtonToolView, ButtonToolButtonView} from "../button_tool"
import {Signal} from "core/signaling"
import * as p from "core/properties"

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
    this.connect(this.model.do, (arg: string | undefined) => this.doit(arg))
  }

  abstract doit(arg?: unknown): void
}

export namespace ActionTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ButtonTool.Props
}

export interface ActionTool extends ActionTool.Attrs {}

export abstract class ActionTool extends ButtonTool {
  properties: ActionTool.Props
  __view_type__: ActionToolView

  constructor(attrs?: Partial<ActionTool.Attrs>) {
    super(attrs)
  }

  button_view = ActionToolButtonView

  do = new Signal<string | undefined, this>(this, "do")
}
