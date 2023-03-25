import {PlotActionTool, PlotActionToolView} from "models/tools/actions/plot_action_tool"
import * as p from "core/properties"

export class ParallelResetToolView extends PlotActionToolView {
  declare model: ParallelResetTool

  doit(): void {
    this.plot_view.reset_range()
  }
}

export namespace ParallelResetTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = PlotActionTool.Props
}

export interface ParallelResetTool extends ParallelResetTool.Attrs {}

export class ParallelResetTool extends PlotActionTool {
  declare properties: ParallelResetTool.Props
  declare __view_type__: ParallelResetToolView

  constructor(attrs?: Partial<ParallelResetTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ParallelResetToolView
  }

  tool_name = "Reset Zoom"
  tool_icon = "bk-tool-icon-reset"
}
