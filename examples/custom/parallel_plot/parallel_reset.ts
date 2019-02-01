import {ActionTool, ActionToolView} from "models/tools/actions/action_tool"

export class ParallelResetToolView extends ActionToolView {
  model: ParallelResetTool

  doit(): void {
    this.plot_view.reset_range()
  }
}

export namespace ParallelResetTool {
  export interface Attrs extends ActionTool.Attrs {}

  export interface Props extends ActionTool.Props {}
}

export interface ParallelResetTool extends ParallelResetTool.Attrs {}

export class ParallelResetTool extends ActionTool {
  properties: ParallelResetTool.Props

  constructor(attrs?: Partial<ParallelResetTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "ParallelResetTool"
    this.prototype.default_view = ParallelResetToolView
  }

  tool_name = "Reset Zoom"
  icon = "bk-tool-icon-reset"
}
ParallelResetTool.initClass()
