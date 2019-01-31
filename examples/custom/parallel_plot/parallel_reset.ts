import {ActionTool, ActionToolView} from "models/tools/actions/action_tool"
import {values} from "core/util/object"

export class ParallelResetToolView extends ActionToolView {
  model: ParallelResetTool

  doit(): void {
    const plot = this.plot_model.plot
    plot.x_range.reset()
    plot.y_range.reset()
    values(plot.extra_y_ranges).forEach(element => element.reset())
  }
}

export class ParallelResetTool extends ActionTool {

  static initClass(): void {
    this.prototype.type = "ParallelResetTool"
    this.prototype.default_view = ParallelResetToolView
  }

  tool_name = "Reset Zoom"
  icon = "bk-tool-icon-reset"
}
ParallelResetTool.initClass()
