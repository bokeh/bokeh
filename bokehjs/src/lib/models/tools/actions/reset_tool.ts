import {PlotActionTool, PlotActionToolView} from "./plot_action_tool"
import type {KeyBinding} from "../tool"
import type * as p from "core/properties"
import {tool_icon_reset} from "styles/icons.css"

export class ResetToolView extends PlotActionToolView {
  declare model: ResetTool

  doit(): void {
    // reset() issues the RangesUpdate event
    this.plot_view.reset()
  }

  override key_bindings(): KeyBinding[] {
    return [
      ...super.key_bindings(),
      {keys: ["R"], cmd: "reset", action: () => this.doit()},
    ]
  }
}

export namespace ResetTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = PlotActionTool.Props
}

export interface ResetTool extends ResetTool.Attrs {}

export class ResetTool extends PlotActionTool {
  declare properties: ResetTool.Props
  declare __view_type__: ResetToolView

  constructor(attrs?: Partial<ResetTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ResetToolView

    this.register_alias("reset", () => new ResetTool())
  }

  override tool_name = "Reset"
  override tool_icon = tool_icon_reset
}
