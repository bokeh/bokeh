import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"
import {bk_tool_icon_reset} from "styles/icons"

export class ResetToolView extends ActionToolView {
  model: ResetTool

  doit(): void {
    this.plot_view.reset()
  }
}

export namespace ResetTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props
}

export interface ResetTool extends ResetTool.Attrs {}

export class ResetTool extends ActionTool {
  properties: ResetTool.Props

  constructor(attrs?: Partial<ResetTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.default_view = ResetToolView
  }

  tool_name = "Reset"
  icon = bk_tool_icon_reset
}
ResetTool.initClass()
