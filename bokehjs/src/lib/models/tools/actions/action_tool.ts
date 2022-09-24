import {Tool, ToolView} from "../tool"
import {ClickButton} from "../click_button"
import {LayoutDOMView} from "../../layouts/layout_dom"
import {Signal} from "core/signaling"
import * as p from "core/properties"

export abstract class ActionToolView extends ToolView {
  override model: ActionTool
  override readonly parent: LayoutDOMView

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.do, (arg: string | undefined) => this.doit(arg))
  }

  abstract doit(arg?: unknown): void
}

export namespace ActionTool {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Tool.Props
}

export interface ActionTool extends ActionTool.Attrs {}

export abstract class ActionTool extends Tool {
  override properties: ActionTool.Props
  override __view_type__: ActionToolView

  constructor(attrs?: Partial<ActionTool.Attrs>) {
    super(attrs)
  }

  do = new Signal<string | undefined, this>(this, "do")

  override tool_button(): ClickButton {
    return new ClickButton({tool: this})
  }
}
