import {ActionTool, ActionToolView} from "models/tools/actions/action_tool"
import * as p from "core/properties"

export class ParallelResetToolView extends ActionToolView {
  model: ParallelResetTool

  doit(): void {
    this.plot_view.reset_range()
  }
}

export namespace ParallelResetTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props
}

export interface ParallelResetTool extends ParallelResetTool.Attrs {}

export class ParallelResetTool extends ActionTool {
  properties: ParallelResetTool.Props

  constructor(attrs?: Partial<ParallelResetTool.Attrs>) {
    super(attrs)
  }

  static init_ParallelResetTool(): void {
    this.prototype.default_view = ParallelResetToolView
  }

  tool_name = "Reset Zoom"
  icon = "bk-tool-icon-reset"
}
