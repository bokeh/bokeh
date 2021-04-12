import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"
import {tool_icon_reset} from "styles/icons.css"

export class ResetToolView extends ActionToolView {
  model: ResetTool

  doit(): void {
    // reset() issues the RangesUpdate event
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
  __view_type__: ResetToolView

  constructor(attrs?: Partial<ResetTool.Attrs>) {
    super(attrs)
  }

  static init_ResetTool(): void {
    this.prototype.default_view = ResetToolView

    this.register_alias("reset", () => new ResetTool())
  }

  tool_name = "Reset"
  icon = tool_icon_reset
}
